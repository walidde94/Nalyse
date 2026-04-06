import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { AppDataSource } from '../config/database';
import { File } from '../entities/File';
import fs from 'fs';
import path from 'path';
import { parse } from 'csv-parse/sync';
import { runLinearForecast, runHoltWintersForecast } from '../services/forecastEngine';

export const runForecastHandler = async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const { targetColumn, timeColumn, modelType, periods } = req.body;
    const userId = req.user?.userId;

    if (!userId) return res.status(401).json({ error: 'Unauthorized' });
    if (!targetColumn) return res.status(400).json({ error: 'targetColumn is required' });

    const fileRepo = AppDataSource.getRepository(File);

    try {
        const file = await fileRepo.findOne({ where: { id: id as string, isDeleted: false } });
        if (!file || file.ownerId !== userId) return res.status(404).json({ error: 'File not found' });

        const filePath = file.s3Key || file.filename;
        const uploadsDir = process.env.UPLOAD_DIR || path.resolve(process.cwd(), 'uploads');
        let absolutePath = filePath;
        if (!filePath.includes('/') && !filePath.includes('\\')) {
            absolutePath = path.join(uploadsDir, filePath);
        } else {
            absolutePath = path.resolve(process.cwd(), filePath);
        }

        if (!fs.existsSync(absolutePath)) {
            return res.status(422).json({
                error: 'FILE_NOT_FOUND',
                message: `The dataset "${file.originalName || file.filename}" needs to be re-uploaded. It seems to have been removed from server storage.`,
                fileId: file.id
            });
        }

        const rawContent = fs.readFileSync(absolutePath);
        let allData: any[] = [];

        if (file.mimeType.includes('json') || file.filename.endsWith('.json')) {
            const parsed = JSON.parse(rawContent.toString());
            allData = Array.isArray(parsed) ? parsed : [parsed];
        } else if (file.mimeType.includes('csv') || file.filename.endsWith('.csv')) {
            allData = parse(rawContent, {
                columns: true, skip_empty_lines: true, relax_column_count: true, trim: true
            });
        } else {
            return res.status(400).json({ error: 'Unsupported file type for forecasting' });
        }

        if (allData.length === 0) return res.status(400).json({ error: 'Dataset is empty' });
        if (!(targetColumn in allData[0])) return res.status(400).json({ error: `Column ${targetColumn} not found` });

        // Sort by timeColumn if provided
        if (timeColumn && timeColumn in allData[0]) {
            allData.sort((a, b) => {
                const dateA = new Date(a[timeColumn]).getTime();
                const dateB = new Date(b[timeColumn]).getTime();
                return dateA - dateB;
            });
        }

        // Extract and clean numeric target data
        const maxPoints = 500; // Limit for performance so simple-stats doesn't hang
        const extractedData: number[] = [];
        const xAxisLabels: string[] = [];
        
        // Take an even sample if data is huge, or just the end of the dataset
        const startIdx = allData.length > maxPoints ? allData.length - maxPoints : 0;
        
        for (let i = startIdx; i < allData.length; i++) {
            const row = allData[i];
            const val = parseFloat(row[targetColumn]);
            if (!isNaN(val)) {
                extractedData.push(val);
                xAxisLabels.push(timeColumn ? String(row[timeColumn]) : `Period ${extractedData.length}`);
            }
        }

        if (extractedData.length < 5) return res.status(400).json({ error: 'Not enough valid numeric data points to forecast (minimum 5 required)' });

        const forecastPeriods = parseInt(periods) || 12;
        let result: any;

        // Run Math Engine
        if (modelType === 'exponential' || modelType === 'arima') {
            result = runHoltWintersForecast(extractedData, forecastPeriods);
        } else {
            result = runLinearForecast(extractedData, forecastPeriods);
        }

        // Format for frontend
        const chartData: any[] = [];
        // 1. Add historical actuals
        for (let i = 0; i < extractedData.length; i++) {
            chartData.push({
                period: xAxisLabels[i],
                actual: extractedData[i],
                forecast: null,
                confidenceBounds: null
            });
        }
        
        // Connect the lines seamlessly
        const lastIdx = chartData.length - 1;
        chartData[lastIdx].forecast = chartData[lastIdx].actual;
        chartData[lastIdx].confidenceBounds = [chartData[lastIdx].actual, chartData[lastIdx].actual];

        // 2. Add forecast trajectory
        let periodCounter = 1;
        for (const f of result.forecast) {
            chartData.push({
                period: timeColumn ? `+${periodCounter} Steps` : `Period ${extractedData.length + periodCounter}`,
                actual: null,
                forecast: parseFloat(f.value.toFixed(2)),
                confidenceBounds: [parseFloat(f.lowerBound.toFixed(2)), parseFloat(f.upperBound.toFixed(2))]
            });
            periodCounter++;
        }

        // Return unified response
        res.json({
            metrics: {
                rSquared: result.metrics.rSquared !== null ? result.metrics.rSquared.toFixed(3) : 'N/A',
                rmse: result.metrics.rmse.toFixed(2),
                direction: result.metrics.direction,
                confidence: result.metrics.confidence
            },
            data: chartData
        });

    } catch (error: any) {
        console.error('[Forecast Error]', error);
        res.status(500).json({ error: 'Failed to run forecast engine', details: error.message });
    }
};

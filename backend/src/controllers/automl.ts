import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { AppDataSource } from '../config/database';
import { File } from '../entities/File';
import fs from 'fs';
import path from 'path';
import { parse } from 'csv-parse/sync';
// @ts-ignore
import { kmeans } from 'ml-kmeans';

export const runKMeansHandler = async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const { featureX, featureY, clusters } = req.body;
    const userId = req.user?.userId;

    if (!userId) return res.status(401).json({ error: 'Unauthorized' });
    if (!featureX || !featureY) return res.status(400).json({ error: 'featureX and featureY are required' });

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
            return res.status(400).json({ error: 'Unsupported file type for clustering' });
        }

        if (allData.length === 0) return res.status(400).json({ error: 'Dataset is empty' });

        const extractedData: number[][] = [];
        const originalRows: any[] = [];
        
        // Take a deterministic sample to avoid hanging the ML engine (max 1500 points)
        const step = Math.max(1, Math.floor(allData.length / 1500));
        
        for (let i = 0; i < allData.length; i += step) {
            const row = allData[i];
            const x = parseFloat(row[featureX]);
            const y = parseFloat(row[featureY]);
            if (!isNaN(x) && !isNaN(y)) {
                extractedData.push([x, y]);
                originalRows.push(row);
            }
        }

        if (extractedData.length < 10) return res.status(400).json({ error: 'Not enough valid numeric data points to cluster (minimum 10 required)' });

        const k = clusters && clusters > 1 ? clusters : 3;

        // Run K-Means
        const ans = kmeans(extractedData, k, { initialization: 'kmeans++' });

        const responseData = extractedData.map((pt, i) => {
            return {
                x: pt[0],
                y: pt[1],
                cluster: ans.clusters[i],
                raw: originalRows[i]
            };
        });

        res.json({
            metrics: {
                iterations: ans.iterations,
                centroids: ans.centroids
            },
            data: responseData
        });

    } catch (error: any) {
        console.error('[AutoML Error]', error);
        res.status(500).json({ error: 'Failed to run AutoML engine', details: error.message });
    }
};

import fs from 'fs';
import path from 'path';
import { parse } from 'csv-parse/sync';
import * as xlsx from 'xlsx';
import { XMLParser } from 'fast-xml-parser';
import { AnalysisResult, AdvancedColumnType, Insight, AnalysisOption } from './types';
import { inferColumnType, performDataCleaning } from './cleaner';
import { generateInventoryInsights, generateCategoryInsights, generateTimeSeriesAnalysis, generateCorrelations, generateEntityInsights, generateKeyMetrics } from './stats';
import { analyzePDF, analyzeHTML } from './document';
import { ReasoningEngine } from './reasoning';

export const analyzeRawData = (records: any[], sourceName: string = 'Data'): AnalysisResult => {
    if (!records || records.length === 0) {
        return {
            type: 'Empty',
            summary: { rows: 0, columns: 0, columnTypes: {} },
            options: [],
            aiInsights: [],
            keyFindings: [],
            dataLimitations: ['Dataset is empty'],
            processingLog: [],
            sampleData: [],
            dataHealth: { score: 0, issues: ['No data'], cleanedRows: 0, columnHealth: [] }
        };
    }

    const initialColumns = Object.keys(records[0] as object);

    // 1. Clean Data
    const cleaningResult = performDataCleaning(records, initialColumns);
    const cleanRecords = cleaningResult.data;
    const validColumns = cleanRecords.length > 0 ? Object.keys(cleanRecords[0]) : [];

    if (cleanRecords.length === 0) {
        return {
            type: 'Empty (All filtered)',
            summary: { rows: 0, columns: 0, columnTypes: {} },
            options: [],
            aiInsights: [],
            keyFindings: [],
            dataLimitations: ['All rows were filtered out as empty or duplicates'],
            processingLog: cleaningResult.log,
            sampleData: [],
            dataHealth: cleaningResult.stats
        };
    }

    // 2. Infer Types
    const colTypes: Record<string, AdvancedColumnType> = {};
    const dataLimitations: string[] = [];

    validColumns.forEach(col => {
        const values = cleanRecords.map(r => r[col]);
        colTypes[col] = inferColumnType(col, values);

        // Update cleaner stats with real type
        const health = cleaningResult.stats.columnHealth.find(h => h.column === col);
        if (health) health.type = colTypes[col];
    });

    // 3. Generate Statistics & Insights
    const ignoreList = /id|idx|index|uid|uuid|timestamp|created_at|updated_at|serial|row|rank/i;

    const categories = validColumns.filter(c =>
        ['category', 'country', 'city'].includes(colTypes[c]) && !ignoreList.test(c)
    );
    const texts = validColumns.filter(c => colTypes[c] === 'text' && !ignoreList.test(c));
    const numbers = validColumns.filter(c =>
        ['number', 'currency', 'percent'].includes(colTypes[c]) && !ignoreList.test(c)
    );
    const dates = validColumns.filter(c => colTypes[c] === 'date');

    let allInsights: Insight[] = [];
    let allOptions: AnalysisOption[] = [];

    // Run modular analysis
    const catRes = generateCategoryInsights(cleanRecords, [...categories, ...texts], numbers); // Use texts as fallback categories
    allInsights = [...allInsights, ...catRes.insights];
    allOptions = [...allOptions, ...catRes.options];

    const timeRes = generateTimeSeriesAnalysis(cleanRecords, dates, numbers); // Fallback to Volume is internal to timeRes
    allInsights = [...allInsights, ...timeRes.insights];
    allOptions = [...allOptions, ...timeRes.options];

    const entityRes = generateEntityInsights(cleanRecords, validColumns);
    allInsights = [...allInsights, ...entityRes.insights];
    allOptions = [...allOptions, ...entityRes.options];

    const invRes = generateInventoryInsights(cleanRecords, validColumns, colTypes);
    allInsights = [...allInsights, ...invRes.insights];
    allOptions = [...allOptions, ...invRes.options];

    const corrRes = generateCorrelations(cleanRecords, numbers);
    allInsights = [...allInsights, ...corrRes.insights];
    allOptions = [...allOptions, ...corrRes.options];

    // Fallback if no charts
    if (allOptions.length === 0 && categories.length > 0) {
        const cat = categories[0];
        const counts: Record<string, number> = {};
        cleanRecords.forEach(r => counts[r[cat]] = (counts[r[cat]] || 0) + 1);
        const data = Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 10);
        allOptions.push({
            id: 'basic-dist',
            title: `Distribution of ${cat}`,
            description: 'Count by category',
            chartType: 'pie',
            data: data.map(([name, value]) => ({ name, value }))
        });
    }

    const keyFindings = allInsights.filter(i => i.confidence > 0.85);

    const result: AnalysisResult = {
        type: cleanRecords.length > 0 ? 'Enterprise Strategic Intelligence' : 'Awaiting Data',
        summary: {
            rows: cleanRecords.length,
            columns: validColumns.length,
            columnTypes: colTypes
        },
        options: allOptions.slice(0, 20),
        aiInsights: allInsights,
        keyFindings,
        dataLimitations,
        processingLog: cleaningResult.log,
        sampleData: cleanRecords.slice(0, 50000), // Safety limit: 50k rows for frontend grid to prevent API crash
        dataHealth: cleaningResult.stats,
        metrics: generateKeyMetrics(cleanRecords, validColumns, cleaningResult.stats.score)
    };

    // 4. Expert Reasoning Synthesis
    if (cleanRecords.length > 0) {
        cleaningResult.log.push("🧠 Analysis Phase: Beginning institutional context mapping...");
        result.executiveReasoning = ReasoningEngine.synthesize(result);
        cleaningResult.log.push("✨ Synthesis Phase: Executive intelligence package assembled.");
    }

    return result;
};

export const analyzeFile = async (filePath: string, mimetype: string): Promise<AnalysisResult> => {
    try {


        // Handle bare filenames by assuming they are in uploads/
        if (!filePath.includes('/') && !filePath.includes('\\')) {
            filePath = path.join('uploads', filePath);

        }

        const absoluteUploadsDir = path.resolve(process.cwd(), 'uploads');
        const absoluteRequestedPath = path.resolve(process.cwd(), filePath);



        if (!absoluteRequestedPath.startsWith(absoluteUploadsDir)) {

            throw new Error('Security Error: Unauthorized file path access attempt.');
        }

        if (!fs.existsSync(absoluteRequestedPath)) {
            const err = new Error(`FILE_NOT_FOUND: The physical file is missing from the server. This can happen on cloud platforms with ephemeral storage (like Render). Please re-upload the dataset.`);
            (err as any).code = 'FILE_NOT_FOUND';
            throw err;
        }

        const stats = fs.statSync(absoluteRequestedPath);
        if (stats.size > 500 * 1024 * 1024) { // 500MB Limit
            throw new Error('Analysis Error: File exceeds 500MB analyzer memory limit. Use streaming export.');
        }

        const buffer = fs.readFileSync(absoluteRequestedPath);

        if (mimetype === 'application/pdf' || filePath.endsWith('.pdf')) {
            return await analyzePDF(buffer);
        }

        if (mimetype === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' || filePath.endsWith('.xlsx') || mimetype === 'application/vnd.ms-excel' || filePath.endsWith('.xls')) {
            const workbook = xlsx.read(buffer, { type: 'buffer' });
            const sheetName = workbook.SheetNames[0];
            if (!sheetName) throw new Error("Excel file is empty");
            const records: any[] = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName]);
            return analyzeRawData(records, 'Excel File');
        }

        const content = buffer.toString('utf-8');

        if (mimetype === 'text/html' || filePath.endsWith('.html')) {

            return analyzeHTML(content);
        }

        if (mimetype === 'application/json' || filePath.endsWith('.json')) {
            const data = JSON.parse(content);
            if (Array.isArray(data)) return analyzeRawData(data, 'JSON File');
            if (typeof data === 'object') return analyzeRawData([data], 'JSON Object');
        }

        if (mimetype === 'application/xml' || mimetype === 'text/xml' || filePath.endsWith('.xml')) {
            const parser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: "" });
            const jsonObj = parser.parse(content);

            let records: any[] = [];
            // Recursively search for the first array in the XML structure to represent rows
            const extractRecords = (obj: any) => {
                if (records.length > 0) return;
                if (Array.isArray(obj)) {
                    records = obj;
                } else if (typeof obj === 'object' && obj !== null) {
                    for (const key of Object.keys(obj)) {
                        if (Array.isArray(obj[key])) {
                            records = obj[key];
                            return;
                        } else {
                            extractRecords(obj[key]);
                        }
                    }
                }
            };
            extractRecords(jsonObj);

            if (records.length === 0 && typeof jsonObj === 'object') {
                records = [jsonObj];
            }

            return analyzeRawData(records, 'XML File');
        }

        if (mimetype === 'text/csv' || filePath.endsWith('.csv')) {
            const records = parse(content, {
                columns: true,
                skip_empty_lines: true,
                relax_column_count: true,
                relax_quotes: true,
                cast: true
            });
            return analyzeRawData(records, 'CSV File');
        }

        return {
            type: 'Unsupported',
            summary: { rows: 0, columns: 0, columnTypes: {} },
            options: [],
            aiInsights: [],
            keyFindings: [],
            dataLimitations: ['Unsupported file type'],
            processingLog: [],
            sampleData: [],
            dataHealth: { score: 0, issues: [], cleanedRows: 0, columnHealth: [] }
        };

    } catch (e: any) {
        console.error('Analysis Error:', e);
        return {
            type: 'Error',
            summary: { rows: 0, columns: 0, columnTypes: {} },
            options: [],
            aiInsights: [],
            keyFindings: [],
            dataLimitations: [`Error processing file: ${e.message}`],
            processingLog: [],
            sampleData: [],
            dataHealth: { score: 0, issues: [`Error processing file: ${e.message}`], cleanedRows: 0, columnHealth: [] }
        };
    }
};

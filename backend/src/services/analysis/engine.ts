// ═══════════════════════════════════════════════════════════════════════════════
// Nalyse Analysis Engine v3.0 — Core Orchestrator
// The central pipeline that: parses files → cleans data → infers types →
// generates statistics → detects patterns → synthesizes executive intelligence
// ═══════════════════════════════════════════════════════════════════════════════

import fs from 'fs';
import path from 'path';
import { parse } from 'csv-parse/sync';
import * as xlsx from 'xlsx';
import { XMLParser } from 'fast-xml-parser';
import { AnalysisResult, AdvancedColumnType, Insight, AnalysisOption } from './types';
import { inferColumnType, performDataCleaning, computeColumnStatistics } from './cleaner';
import {
    generateInventoryInsights,
    generateCategoryInsights,
    generateTimeSeriesAnalysis,
    generateCorrelations,
    generateEntityInsights,
    generateDistributionInsights,
    generateKeyMetrics
} from './stats';
import { analyzePDF, analyzeHTML } from './document';
import { ReasoningEngine } from './reasoning';

// ─── Constants ──────────────────────────────────────────────────────────────

const MAX_FILE_SIZE = 500 * 1024 * 1024;      // 500MB
const MAX_SAMPLE_ROWS = 50_000;                 // Frontend grid safety limit
const MAX_CHART_OPTIONS = 24;                   // Max charts to return
const IGNORE_COLUMNS = /^(id|idx|index|uid|uuid|timestamp|created_at|updated_at|serial|row_?num|record_?id|_id|__v)$/i;

// ─── Core Analysis Pipeline ─────────────────────────────────────────────────

export const analyzeRawData = (records: any[], sourceName: string = 'Data'): AnalysisResult => {
    const t0 = performance.now();

    // Guard: Empty data
    if (!records || records.length === 0) {
        return emptyResult('Empty', ['Dataset is empty']);
    }

    const initialColumns = Object.keys(records[0] as object);

    // ── Phase 1: Data Cleaning & Type Inference ──
    const cleaning = performDataCleaning(records, initialColumns);
    const data = cleaning.data;
    const log = cleaning.log;

    if (data.length === 0) {
        return {
            ...emptyResult('Empty (All Filtered)', ['All rows were empty or duplicates']),
            processingLog: log,
            dataHealth: cleaning.stats
        };
    }

    const columns = Object.keys(data[0]);
    const colTypes: Record<string, AdvancedColumnType> = {};
    const dataLimitations: string[] = [];

    // Use pre-computed types from cleaner (already inferred during cleaning)
    for (const col of columns) {
        const health = cleaning.stats.columnHealth.find(h => h.column === col);
        colTypes[col] = (health?.type as AdvancedColumnType) || inferColumnType(col, data.map(r => r[col]));
    }

    // ── Phase 2: Column Classification ──
    const dimensions: string[] = [];
    const measures: string[] = [];
    const numericTypes = new Set(['number', 'currency', 'percent']);

    for (const col of columns) {
        if (IGNORE_COLUMNS.test(col)) continue;

        if (numericTypes.has(colTypes[col])) {
            measures.push(col);
        } else if (['category', 'country', 'city', 'text', 'boolean'].includes(colTypes[col])) {
            dimensions.push(col);
        }
    }

    const dates = columns.filter(c => colTypes[c] === 'date');

    log.push(`📐 Classified: ${dimensions.length} dimensions, ${measures.length} measures, ${dates.length} temporal`);

    // ── Phase 3: Multi-Dimensional Analysis ──
    let allInsights: Insight[] = [];
    let allOptions: AnalysisOption[] = [];

    // Category × Measure analysis
    if (dimensions.length > 0) {
        const catRes = generateCategoryInsights(data, dimensions, measures);
        allInsights.push(...catRes.insights);
        allOptions.push(...catRes.options);
    }

    // Time series analysis
    if (dates.length > 0) {
        const timeRes = generateTimeSeriesAnalysis(data, dates, measures);
        allInsights.push(...timeRes.insights);
        allOptions.push(...timeRes.options);
    }

    // Entity analysis (email, geo, company, web)
    const entityRes = generateEntityInsights(data, columns);
    allInsights.push(...entityRes.insights);
    allOptions.push(...entityRes.options);

    // Inventory/stock analysis
    const invRes = generateInventoryInsights(data, columns, colTypes);
    allInsights.push(...invRes.insights);
    allOptions.push(...invRes.options);

    // Numeric correlation matrix
    if (measures.length >= 2) {
        const corrRes = generateCorrelations(data, measures);
        allInsights.push(...corrRes.insights);
        allOptions.push(...corrRes.options);
    }

    // Distribution analysis (histograms, skewness)
    if (measures.length > 0 && cleaning.columnStats) {
        const distRes = generateDistributionInsights(data, measures, cleaning.columnStats);
        allInsights.push(...distRes.insights);
        allOptions.push(...distRes.options);
    }

    // ── Phase 4: Smart Fallback ──
    if (allOptions.length === 0 && dimensions.length > 0) {
        const cat = dimensions[0];
        const counts = new Map<string, number>();
        for (const r of data) {
            const key = String(r[cat] || 'N/A');
            counts.set(key, (counts.get(key) || 0) + 1);
        }

        const chartData = Array.from(counts.entries())
            .map(([name, value]) => ({ name, value }))
            .sort((a, b) => b.value - a.value)
            .slice(0, 10);

        allOptions.push({
            id: 'fallback-dist',
            title: `Distribution of ${cat}`,
            description: `Record frequency across ${counts.size} unique values.`,
            chartType: chartData.length <= 6 ? 'pie' : 'bar',
            data: chartData,
            priority: 3
        });
    }

    // Sort options by priority (higher = more important = first)
    allOptions.sort((a, b) => (b.priority || 0) - (a.priority || 0));

    // Deduplicate insights by ID
    const seenInsightIds = new Set<string>();
    allInsights = allInsights.filter(i => {
        if (seenInsightIds.has(i.id)) return false;
        seenInsightIds.add(i.id);
        return true;
    });

    // Key findings = high-confidence insights
    const keyFindings = allInsights
        .filter(i => i.confidence > 0.85)
        .sort((a, b) => b.confidence - a.confidence);

    // ── Phase 5: Result Assembly ──
    const result: AnalysisResult = {
        type: 'Enterprise Strategic Intelligence',
        summary: {
            rows: data.length,
            columns: columns.length,
            columnTypes: colTypes,
            dimensions,
            measures,
            statistics: cleaning.columnStats
        },
        options: allOptions.slice(0, MAX_CHART_OPTIONS),
        aiInsights: allInsights,
        keyFindings,
        dataLimitations,
        processingLog: log,
        sampleData: data.slice(0, MAX_SAMPLE_ROWS),
        dataHealth: cleaning.stats,
        metrics: generateKeyMetrics(data, columns, cleaning.stats.score, cleaning.columnStats)
    };

    // ── Phase 6: Executive Reasoning Synthesis ──
    log.push('🧠 Synthesizing executive intelligence...');
    result.executiveReasoning = ReasoningEngine.synthesize(result);
    log.push('✨ Executive intelligence package assembled.');

    // Timing
    result.processingTimeMs = Math.round(performance.now() - t0);
    log.push(`⏱️ Total processing: ${result.processingTimeMs}ms for ${data.length.toLocaleString()} records`);

    return result;
};

// ─── File Parser ────────────────────────────────────────────────────────────

export const analyzeFile = async (filePath: string, mimetype: string): Promise<AnalysisResult> => {
    try {
        const uploadDir = process.env.UPLOAD_DIR || path.join(process.cwd(), 'uploads');

        // Resolve bare filenames
        if (!filePath.includes('/') && !filePath.includes('\\')) {
            filePath = path.join(uploadDir, filePath);
        }

        const absoluteUploadsDir = path.resolve(uploadDir);
        const absoluteRequestedPath = path.resolve(filePath);

        // Security: prevent directory traversal
        if (!absoluteRequestedPath.startsWith(absoluteUploadsDir)) {
            throw new Error('Security Error: Unauthorized file path access attempt.');
        }

        // Existence check
        if (!fs.existsSync(absoluteRequestedPath)) {
            const err = new Error(
                'The physical file is no longer available on the server. ' +
                'This typically happens on cloud platforms with ephemeral storage. ' +
                'Please re-upload the dataset from the Dashboard.'
            );
            (err as any).code = 'FILE_NOT_FOUND';
            throw err;
        }

        // Size check
        const stats = fs.statSync(absoluteRequestedPath);
        if (stats.size > MAX_FILE_SIZE) {
            throw new Error(`File exceeds ${MAX_FILE_SIZE / (1024 * 1024)}MB limit. Consider splitting the dataset.`);
        }

        const buffer = fs.readFileSync(absoluteRequestedPath);
        const ext = path.extname(absoluteRequestedPath).toLowerCase();

        // ── PDF ──
        if (mimetype === 'application/pdf' || ext === '.pdf') {
            return await analyzePDF(buffer);
        }

        // ── Excel (XLSX/XLS) ──
        if (mimetype === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
            mimetype === 'application/vnd.ms-excel' ||
            ext === '.xlsx' || ext === '.xls') {
            return parseExcel(buffer);
        }

        const content = buffer.toString('utf-8');

        // ── HTML ──
        if (mimetype === 'text/html' || ext === '.html' || ext === '.htm') {
            return analyzeHTML(content);
        }

        // ── JSON ──
        if (mimetype === 'application/json' || ext === '.json') {
            return parseJSON(content);
        }

        // ── XML ──
        if (mimetype === 'application/xml' || mimetype === 'text/xml' || ext === '.xml') {
            return parseXML(content);
        }

        // ── CSV (default for text) ──
        if (mimetype === 'text/csv' || ext === '.csv' || mimetype === 'text/plain') {
            return parseCSV(content);
        }

        return emptyResult('Unsupported', ['Unsupported file type. Supported: CSV, XLSX, JSON, XML, PDF, HTML.']);

    } catch (e: any) {
        console.error('Analysis Engine Error:', e);

        // Re-throw FILE_NOT_FOUND so controller can send proper HTTP status
        if (e.code === 'FILE_NOT_FOUND') throw e;

        return {
            ...emptyResult('Error', [`Processing error: ${e.message}`]),
            dataHealth: {
                score: 0,
                issues: [e.message],
                cleanedRows: 0,
                columnHealth: []
            }
        };
    }
};

// ─── Format Parsers ─────────────────────────────────────────────────────────

function parseCSV(content: string): AnalysisResult {
    // Auto-detect delimiter
    const firstLine = content.split('\n')[0] || '';
    const tabCount = (firstLine.match(/\t/g) || []).length;
    const commaCount = (firstLine.match(/,/g) || []).length;
    const semiCount = (firstLine.match(/;/g) || []).length;

    let delimiter = ',';
    if (tabCount > commaCount && tabCount > semiCount) delimiter = '\t';
    else if (semiCount > commaCount) delimiter = ';';

    const records = parse(content, {
        columns: true,
        skip_empty_lines: true,
        relax_column_count: true,
        relax_quotes: true,
        cast: true,
        delimiter,
        trim: true
    });

    return analyzeRawData(records, 'CSV');
}

function parseExcel(buffer: Buffer): AnalysisResult {
    const workbook = xlsx.read(buffer, { type: 'buffer', cellDates: true });

    // Process first sheet (or largest sheet)
    let bestSheet = workbook.SheetNames[0];
    let bestRows = 0;

    for (const name of workbook.SheetNames) {
        const sheet = workbook.Sheets[name];
        const range = xlsx.utils.decode_range(sheet['!ref'] || 'A1');
        const rows = range.e.r - range.s.r + 1;
        if (rows > bestRows) {
            bestRows = rows;
            bestSheet = name;
        }
    }

    if (!bestSheet) throw new Error('Excel file is empty');

    const records: any[] = xlsx.utils.sheet_to_json(workbook.Sheets[bestSheet], {
        defval: null,
        raw: false  // Get formatted strings for better type inference
    });

    return analyzeRawData(records, `Excel (${bestSheet})`);
}

function parseJSON(content: string): AnalysisResult {
    const data = JSON.parse(content);

    // Handle arrays directly
    if (Array.isArray(data)) {
        // Flatten nested objects if needed
        const flattened = data.map(item => flattenObject(item));
        return analyzeRawData(flattened, 'JSON Array');
    }

    // Handle object with a data array property
    if (typeof data === 'object' && data !== null) {
        // Look for the largest array property
        let bestKey = '';
        let bestLen = 0;

        for (const [key, val] of Object.entries(data)) {
            if (Array.isArray(val) && val.length > bestLen) {
                bestLen = val.length;
                bestKey = key;
            }
        }

        if (bestKey && bestLen > 0) {
            const records = (data[bestKey] as any[]).map(item =>
                typeof item === 'object' ? flattenObject(item) : { value: item }
            );
            return analyzeRawData(records, `JSON (${bestKey})`);
        }

        // Single object — wrap in array
        return analyzeRawData([flattenObject(data)], 'JSON Object');
    }

    return emptyResult('JSON Error', ['Could not extract tabular data from JSON']);
}

function parseXML(content: string): AnalysisResult {
    const parser = new XMLParser({
        ignoreAttributes: false,
        attributeNamePrefix: '',
        textNodeName: '_text'
    });
    const jsonObj = parser.parse(content);

    // Recursively find the first meaningful array
    const records = extractArrayFromObject(jsonObj);

    if (records.length === 0 && typeof jsonObj === 'object') {
        return analyzeRawData([flattenObject(jsonObj)], 'XML Object');
    }

    return analyzeRawData(records.map(r => typeof r === 'object' ? flattenObject(r) : { value: r }), 'XML');
}

// ─── Utility Functions ──────────────────────────────────────────────────────

function flattenObject(obj: any, prefix: string = '', depth: number = 0): Record<string, any> {
    if (depth > 3 || typeof obj !== 'object' || obj === null) {
        return prefix ? { [prefix]: obj } : {};
    }

    const result: Record<string, any> = {};

    for (const [key, val] of Object.entries(obj)) {
        const newKey = prefix ? `${prefix}_${key}` : key;

        if (val === null || val === undefined) {
            result[newKey] = null;
        } else if (Array.isArray(val)) {
            result[newKey] = JSON.stringify(val);
        } else if (typeof val === 'object') {
            Object.assign(result, flattenObject(val, newKey, depth + 1));
        } else {
            result[newKey] = val;
        }
    }

    return result;
}

function extractArrayFromObject(obj: any): any[] {
    if (Array.isArray(obj)) return obj;

    if (typeof obj === 'object' && obj !== null) {
        // First pass: look for direct array children
        for (const key of Object.keys(obj)) {
            if (Array.isArray(obj[key]) && obj[key].length > 0) {
                return obj[key];
            }
        }
        // Second pass: recurse one level deeper
        for (const key of Object.keys(obj)) {
            if (typeof obj[key] === 'object' && obj[key] !== null) {
                const found = extractArrayFromObject(obj[key]);
                if (found.length > 0) return found;
            }
        }
    }

    return [];
}

function emptyResult(type: string, limitations: string[]): AnalysisResult {
    return {
        type,
        summary: { rows: 0, columns: 0, columnTypes: {} },
        options: [],
        aiInsights: [],
        keyFindings: [],
        dataLimitations: limitations,
        processingLog: [],
        sampleData: [],
        dataHealth: { score: 0, issues: limitations, cleanedRows: 0, columnHealth: [] }
    };
}

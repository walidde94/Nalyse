import { AdvancedColumnType, DataHealth } from './types';

// Improved Type Inference
export const inferColumnType = (header: string, values: any[]): AdvancedColumnType => {
    const isId = /id|idx|index|code|uuid|key|pk|uid|serial|rank|row/i.test(header);
    // Relaxed length constraint for common incrementing IDs like 'Index' or 'ID'
    if (isId && (values.every(v => String(v).length > 2) || /index|rank|row/i.test(header))) return 'id';

    const nonNulls = values.filter(v => v !== null && v !== undefined && v !== '');
    if (nonNulls.length === 0) return 'text';

    const sample = nonNulls.slice(0, 500); // Increased sample size

    // Check for Date first (strict)
    const isDate = sample.every(v => {
        const s = String(v).trim();
        if (/^\d{4}$/.test(s) && !/year/i.test(header)) return false;
        const d = Date.parse(s);
        return !isNaN(d) && s.length > 5;
    });
    if (isDate) return 'date';

    // Check for Number
    const isNumber = sample.every(v => {
        const s = String(v).replace(/[$€£,% ]/g, '').trim();
        if (s === '') return true; // Permit empty after strip
        return !isNaN(parseFloat(s)) && isFinite(Number(s));
    });

    if (isNumber) {
        if (/price|cost|amount|revenue|sales|salary|total/i.test(header) || sample.some(v => /[$€£]/.test(String(v)))) return 'currency';
        if (/rate|percent|margin|share|growth/i.test(header) || sample.some(v => String(v).includes('%'))) return 'percent';
        return 'number';
    }

    if (/email/i.test(header) || sample.every(v => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(v)))) return 'email';

    // Categorical Heuristic
    const uniqueCount = new Set(sample).size;
    const ratio = uniqueCount / sample.length;
    if ((uniqueCount <= 30) || (ratio < 0.15 && sample.length > 50)) return 'category';

    if (/country|nation/i.test(header)) return 'country';
    if (/city|town|municipality/i.test(header)) return 'city';

    return 'text';
};

// Deep Sanitization for Messy Data
const sanitizeValue = (v: any): any => {
    if (v === null || v === undefined) return null;
    const s = String(v).trim();
    const nullPatterns = /^(n\/a|na|null|none|nil|nan|-|--|\?|unknown)$/i;
    if (s === '' || nullPatterns.test(s)) return null;
    return s;
};

// Outlier Detection (IQR Method)
const detectOutliers = (values: number[]): { outliers: number[], bounds: { lower: number, upper: number } } => {
    if (values.length < 4) return { outliers: [], bounds: { lower: -Infinity, upper: Infinity } };
    const sorted = [...values].sort((a, b) => a - b);
    const q1 = sorted[Math.floor(sorted.length * 0.25)];
    const q3 = sorted[Math.floor(sorted.length * 0.75)];
    const iqr = q3 - q1;
    const lower = q1 - 1.5 * iqr;
    const upper = q3 + 1.5 * iqr;
    return {
        outliers: values.filter(v => v < lower || v > upper),
        bounds: { lower, upper }
    };
};

export const performDataCleaning = (records: any[], columns: string[]): { data: any[]; stats: DataHealth; log: string[] } => {
    let initialCount = records.length;
    let missingValues = 0;
    let duplicates = 0;
    let outliersCount = 0;
    const log: string[] = [];

    log.push(`🚀 Starting deep audit of ${initialCount} records with ${columns.length} columns.`);

    // 1. Header Normalization
    const normalizedCols = columns.map(col => col.trim().replace(/[^\w\s]/gi, '_'));
    const colMap: Record<string, string> = {};
    columns.forEach((col, i) => colMap[col] = normalizedCols[i]);

    if (JSON.stringify(columns) !== JSON.stringify(normalizedCols)) {
        log.push("⚠️ Normalized malformed headers to ensure system compatibility.");
    }

    // 2. Row-level Cleaning & Sanitization
    const uniqueStr = new Set();
    const sanitizedRecords = records.map(r => {
        const newR: any = {};
        columns.forEach(col => {
            newR[colMap[col]] = sanitizeValue(r[col]);
        });
        return newR;
    });

    const cleaned = sanitizedRecords.filter(r => {
        const str = JSON.stringify(r);
        if (uniqueStr.has(str)) { duplicates++; return false; }
        uniqueStr.add(str);

        const hasData = Object.values(r).some(v => v !== null);
        return hasData;
    });
    log.push(`✅ Deduplication complete: ${duplicates} redundant clusters resolved.`);

    // 3. Outlier and Anomaly Detection (Pre-processing)
    const activeCols = Object.keys(cleaned[0] || {});
    activeCols.forEach(col => {
        const values = cleaned.map(r => r[col]);
        const numValues = values.map(v => {
            const s = String(v).replace(/[$€£,% ]/g, '');
            return parseFloat(s);
        }).filter(v => !isNaN(v));

        if (numValues.length > 20) {
            const { outliers } = detectOutliers(numValues);
            if (outliers.length > 0) {
                outliersCount += outliers.length;
                log.push(`🔍 Analytics Insight: Found ${outliers.length} statistical outliers in '${col}'.`);
            }
        }
    });

    // 4. Global Score Calculation
    cleaned.forEach(r => {
        Object.values(r).forEach(v => {
            if (v === null) missingValues++;
        });
    });

    const totalPossiblePoints = cleaned.length * activeCols.length;
    const score = totalPossiblePoints > 0 ? Math.max(0, 100 - (missingValues / totalPossiblePoints * 50) - (duplicates * 2)) : 0;

    return {
        data: cleaned,
        stats: {
            score: Math.round(score),
            issues: [
                `${columns.length - activeCols.length} inactive dimensions optimized.`,
                `${duplicates} duplicates purged.`,
                `${outliersCount} anomalies flagged for inspection.`
            ],
            cleanedRows: initialCount - cleaned.length,
            columnHealth: activeCols.map(col => ({
                column: col,
                type: 're-evaluating',
                completeness: Math.round(((cleaned.length - cleaned.filter(r => r[col] === null).length) / cleaned.length) * 100),
                uniqueness: Math.round((new Set(cleaned.map(r => r[col])).size / cleaned.length) * 100),
                validity: 95
            }))
        },
        log
    };
};

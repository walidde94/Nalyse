import { AdvancedColumnType, DataHealth } from './types';

// Improved Type Inference
export const inferColumnType = (header: string, values: any[]): AdvancedColumnType => {
    const isId = /id|idx|index|code|uuid|key|pk|uid|serial|rank|row/i.test(header);
    // Relaxed length constraint for common incrementing IDs like 'Index' or 'ID'
    if (isId && (values.every(v => String(v).length > 2) || /index|rank|row/i.test(header))) return 'id';

    const nonNulls = values.filter(v => v !== null && v !== undefined && v !== '');
    if (nonNulls.length === 0) return 'text';

    // Sample size increased for better accuracy
    const sample = nonNulls.slice(0, 100);

    // Check for Date first (strict)
    const isDate = sample.every(v => {
        const s = String(v);
        // exclude simple numbers like "2023" unless header says year
        if (/^\d{4}$/.test(s) && !/year/i.test(header)) return false;
        const d = Date.parse(s);
        return !isNaN(d) && s.length > 5; // avoiding "1", "2" parsed as dates
    });
    if (isDate) return 'date';

    // Check for Number
    const isNumber = sample.every(v => {
        const s = String(v).replace(/[$€£,% ]/g, ''); // remove currency/percent/space
        return !isNaN(parseFloat(s)) && isFinite(Number(s));
    });

    if (isNumber) {
        if (/price|cost|amount|revenue|sales|salary|total/i.test(header) || sample.some(v => /[$€£]/.test(String(v)))) return 'currency';
        if (/rate|percent|margin|share|growth/i.test(header) || sample.some(v => String(v).includes('%'))) return 'percent';
        return 'number';
    }

    if (/email/i.test(header) || sample.every(v => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(v)))) return 'email';

    // Categorical Heuristic: Low cardinality relative to data size
    const uniqueCount = new Set(sample).size;
    const ratio = uniqueCount / sample.length;
    if ((uniqueCount <= 20) || (ratio < 0.2 && sample.length > 20)) return 'category';

    if (/country|nation/i.test(header)) return 'country';
    if (/city|town|municipality/i.test(header)) return 'city';

    return 'text';
};

export const performDataCleaning = (records: any[], columns: string[]): { data: any[]; stats: DataHealth; log: string[] } => {
    let initialCount = records.length;
    let missingValues = 0;
    let duplicates = 0;
    const log: string[] = [];

    // 1. Row-level Cleaning (Deduplication & Empty row removal)
    const uniqueStr = new Set();
    const cleaned = records.filter(r => {
        // Create a signature for the row
        const str = JSON.stringify(r);
        if (uniqueStr.has(str)) { duplicates++; return false; }
        uniqueStr.add(str);

        // Check for empty rows
        const hasData = Object.values(r).some(v => v !== '' && v !== null && v !== undefined);
        if (!hasData) return false;

        return true;
    });

    if (initialCount > cleaned.length) {
        log.push(`Removed ${initialCount - cleaned.length} rows (duplicates or completely empty) to ensure data integrity.`);
    }

    // 2. Column Analysis (but DO NOT drop constant columns, just log them)
    // We only drop completely empty columns
    const validCols = columns.filter(col => {
        const values = cleaned.map(r => r[col]);
        const nonNulls = values.filter(v => v !== '' && v !== null && v !== undefined).length;

        if (nonNulls === 0) {
            log.push(`🗑️ Dropped Column '${col}': Completely empty (100% null).`);
            return false;
        }

        const uniqueVals = new Set(values.map(v => String(v))).size;
        if (uniqueVals === 1 && cleaned.length > 1) {
            log.push(`ℹ️ Column '${col}' has a constant value. Kept for reference.`);
        }

        return true;
    });

    // Reconstruct data
    const finalData = cleaned.map(r => {
        const newR: any = {};
        validCols.forEach(c => newR[c] = r[c]);
        return newR;
    });

    // 3. Health Stats
    const columnHealth = validCols.map(col => {
        const values = finalData.map(r => r[col]);
        const nonNulls = values.filter(v => v !== '' && v !== null && v !== undefined).length;
        const uniqueVals = new Set(values.map(v => String(v))).size;

        // Simple type consistency check
        const validValues = values.length; // Simplified for now, or implement stricter check

        return {
            column: col,
            type: 'detected_later',
            completeness: Math.round((nonNulls / finalData.length) * 100) || 0,
            uniqueness: Math.round((uniqueVals / finalData.length) * 100) || 0,
            validity: 100 // Placeholder until deeper validation
        };
    });

    // Global Score
    finalData.forEach(r => {
        Object.values(r).forEach(v => {
            if (v === '' || v === null || v === undefined) missingValues++;
        });
    });

    const score = Math.max(0, 100 - (missingValues * 0.05) - (duplicates * 2));

    return {
        data: finalData,
        stats: {
            score: Math.round(score),
            issues: [
                `${columns.length - validCols.length} empty columns dropped.`,
                `${duplicates} duplicate rows removed.`,
            ],
            cleanedRows: initialCount - cleaned.length,
            columnHealth
        },
        log
    };
};

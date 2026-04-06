// ═══════════════════════════════════════════════════════════════════════════════
// Nalyse Data Cleaner v3.0 — Surgical-Grade Data Preparation Pipeline
// High-performance cleaning, type inference, and statistical pre-computation
// ═══════════════════════════════════════════════════════════════════════════════

import { AdvancedColumnType, DataHealth, ColumnStatistics } from './types';

// ─── Constants ───────────────────────────────────────────────────────────────

const NULL_PATTERNS = /^(n\/a|na|null|none|nil|nan|-|--|—|\?|unknown|undefined|missing|not available|\.+|#n\/a|#ref!|#value!|#div\/0!|#null!|#name\?|empty)$/i;
const SAMPLE_SIZE = 1000;  // Max rows to sample for type inference

// ─── Type Inference Engine ──────────────────────────────────────────────────

export const inferColumnType = (header: string, values: any[]): AdvancedColumnType => {
    const headerLower = header.toLowerCase();

    // Fast-path: ID columns (check header name first — cheapest check)
    if (/^(id|idx|index|code|uuid|key|pk|uid|serial|row_?num|record_?id)$/i.test(header) ||
        (/\b(id|idx|uuid|pk)\b/i.test(header) && !/width|grid|bid|paid|valid/i.test(header))) {
        return 'id';
    }

    const nonNulls = values.filter(v => v !== null && v !== undefined && v !== '');
    if (nonNulls.length === 0) return 'text';

    // Sample for performance — no need to check all 500k values
    const sample = nonNulls.length > SAMPLE_SIZE ? nonNulls.slice(0, SAMPLE_SIZE) : nonNulls;
    const threshold = 0.92; // 92% match = type confirmed

    // Boolean detection
    const boolSet = new Set(['true', 'false', 'yes', 'no', '0', '1', 'y', 'n', 'ja', 'nein', 'oui', 'non']);
    const boolMatch = sample.filter(v => boolSet.has(String(v).toLowerCase().trim())).length / sample.length;
    if (boolMatch >= threshold) return 'boolean';

    // Email detection (header hint + regex)
    if (/email|e-mail|mail/i.test(header) ||
        sample.filter(v => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(v))).length / sample.length >= threshold) {
        return 'email';
    }

    // URL detection
    if (/url|website|site|link|href/i.test(header) ||
        sample.filter(v => /^https?:\/\//i.test(String(v))).length / sample.length >= threshold) {
        return 'url';
    }

    // Phone detection
    if (/phone|mobile|tel|fax|cell/i.test(header) ||
        sample.filter(v => /^[\+\(]?\d[\d\-\(\)\s\.]{6,18}\d$/.test(String(v).trim())).length / sample.length >= threshold) {
        return 'phone';
    }

    // Date detection — strict (must be > 5 chars, parseable, not just a year)
    const dateMatch = sample.filter(v => {
        const s = String(v).trim();
        if (s.length <= 5) return false;
        if (/^\d{4}$/.test(s) && !/year/i.test(header)) return false;
        const d = Date.parse(s);
        return !isNaN(d);
    }).length / sample.length;
    if (dateMatch >= threshold) return 'date';

    // Number detection (strip currency/percent symbols)
    const numberMatch = sample.filter(v => {
        const s = String(v).replace(/[$€£¥₹,% \s]/g, '').trim();
        if (s === '') return true;
        return !isNaN(parseFloat(s)) && isFinite(Number(s));
    }).length / sample.length;

    if (numberMatch >= threshold) {
        // Subtype: Currency
        if (/price|cost|amount|revenue|sales|salary|total|budget|spend|income|profit|fee|payment|balance|wage/i.test(header) ||
            sample.some(v => /[$€£¥₹]/.test(String(v)))) {
            return 'currency';
        }
        // Subtype: Percent
        if (/rate|percent|margin|share|growth|ratio|pct|conversion|churn|retention/i.test(header) ||
            sample.some(v => String(v).includes('%'))) {
            return 'percent';
        }
        // Subtype: Coordinate
        if (/lat|lng|lon|longitude|latitude/i.test(header)) {
            return 'coordinate';
        }
        return 'number';
    }

    // Country detection
    if (/country|nation|country_?code/i.test(header)) return 'country';
    if (/city|town|municipality|metro/i.test(header)) return 'city';

    // Category heuristic — low cardinality = categorical
    const uniqueCount = new Set(sample.map(v => String(v).toLowerCase().trim())).size;
    const ratio = uniqueCount / sample.length;
    if (uniqueCount <= 50 || (ratio < 0.15 && sample.length > 50)) return 'category';

    return 'text';
};

// ─── Value Sanitizer ────────────────────────────────────────────────────────

const sanitizeValue = (v: any): any => {
    if (v === null || v === undefined) return null;
    const s = String(v).trim();
    if (s === '' || NULL_PATTERNS.test(s)) return null;
    return s;
};

// ─── Outlier Detection (Tukey IQR) ──────────────────────────────────────────

const detectOutliers = (values: number[]): { count: number; bounds: { lower: number; upper: number } } => {
    if (values.length < 10) return { count: 0, bounds: { lower: -Infinity, upper: Infinity } };

    const sorted = Float64Array.from(values).sort();
    const q1 = sorted[Math.floor(sorted.length * 0.25)];
    const q3 = sorted[Math.floor(sorted.length * 0.75)];
    const iqr = q3 - q1;

    if (iqr === 0) return { count: 0, bounds: { lower: q1, upper: q3 } };

    const lower = q1 - 1.5 * iqr;
    const upper = q3 + 1.5 * iqr;

    let count = 0;
    for (let i = 0; i < values.length; i++) {
        if (values[i] < lower || values[i] > upper) count++;
    }

    return { count, bounds: { lower, upper } };
};

// ─── Column Statistics Calculator ───────────────────────────────────────────

export const computeColumnStatistics = (values: any[], type: AdvancedColumnType): ColumnStatistics => {
    const nonNull = values.filter(v => v !== null && v !== undefined && v !== '');
    const nullCount = values.length - nonNull.length;
    const distinctCount = new Set(nonNull.map(v => String(v))).size;

    const stats: ColumnStatistics = { nullCount, distinctCount };

    // Numeric statistics
    if (['number', 'currency', 'percent', 'coordinate'].includes(type)) {
        const nums = nonNull
            .map(v => parseFloat(String(v).replace(/[$€£¥₹,% \s]/g, '')))
            .filter(n => !isNaN(n) && isFinite(n));

        if (nums.length > 0) {
            const sorted = Float64Array.from(nums).sort();
            const n = sorted.length;
            let sum = 0;
            for (let i = 0; i < n; i++) sum += sorted[i];
            const mean = sum / n;

            let varianceSum = 0;
            for (let i = 0; i < n; i++) {
                const diff = sorted[i] - mean;
                varianceSum += diff * diff;
            }

            stats.min = sorted[0];
            stats.max = sorted[n - 1];
            stats.mean = mean;
            stats.median = n % 2 === 0 ? (sorted[n / 2 - 1] + sorted[n / 2]) / 2 : sorted[Math.floor(n / 2)];
            stats.stdDev = Math.sqrt(varianceSum / n);
            stats.p25 = sorted[Math.floor(n * 0.25)];
            stats.p75 = sorted[Math.floor(n * 0.75)];
        }
    }

    // Top values for categorical/text columns
    if (['category', 'text', 'country', 'city', 'boolean'].includes(type)) {
        const freq = new Map<string, number>();
        for (const v of nonNull) {
            const key = String(v);
            freq.set(key, (freq.get(key) || 0) + 1);
        }
        stats.topValues = Array.from(freq.entries())
            .sort((a, b) => b[1] - a[1])
            .slice(0, 10)
            .map(([value, count]) => ({ value, count }));
    }

    return stats;
};

// ─── Shannon Entropy ────────────────────────────────────────────────────────

const computeEntropy = (values: any[]): number => {
    const freq = new Map<string, number>();
    const total = values.length;
    if (total === 0) return 0;

    for (const v of values) {
        const key = String(v ?? 'NULL');
        freq.set(key, (freq.get(key) || 0) + 1);
    }

    let entropy = 0;
    for (const count of freq.values()) {
        const p = count / total;
        if (p > 0) entropy -= p * Math.log2(p);
    }
    return entropy;
};

// ─── Main Cleaning Pipeline ─────────────────────────────────────────────────

export const performDataCleaning = (
    records: any[],
    columns: string[]
): {
    data: any[];
    stats: DataHealth;
    log: string[];
    columnStats: Record<string, ColumnStatistics>;
} => {
    const t0 = performance.now();
    const initialCount = records.length;
    let missingValues = 0;
    let duplicates = 0;
    let outliersTotal = 0;
    const log: string[] = [];

    log.push(`⚡ Ingesting ${initialCount.toLocaleString()} records × ${columns.length} columns (${(initialCount * columns.length).toLocaleString()} cells)`);

    // 1. Header Normalization — strip special chars, preserve readability
    const normalizedCols = columns.map(col => col.trim().replace(/[^\w\s]/gi, '_').replace(/\s+/g, '_'));
    const colMap: Record<string, string> = {};
    const reverseMap: Record<string, string> = {};
    columns.forEach((col, i) => {
        colMap[col] = normalizedCols[i];
        reverseMap[normalizedCols[i]] = col;
    });

    const headersChanged = columns.some((col, i) => col !== normalizedCols[i]);
    if (headersChanged) {
        log.push('🔧 Normalized column headers for system compatibility');
    }

    // 2. Row-Level Cleaning — single-pass sanitize + dedup
    const uniqueHashes = new Set<string>();
    const cleaned: any[] = [];

    for (let i = 0; i < records.length; i++) {
        const r = records[i];
        const newR: any = {};
        let hasData = false;

        for (let j = 0; j < columns.length; j++) {
            const val = sanitizeValue(r[columns[j]]);
            newR[normalizedCols[j]] = val;
            if (val !== null) hasData = true;
        }

        if (!hasData) continue;

        // Fast hash-based dedup using a composite key of first 5 columns
        const hashCols = normalizedCols.slice(0, Math.min(5, normalizedCols.length));
        const hash = hashCols.map(c => String(newR[c] ?? '')).join('|');

        if (uniqueHashes.has(hash)) {
            duplicates++;
            continue;
        }
        uniqueHashes.add(hash);
        cleaned.push(newR);
    }

    if (duplicates > 0) {
        log.push(`🗑️ Purged ${duplicates.toLocaleString()} duplicate records`);
    }

    if (cleaned.length === 0) {
        return {
            data: [],
            stats: { score: 0, issues: ['All rows empty or duplicate'], cleanedRows: initialCount, columnHealth: [] },
            log,
            columnStats: {}
        };
    }

    // 3. Type Inference + Column Statistics (single pass per column)
    const activeCols = normalizedCols.filter(c => c in cleaned[0]);
    const colTypes: Record<string, AdvancedColumnType> = {};
    const columnStats: Record<string, ColumnStatistics> = {};

    for (const col of activeCols) {
        const values = cleaned.map(r => r[col]);
        colTypes[col] = inferColumnType(reverseMap[col] || col, values);
        columnStats[col] = computeColumnStatistics(values, colTypes[col]);
    }

    log.push(`📊 Classified ${activeCols.length} columns: ${Object.values(colTypes).filter(t => ['number', 'currency', 'percent'].includes(t)).length} numeric, ${Object.values(colTypes).filter(t => t === 'category').length} categorical, ${Object.values(colTypes).filter(t => t === 'date').length} temporal`);

    // 4. Numeric Coercion — convert detected numeric columns in-place
    const numericTypes = new Set(['number', 'currency', 'percent', 'coordinate']);
    for (const col of activeCols) {
        if (numericTypes.has(colTypes[col])) {
            for (let i = 0; i < cleaned.length; i++) {
                const raw = cleaned[i][col];
                if (raw !== null) {
                    const num = parseFloat(String(raw).replace(/[$€£¥₹,% \s]/g, ''));
                    cleaned[i][col] = isNaN(num) ? null : num;
                }
            }
        }
    }

    // 5. Outlier Detection on numeric columns
    for (const col of activeCols) {
        if (!numericTypes.has(colTypes[col])) continue;
        const nums = cleaned.map(r => r[col]).filter((v): v is number => typeof v === 'number');
        if (nums.length < 20) continue;

        const result = detectOutliers(nums);
        if (result.count > 0) {
            outliersTotal += result.count;
            const pct = ((result.count / nums.length) * 100).toFixed(1);
            log.push(`🔍 ${result.count} outliers in '${col}' (${pct}% of values, bounds: ${result.bounds.lower.toFixed(1)}–${result.bounds.upper.toFixed(1)})`);
        }
    }

    // 6. Data Health Score
    for (const r of cleaned) {
        for (const col of activeCols) {
            if (r[col] === null) missingValues++;
        }
    }

    const totalCells = cleaned.length * activeCols.length;
    const completeness = totalCells > 0 ? ((totalCells - missingValues) / totalCells) * 100 : 0;
    const dedupPenalty = Math.min(20, (duplicates / initialCount) * 100);
    const outlierPenalty = Math.min(10, (outliersTotal / totalCells) * 50);
    const score = Math.max(0, Math.min(100, Math.round(completeness - dedupPenalty - outlierPenalty)));

    const elapsed = Math.round(performance.now() - t0);
    log.push(`✅ Cleaning complete in ${elapsed}ms — Score: ${score}/100 (${cleaned.length.toLocaleString()} clean records)`);

    return {
        data: cleaned,
        stats: {
            score,
            issues: [
                missingValues > 0 ? `${missingValues.toLocaleString()} missing values across ${activeCols.length} columns` : '',
                duplicates > 0 ? `${duplicates.toLocaleString()} duplicate records removed` : '',
                outliersTotal > 0 ? `${outliersTotal.toLocaleString()} statistical outliers detected` : '',
            ].filter(Boolean),
            cleanedRows: initialCount - cleaned.length,
            columnHealth: activeCols.map(col => {
                const cs = columnStats[col];
                const entropy = computeEntropy(cleaned.map(r => r[col]));
                return {
                    column: col,
                    type: colTypes[col],
                    completeness: Math.round(((cleaned.length - cs.nullCount) / cleaned.length) * 100),
                    uniqueness: Math.round((cs.distinctCount / cleaned.length) * 100),
                    validity: Math.round(((cleaned.length - cs.nullCount) / cleaned.length) * 100),
                    entropy: Math.round(entropy * 100) / 100,
                };
            })
        },
        log,
        columnStats
    };
};

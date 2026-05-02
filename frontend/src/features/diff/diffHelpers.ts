// ─── Diff Engine Helpers — Revolutionary Edition ─────────────

export interface DiffMetric {
    label: string;
    baselineValue: number;
    comparisonValue: number;
    change: number;
    changePercent: number;
    direction: 'up' | 'down' | 'neutral';
    significance: 'high' | 'medium' | 'low';
    sparkline: number[];
}

export interface ChartDiff {
    title: string;
    chartType: string;
    baselineData: any[];
    comparisonData: any[];
    mergedData: any[];
}

export interface ColumnDiff {
    column: string;
    baselineType: string;
    comparisonType: string;
    status: 'unchanged' | 'modified' | 'added' | 'removed';
    baselineDistinct: number;
    comparisonDistinct: number;
    baselineNulls: number;
    comparisonNulls: number;
}

export interface DiffSummary {
    improved: number;
    declined: number;
    unchanged: number;
    maxChange: DiffMetric;
    total: number;
    overallScore: number;
    narrative: string;
    riskLevel: 'low' | 'moderate' | 'high' | 'critical';
    topMovers: DiffMetric[];
    waterfallData: { name: string; value: number; cumulative: number; color: string }[];
    distributionShifts: { column: string; baselineBuckets: number[]; comparisonBuckets: number[]; shiftMagnitude: number }[];
    volatilityIndex: number;
    dataGrowthRate: number;
    schemaStability: number;
}

// ─── Formatters ──────────────────────────────────────────────
export const fmt = (v: number) => {
    if (Math.abs(v) >= 1e9) return `${(v / 1e9).toFixed(2)}B`;
    if (Math.abs(v) >= 1e6) return `${(v / 1e6).toFixed(2)}M`;
    if (Math.abs(v) >= 1e3) return `${(v / 1e3).toFixed(1)}K`;
    return v % 1 === 0 ? v.toLocaleString() : v.toFixed(2);
};

export const pct = (v: number) => `${v >= 0 ? '+' : ''}${v.toFixed(1)}%`;

export const BASELINE_COLOR = '#818cf8';
export const COMPARISON_COLOR = '#34d399';
export const NEGATIVE_COLOR = '#f87171';
export const NEUTRAL_COLOR = '#94a3b8';

// ─── Stats Engine ────────────────────────────────────────────
export const computeStats = (data: any[]) => {
    if (!data?.length) return {};
    const cols = Object.keys(data[0]);
    const stats: Record<string, { sum: number; avg: number; min: number; max: number; count: number; distinct: number; values: number[]; stdDev: number; median: number }> = {};
    cols.forEach(col => {
        const nums = data.map(r => parseFloat(r[col])).filter(n => !isNaN(n));
        if (nums.length > 0) {
            const sum = nums.reduce((a, b) => a + b, 0);
            const avg = sum / nums.length;
            const sorted = [...nums].sort((a, b) => a - b);
            const median = sorted.length % 2 === 0 ? (sorted[sorted.length / 2 - 1] + sorted[sorted.length / 2]) / 2 : sorted[Math.floor(sorted.length / 2)];
            const variance = nums.reduce((acc, v) => acc + (v - avg) ** 2, 0) / nums.length;
            stats[col] = {
                sum, avg, min: Math.min(...nums), max: Math.max(...nums),
                count: nums.length, distinct: new Set(data.map(r => r[col])).size,
                values: nums.slice(0, 30), stdDev: Math.sqrt(variance), median
            };
        }
    });
    return stats;
};

// ─── Sparkline Generator ─────────────────────────────────────
export const generateSparkline = (values: number[], buckets = 8): number[] => {
    if (!values.length) return Array(buckets).fill(0);
    const step = Math.max(1, Math.floor(values.length / buckets));
    const result: number[] = [];
    for (let i = 0; i < buckets; i++) {
        const slice = values.slice(i * step, (i + 1) * step);
        result.push(slice.length ? slice.reduce((a, b) => a + b, 0) / slice.length : 0);
    }
    return result;
};

// ─── Distribution Buckets ────────────────────────────────────
const buildDistribution = (values: number[], buckets = 10): number[] => {
    if (!values.length) return Array(buckets).fill(0);
    const min = Math.min(...values);
    const max = Math.max(...values);
    const range = max - min || 1;
    const bins = Array(buckets).fill(0);
    values.forEach(v => {
        const idx = Math.min(buckets - 1, Math.floor(((v - min) / range) * buckets));
        bins[idx]++;
    });
    return bins.map(b => b / values.length); // normalize to proportions
};

// ─── Build Diff Metrics ──────────────────────────────────────
export const buildDiffMetrics = (baseData: any[], compData: any[]): DiffMetric[] => {
    const baseStats = computeStats(baseData);
    const compStats = computeStats(compData);
    const metrics: DiffMetric[] = [];

    const rowChange = compData.length - baseData.length;
    const rowChangePct = baseData.length > 0 ? (rowChange / baseData.length) * 100 : 0;
    metrics.push({
        label: 'Total Records', baselineValue: baseData.length, comparisonValue: compData.length,
        change: rowChange, changePercent: rowChangePct,
        direction: rowChange > 0 ? 'up' : rowChange < 0 ? 'down' : 'neutral',
        significance: Math.abs(rowChangePct) > 20 ? 'high' : Math.abs(rowChangePct) > 5 ? 'medium' : 'low',
        sparkline: [baseData.length, compData.length]
    });

    const allCols = new Set([...Object.keys(baseStats), ...Object.keys(compStats)]);
    allCols.forEach(col => {
        const b = baseStats[col];
        const c = compStats[col];
        if (b && c) {
            const change = c.sum - b.sum;
            const changePct = b.sum !== 0 ? (change / Math.abs(b.sum)) * 100 : 0;
            const sparkB = generateSparkline(b.values);
            const sparkC = generateSparkline(c.values);
            metrics.push({
                label: col.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
                baselineValue: b.sum, comparisonValue: c.sum, change, changePercent: changePct,
                direction: change > 0 ? 'up' : change < 0 ? 'down' : 'neutral',
                significance: Math.abs(changePct) > 20 ? 'high' : Math.abs(changePct) > 5 ? 'medium' : 'low',
                sparkline: sparkB.map((v, i) => (v + (sparkC[i] || 0)) / 2)
            });
        }
    });
    return metrics;
};

// ─── Build Column Diffs ──────────────────────────────────────
export const buildColumnDiffs = (baseData: any[], compData: any[]): ColumnDiff[] => {
    const bCols = baseData.length ? Object.keys(baseData[0]) : [];
    const cCols = compData.length ? Object.keys(compData[0]) : [];
    const all = new Set([...bCols, ...cCols]);
    const diffs: ColumnDiff[] = [];

    all.forEach(col => {
        const inB = bCols.includes(col);
        const inC = cCols.includes(col);
        const bNulls = inB ? baseData.filter(r => r[col] == null || r[col] === '').length : 0;
        const cNulls = inC ? compData.filter(r => r[col] == null || r[col] === '').length : 0;
        const bDistinct = inB ? new Set(baseData.map(r => r[col])).size : 0;
        const cDistinct = inC ? new Set(compData.map(r => r[col])).size : 0;
        const bType = inB ? (baseData.some(r => !isNaN(parseFloat(r[col]))) ? 'numeric' : 'string') : '-';
        const cType = inC ? (compData.some(r => !isNaN(parseFloat(r[col]))) ? 'numeric' : 'string') : '-';

        let status: ColumnDiff['status'] = 'unchanged';
        if (!inB) { status = 'added'; }
        else if (!inC) { status = 'removed'; }
        else if (bType !== cType) { status = 'modified'; }
        else {
            const bValues = new Set(baseData.map(r => String(r[col] ?? '')));
            const cValues = new Set(compData.map(r => String(r[col] ?? '')));
            const hasNewValues = [...cValues].some(v => !bValues.has(v));
            const hasRemovedValues = [...bValues].some(v => !cValues.has(v));
            if (bDistinct !== cDistinct || bNulls !== cNulls || hasNewValues || hasRemovedValues) {
                status = 'modified';
            }
        }
        diffs.push({ column: col, baselineType: bType, comparisonType: cType, status, baselineDistinct: bDistinct, comparisonDistinct: cDistinct, baselineNulls: bNulls, comparisonNulls: cNulls });
    });
    return diffs;
};

// ─── Build Chart Diffs ───────────────────────────────────────
export const buildChartDiffs = (baseAnalysis: any, compAnalysis: any): ChartDiff[] => {
    const baseOpts = baseAnalysis.options || [];
    const compOpts = compAnalysis.options || [];
    const diffs: ChartDiff[] = [];

    baseOpts.forEach((bOpt: any) => {
        const match = compOpts.find((c: any) => c.title === bOpt.title || c.id === bOpt.id);
        if (match) {
            const bData = (bOpt.data || []).map((d: any) => ({ name: d.name, value: Number(d.value) || 0 }));
            const cData = (match.data || []).map((d: any) => ({ name: d.name, value: Number(d.value) || 0 }));
            const allNames = [...new Set([...bData.map((d: any) => d.name), ...cData.map((d: any) => d.name)])];
            const merged = allNames.map(name => {
                const bVal = bData.find((d: any) => d.name === name)?.value || 0;
                const cVal = cData.find((d: any) => d.name === name)?.value || 0;
                return { name, baseline: bVal, comparison: cVal, delta: cVal - bVal, deltaPct: bVal !== 0 ? ((cVal - bVal) / Math.abs(bVal)) * 100 : 0 };
            });
            diffs.push({ title: bOpt.title, chartType: bOpt.chartType || 'bar', baselineData: bData, comparisonData: cData, mergedData: merged });
        }
    });

    compOpts.forEach((cOpt: any) => {
        if (!baseOpts.find((b: any) => b.title === cOpt.title || b.id === cOpt.id)) {
            const cData = (cOpt.data || []).map((d: any) => ({ name: d.name, value: Number(d.value) || 0 }));
            diffs.push({
                title: `[NEW] ${cOpt.title}`, chartType: cOpt.chartType || 'bar', baselineData: [], comparisonData: cData,
                mergedData: cData.map((d: any) => ({ name: d.name, baseline: 0, comparison: d.value, delta: d.value, deltaPct: 100 }))
            });
        }
    });
    return diffs;
};

// ─── Build Summary (Revolutionary) ───────────────────────────
export const buildSummary = (metrics: DiffMetric[], baseData?: any[], compData?: any[]): DiffSummary | null => {
    if (!metrics.length) return null;
    const improved = metrics.filter(m => m.direction === 'up').length;
    const declined = metrics.filter(m => m.direction === 'down').length;
    const unchanged = metrics.filter(m => m.direction === 'neutral').length;
    const maxChange = metrics.reduce((max, m) => Math.abs(m.changePercent) > Math.abs(max.changePercent) ? m : max, metrics[0]);
    const overallScore = Math.round((improved / metrics.length) * 100);

    // Top movers (sorted by absolute change %)
    const topMovers = [...metrics].sort((a, b) => Math.abs(b.changePercent) - Math.abs(a.changePercent)).slice(0, 5);

    // Risk level
    const highSigCount = metrics.filter(m => m.significance === 'high').length;
    const riskLevel: DiffSummary['riskLevel'] = highSigCount >= 3 ? 'critical' : highSigCount >= 2 ? 'high' : highSigCount >= 1 ? 'moderate' : 'low';

    // Waterfall data
    let cumulative = 0;
    const waterfallData = topMovers.map(m => {
        cumulative += m.change;
        return { name: m.label, value: m.change, cumulative, color: m.direction === 'up' ? COMPARISON_COLOR : m.direction === 'down' ? NEGATIVE_COLOR : NEUTRAL_COLOR };
    });

    // Volatility index (avg absolute change %)
    const volatilityIndex = metrics.reduce((sum, m) => sum + Math.abs(m.changePercent), 0) / metrics.length;

    // Data growth rate
    const recordMetric = metrics.find(m => m.label === 'Total Records');
    const dataGrowthRate = recordMetric?.changePercent || 0;

    // Schema stability
    const bData = baseData || [];
    const cData = compData || [];
    const bCols = bData.length ? Object.keys(bData[0]).length : 0;
    const cCols = cData.length ? Object.keys(cData[0]).length : 0;
    const schemaStability = bCols > 0 ? Math.round((Math.min(bCols, cCols) / Math.max(bCols, cCols)) * 100) : 100;

    // Distribution shifts
    const baseStats = computeStats(bData);
    const compStats = computeStats(cData);
    const distributionShifts: DiffSummary['distributionShifts'] = [];
    Object.keys(baseStats).forEach(col => {
        if (compStats[col]) {
            const bBuckets = buildDistribution(baseStats[col].values);
            const cBuckets = buildDistribution(compStats[col].values);
            const shiftMagnitude = bBuckets.reduce((sum, v, i) => sum + Math.abs(v - (cBuckets[i] || 0)), 0);
            if (shiftMagnitude > 0.1) {
                distributionShifts.push({ column: col.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()), baselineBuckets: bBuckets, comparisonBuckets: cBuckets, shiftMagnitude });
            }
        }
    });
    distributionShifts.sort((a, b) => b.shiftMagnitude - a.shiftMagnitude);

    // Narrative
    const parts: string[] = [];
    if (improved > declined) parts.push(`Overall positive trajectory with ${improved} metrics improving.`);
    else if (declined > improved) parts.push(`Caution: ${declined} metrics declined vs ${improved} improved.`);
    else parts.push(`Mixed results: ${improved} improved, ${declined} declined.`);
    parts.push(`Largest shift: ${maxChange.label} at ${pct(maxChange.changePercent)}.`);
    if (riskLevel === 'critical') parts.push('⚠️ Multiple high-significance changes detected — immediate review recommended.');
    else if (riskLevel === 'high') parts.push('Notable volatility detected across key metrics.');

    return { improved, declined, unchanged, maxChange, total: metrics.length, overallScore, narrative: parts.join(' '), riskLevel, topMovers, waterfallData, distributionShifts, volatilityIndex, dataGrowthRate, schemaStability };
};

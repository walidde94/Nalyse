// ─── Anomaly Detection Helpers ───────────────────────────────
// Client-side statistical anomaly detection for Nalyse
// Implements: Z-score, Modified Z-score, IQR, Trend Drift
// Classifies: spike, drop, drift, seasonal_deviation, volatility, behavioral_shift

export interface AnomalyPoint {
    index: number;
    timestamp: string;
    metric: string;
    value: number;
    expected: number;
    deviation: number;
    zScore: number;
    severity: 'critical' | 'high' | 'medium' | 'low';
    type: AnomalyType;
    explanation: string;
    confidence: number;
}

export type AnomalyType = 'spike' | 'drop' | 'drift' | 'seasonal_deviation' | 'volatility' | 'behavioral_shift';

export interface KpiSummary {
    metric: string;
    mean: number;
    median: number;
    std: number;
    min: number;
    max: number;
    trend: 'up' | 'down' | 'stable';
    trendPct: number;
    anomalyCount: number;
    healthScore: number;
    sparkline: number[];
}

export interface DetectionConfig {
    method: 'zscore' | 'iqr' | 'auto';
    sensitivity: number; // 1-5, higher = more sensitive
    windowSize: number;
}

export interface DetectionResult {
    anomalies: AnomalyPoint[];
    kpis: KpiSummary[];
    timeSeriesData: TimeSeriesPoint[];
    overallHealthScore: number;
    totalDataPoints: number;
    recommendations: Recommendation[];
}

export interface TimeSeriesPoint {
    timestamp: string;
    index: number;
    values: Record<string, number>;
    isAnomaly: boolean;
    anomalyTypes: AnomalyType[];
    severity?: 'critical' | 'high' | 'medium' | 'low';
}

export interface Recommendation {
    title: string;
    description: string;
    severity: 'critical' | 'high' | 'medium' | 'low';
    metric: string;
    actionType: 'investigate' | 'monitor' | 'automate' | 'escalate';
}

// ─── Core Statistics ─────────────────────────────────────────
const mean = (arr: number[]) => arr.reduce((a, b) => a + b, 0) / arr.length;
const median = (arr: number[]) => {
    const s = [...arr].sort((a, b) => a - b);
    const m = Math.floor(s.length / 2);
    return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
};
const std = (arr: number[]) => {
    const m = mean(arr);
    return Math.sqrt(arr.reduce((s, v) => s + (v - m) ** 2, 0) / arr.length);
};
const mad = (arr: number[]) => {
    const med = median(arr);
    return median(arr.map(v => Math.abs(v - med)));
};
const percentile = (arr: number[], p: number) => {
    const s = [...arr].sort((a, b) => a - b);
    const idx = (p / 100) * (s.length - 1);
    const lo = Math.floor(idx);
    const hi = Math.ceil(idx);
    return lo === hi ? s[lo] : s[lo] + (s[hi] - s[lo]) * (idx - lo);
};

// ─── Z-Score Detection ───────────────────────────────────────
function detectZScore(values: number[], threshold: number): boolean[] {
    const m = mean(values);
    const s = std(values) || 1;
    return values.map(v => Math.abs((v - m) / s) > threshold);
}

// ─── Modified Z-Score (MAD-based, robust) ────────────────────
function detectModifiedZScore(values: number[], threshold: number): boolean[] {
    const med = median(values);
    const mAD = mad(values) || 1;
    const k = 0.6745;
    return values.map(v => Math.abs(k * (v - med) / mAD) > threshold);
}

// ─── IQR Detection ───────────────────────────────────────────
function detectIQR(values: number[], multiplier: number): boolean[] {
    const q1 = percentile(values, 25);
    const q3 = percentile(values, 75);
    const iqr = q3 - q1;
    const lower = q1 - multiplier * iqr;
    const upper = q3 + multiplier * iqr;
    return values.map(v => v < lower || v > upper);
}

// ─── Rolling Window Stats ────────────────────────────────────
function rollingMean(values: number[], windowSize: number): number[] {
    return values.map((_, i) => {
        const start = Math.max(0, i - windowSize + 1);
        const window = values.slice(start, i + 1);
        return mean(window);
    });
}

function rollingStd(values: number[], windowSize: number): number[] {
    return values.map((_, i) => {
        const start = Math.max(0, i - windowSize + 1);
        const window = values.slice(start, i + 1);
        return std(window);
    });
}

// ─── Classify Anomaly Type ──────────────────────────────────
function classifyAnomaly(
    value: number,
    expected: number,
    localTrend: number,
    localVolatility: number,
    baselineVolatility: number,
    metric: string
): AnomalyType {
    const deviation = (value - expected) / (baselineVolatility || 1);

    // Volatility increase
    if (localVolatility > baselineVolatility * 2) return 'volatility';

    // Sudden spike
    if (deviation > 3) return 'spike';

    // Sudden drop
    if (deviation < -3) return 'drop';

    // Trend deviation (drift)
    if (Math.abs(localTrend) > 0.05) return 'drift';

    // Behavioral shift (mean changed)
    if (Math.abs(deviation) > 2) return deviation > 0 ? 'spike' : 'drop';

    return 'behavioral_shift';
}

// ─── Severity Classification ─────────────────────────────────
function classifySeverity(zScore: number): 'critical' | 'high' | 'medium' | 'low' {
    const abs = Math.abs(zScore);
    if (abs > 4) return 'critical';
    if (abs > 3) return 'high';
    if (abs > 2) return 'medium';
    return 'low';
}

// ─── Generate NL Explanation ─────────────────────────────────
function generateExplanation(
    metric: string,
    value: number,
    expected: number,
    type: AnomalyType,
    severity: string,
    deviationPct: number
): string {
    const dir = value > expected ? 'increased' : 'decreased';
    const pct = Math.abs(deviationPct).toFixed(1);

    const typeLabels: Record<AnomalyType, string> = {
        spike: 'sudden spike',
        drop: 'sudden drop',
        drift: 'trend deviation',
        seasonal_deviation: 'seasonal inconsistency',
        volatility: 'volatility increase',
        behavioral_shift: 'behavioral shift'
    };

    return `${metric} ${dir} by ${pct}% (${typeLabels[type]}). ` +
        `Current value: ${fmt(value)}, expected: ~${fmt(expected)}. ` +
        `Severity: ${severity}.`;
}

// ─── Format Numbers ──────────────────────────────────────────
export const fmt = (v: number) =>
    Math.abs(v) >= 1e6 ? `${(v / 1e6).toFixed(2)}M` :
        Math.abs(v) >= 1e3 ? `${(v / 1e3).toFixed(1)}K` :
            Number.isInteger(v) ? v.toString() :
                v.toFixed(2);

export const pct = (v: number) => `${v >= 0 ? '+' : ''}${v.toFixed(1)}%`;

// ─── Severity Colors ─────────────────────────────────────────
export const SEVERITY_COLORS: Record<string, string> = {
    critical: '#ef4444',
    high: '#f97316',
    medium: '#f59e0b',
    low: '#22c55e'
};

export const TYPE_COLORS: Record<AnomalyType, string> = {
    spike: '#ef4444',
    drop: '#3b82f6',
    drift: '#f59e0b',
    seasonal_deviation: '#8b5cf6',
    volatility: '#ec4899',
    behavioral_shift: '#06b6d4'
};

export const TYPE_LABELS: Record<AnomalyType, string> = {
    spike: 'Sudden Spike',
    drop: 'Sudden Drop',
    drift: 'Trend Deviation',
    seasonal_deviation: 'Seasonal Anomaly',
    volatility: 'Volatility Increase',
    behavioral_shift: 'Behavioral Shift'
};

// ─── Main Detection Entry Point ──────────────────────────────
export function runAnomalyDetection(
    data: Record<string, any>[],
    config: DetectionConfig = { method: 'auto', sensitivity: 3, windowSize: 20 }
): DetectionResult {
    if (!data.length) {
        return {
            anomalies: [], kpis: [], timeSeriesData: [],
            overallHealthScore: 100, totalDataPoints: 0, recommendations: []
        };
    }

    // Infer timestamp column
    const cols = Object.keys(data[0]);
    const tsCol = cols.find(c =>
        /timestamp|date|time|created|updated/i.test(c)
    ) || cols[0];

    // Get numeric columns
    const numericCols = cols.filter(c => {
        if (c === tsCol) return false;
        const sample = data.slice(0, 10).map(r => r[c]);
        return sample.some(v => typeof v === 'number' || (!isNaN(Number(v)) && v !== '' && v !== null));
    });

    const allAnomalies: AnomalyPoint[] = [];
    const kpis: KpiSummary[] = [];
    const anomalyFlags: boolean[][] = numericCols.map(() => new Array(data.length).fill(false));
    const anomalyTypesMap: AnomalyType[][] = data.map(() => []);
    const severityMap: (string | undefined)[] = new Array(data.length).fill(undefined);

    // Sensitivity mapping
    const thresholdMap: Record<number, number> = { 1: 4, 2: 3, 3: 2.5, 4: 2, 5: 1.5 };
    const threshold = thresholdMap[config.sensitivity] || 2.5;
    const iqrMultiplier = threshold * 0.6;

    numericCols.forEach((col, colIdx) => {
        const values = data.map(r => {
            const v = Number(r[col]);
            return isNaN(v) ? 0 : v;
        });

        if (values.every(v => v === 0)) return;

        const m = mean(values);
        const med = median(values);
        const s = std(values);
        const minVal = Math.min(...values);
        const maxVal = Math.max(...values);
        const rMean = rollingMean(values, config.windowSize);
        const rStd = rollingStd(values, config.windowSize);

        // Combined detection
        let flags: boolean[];
        if (config.method === 'zscore') {
            flags = detectZScore(values, threshold);
        } else if (config.method === 'iqr') {
            flags = detectIQR(values, iqrMultiplier);
        } else {
            // Auto: combine methods for robustness
            const zFlags = detectZScore(values, threshold);
            const mzFlags = detectModifiedZScore(values, threshold);
            const iqrFlags = detectIQR(values, iqrMultiplier);
            flags = values.map((_, i) => {
                const votes = [zFlags[i], mzFlags[i], iqrFlags[i]].filter(Boolean).length;
                return votes >= 2; // majority vote
            });
        }

        // Trend computation (simple linear regression slope)
        const n = values.length;
        const xMean = (n - 1) / 2;
        let num = 0, den = 0;
        for (let i = 0; i < n; i++) {
            num += (i - xMean) * (values[i] - m);
            den += (i - xMean) ** 2;
        }
        const slope = den ? num / den : 0;
        const trendPct = m ? (slope * n / m) * 100 : 0;
        const trend: 'up' | 'down' | 'stable' = trendPct > 5 ? 'up' : trendPct < -5 ? 'down' : 'stable';

        let colAnomalyCount = 0;
        const baselineStd = s || 1;

        // Process each flagged point
        flags.forEach((isAnomaly, i) => {
            if (isAnomaly) {
                colAnomalyCount++;
                anomalyFlags[colIdx][i] = true;

                const val = values[i];
                const expected = rMean[i] || m;
                const zScore = s ? (val - m) / s : 0;
                const localVol = rStd[i] || s;
                const deviationPct = expected ? ((val - expected) / expected) * 100 : 0;

                // Local trend (last 10 points)
                const localStart = Math.max(0, i - 10);
                const localValues = values.slice(localStart, i + 1);
                const localTrend = localValues.length > 2
                    ? (localValues[localValues.length - 1] - localValues[0]) / (mean(localValues) || 1)
                    : 0;

                const anomalyType = classifyAnomaly(val, expected, localTrend, localVol, baselineStd, col);
                const severity = classifySeverity(zScore);
                const confidence = Math.min(99, 50 + Math.abs(zScore) * 15);

                anomalyTypesMap[i].push(anomalyType);
                if (!severityMap[i] || severityRank(severity) > severityRank(severityMap[i] as any)) {
                    severityMap[i] = severity;
                }

                allAnomalies.push({
                    index: i,
                    timestamp: String(data[i][tsCol] || `Row ${i}`),
                    metric: col,
                    value: val,
                    expected,
                    deviation: val - expected,
                    zScore,
                    severity,
                    type: anomalyType,
                    explanation: generateExplanation(col, val, expected, anomalyType, severity, deviationPct),
                    confidence
                });
            }
        });

        // Health score: based on anomaly ratio
        const anomalyRatio = colAnomalyCount / values.length;
        const healthScore = Math.max(0, Math.round(100 - anomalyRatio * 500));

        // Sparkline (last 30 points or evenly sampled)
        const sparklineSize = Math.min(30, values.length);
        const step = Math.max(1, Math.floor(values.length / sparklineSize));
        const sparkline = values.filter((_, i) => i % step === 0).slice(-30);

        kpis.push({
            metric: col,
            mean: m,
            median: med,
            std: s,
            min: minVal,
            max: maxVal,
            trend,
            trendPct,
            anomalyCount: colAnomalyCount,
            healthScore,
            sparkline
        });
    });

    // Build time series data
    const timeSeriesData: TimeSeriesPoint[] = data.map((row, i) => {
        const values: Record<string, number> = {};
        numericCols.forEach(col => {
            values[col] = Number(row[col]) || 0;
        });
        const isAnomaly = anomalyFlags.some(flags => flags[i]);
        return {
            timestamp: String(row[tsCol] || `Row ${i}`),
            index: i,
            values,
            isAnomaly,
            anomalyTypes: anomalyTypesMap[i],
            severity: isAnomaly ? (severityMap[i] as any) : undefined
        };
    });

    // Overall health
    const avgHealth = kpis.length ? mean(kpis.map(k => k.healthScore)) : 100;

    // Generate recommendations
    const recommendations = generateRecommendations(allAnomalies, kpis);

    return {
        anomalies: allAnomalies.sort((a, b) => severityRank(b.severity) - severityRank(a.severity)),
        kpis,
        timeSeriesData,
        overallHealthScore: Math.round(avgHealth),
        totalDataPoints: data.length,
        recommendations
    };
}

function severityRank(s: string): number {
    return { critical: 4, high: 3, medium: 2, low: 1 }[s] || 0;
}

// ─── Recommendation Engine ───────────────────────────────────
function generateRecommendations(anomalies: AnomalyPoint[], kpis: KpiSummary[]): Recommendation[] {
    const recs: Recommendation[] = [];

    // Group anomalies by metric
    const byMetric: Record<string, AnomalyPoint[]> = {};
    anomalies.forEach(a => {
        if (!byMetric[a.metric]) byMetric[a.metric] = [];
        byMetric[a.metric].push(a);
    });

    // Check for correlated anomalies
    const metricsWithAnomalies = Object.keys(byMetric);
    if (metricsWithAnomalies.length > 1) {
        // Check temporal correlation
        const firstMetric = metricsWithAnomalies[0];
        const firstIndices = new Set(byMetric[firstMetric].map(a => a.index));
        metricsWithAnomalies.slice(1).forEach(metric => {
            const overlap = byMetric[metric].filter(a => firstIndices.has(a.index));
            if (overlap.length > 2) {
                recs.push({
                    title: `Correlated Anomalies: ${firstMetric} ↔ ${metric}`,
                    description: `${overlap.length} anomalies occur simultaneously in ${firstMetric} and ${metric}. This suggests a common root cause — investigate shared dependencies or upstream data sources.`,
                    severity: 'high',
                    metric: `${firstMetric}, ${metric}`,
                    actionType: 'investigate'
                });
            }
        });
    }

    // Per-metric recommendations
    Object.entries(byMetric).forEach(([metric, anoms]) => {
        const criticalCount = anoms.filter(a => a.severity === 'critical').length;
        const spikeCount = anoms.filter(a => a.type === 'spike').length;
        const dropCount = anoms.filter(a => a.type === 'drop').length;
        const driftCount = anoms.filter(a => a.type === 'drift').length;
        const kpi = kpis.find(k => k.metric === metric);

        if (criticalCount > 0) {
            recs.push({
                title: `Critical Alert: ${metric}`,
                description: `${criticalCount} critical anomalies detected in ${metric}. Immediate investigation recommended. Average deviation: ${fmt(mean(anoms.filter(a => a.severity === 'critical').map(a => Math.abs(a.deviation))))} from expected values.`,
                severity: 'critical',
                metric,
                actionType: 'escalate'
            });
        }

        if (spikeCount > 3) {
            recs.push({
                title: `Recurring Spikes in ${metric}`,
                description: `${spikeCount} spike anomalies detected. Consider implementing automated spike detection alerts and capacity planning for ${metric}.`,
                severity: 'medium',
                metric,
                actionType: 'automate'
            });
        }

        if (dropCount > 3) {
            recs.push({
                title: `Recurring Drops in ${metric}`,
                description: `${dropCount} sudden drops observed in ${metric}. This pattern may indicate intermittent failures or resource exhaustion. Set up monitoring thresholds.`,
                severity: 'medium',
                metric,
                actionType: 'monitor'
            });
        }

        if (driftCount > 0 && kpi) {
            recs.push({
                title: `Trend Drift Detected: ${metric}`,
                description: `${metric} is showing a ${kpi.trend} trend (${pct(kpi.trendPct)}). This gradual drift may compound over time. Review baseline assumptions and update thresholds.`,
                severity: Math.abs(kpi.trendPct) > 20 ? 'high' : 'low',
                metric,
                actionType: 'monitor'
            });
        }
    });

    // Sort by severity
    return recs.sort((a, b) => severityRank(b.severity) - severityRank(a.severity));
}

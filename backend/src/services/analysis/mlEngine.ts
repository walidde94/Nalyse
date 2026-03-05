/**
 * ML Engine — Advanced Statistical & Machine Learning Analysis
 *
 * Pure TypeScript implementation (no Python dependency required).
 * Provides: Pearson/Spearman correlation matrix, K-Means clustering,
 * and distribution-aware outlier detection.
 *
 * @module mlEngine
 */

import { Insight, AnalysisOption } from './types';

// ═══════════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════════

const parseNum = (val: any): number => {
    if (typeof val === 'number') return val;
    const s = String(val).replace(/[$€£,% ]/g, '').trim();
    return parseFloat(s);
};

/** Compute the rank (1-indexed) for Spearman */
function rankArray(arr: number[]): number[] {
    const indexed = arr.map((v, i) => ({ v, i }));
    indexed.sort((a, b) => a.v - b.v);
    const ranks = new Array(arr.length);
    let i = 0;
    while (i < indexed.length) {
        let j = i;
        while (j < indexed.length && indexed[j].v === indexed[i].v) j++;
        const avgRank = (i + j + 1) / 2; // average rank for ties
        for (let k = i; k < j; k++) ranks[indexed[k].i] = avgRank;
        i = j;
    }
    return ranks;
}

/** Mean of an array */
function mean(arr: number[]): number {
    return arr.reduce((s, v) => s + v, 0) / arr.length;
}

/** Standard deviation */
function stddev(arr: number[]): number {
    const m = mean(arr);
    return Math.sqrt(arr.reduce((s, v) => s + (v - m) ** 2, 0) / arr.length);
}

/** Euclidean distance */
function euclidean(a: number[], b: number[]): number {
    let sum = 0;
    for (let i = 0; i < a.length; i++) sum += (a[i] - b[i]) ** 2;
    return Math.sqrt(sum);
}

// ═══════════════════════════════════════════════════════════════════
// 1. CORRELATION MATRIX (Pearson + Spearman)
// ═══════════════════════════════════════════════════════════════════

export interface CorrelationEntry {
    col1: string;
    col2: string;
    pearson: number;
    spearman: number;
    pValue: string;
    n: number;
    strength: 'none' | 'weak' | 'moderate' | 'strong' | 'very_strong';
}

export interface CorrelationMatrix {
    columns: string[];
    matrix: number[][];     // Pearson values
    spearmanMatrix: number[][];
    entries: CorrelationEntry[];
}

function computePearson(x: number[], y: number[]): number {
    const n = x.length;
    const mX = mean(x), mY = mean(y);
    let num = 0, dX = 0, dY = 0;
    for (let i = 0; i < n; i++) {
        const dx = x[i] - mX, dy = y[i] - mY;
        num += dx * dy;
        dX += dx * dx;
        dY += dy * dy;
    }
    const den = Math.sqrt(dX * dY);
    return den === 0 ? 0 : num / den;
}

function computeSpearman(x: number[], y: number[]): number {
    return computePearson(rankArray(x), rankArray(y));
}

function estimatePValue(r: number, n: number): string {
    if (n < 3) return '> 0.05';
    const t = Math.abs(r) * Math.sqrt((n - 2) / (1 - r * r + 1e-12));
    if (t > 3.89) return '< 0.0001';
    if (t > 3.29) return '< 0.001';
    if (t > 2.58) return '< 0.01';
    if (t > 1.96) return '< 0.05';
    return '> 0.05';
}

function correlationStrength(r: number): CorrelationEntry['strength'] {
    const a = Math.abs(r);
    if (a > 0.9) return 'very_strong';
    if (a > 0.7) return 'strong';
    if (a > 0.4) return 'moderate';
    if (a > 0.2) return 'weak';
    return 'none';
}

export function computeCorrelationMatrix(
    records: any[],
    numericColumns: string[]
): CorrelationMatrix {
    const cols = numericColumns.slice(0, 10); // Limit to 10 columns for performance
    const n = cols.length;

    // Extract numeric arrays
    const arrays: number[][] = cols.map(col =>
        records.map(r => parseNum(r[col])).filter(v => !isNaN(v))
    );

    // Find common valid indices for each pair
    const pearsonMatrix: number[][] = Array.from({ length: n }, () => new Array(n).fill(0));
    const spearmanMatrix: number[][] = Array.from({ length: n }, () => new Array(n).fill(0));
    const entries: CorrelationEntry[] = [];

    for (let i = 0; i < n; i++) {
        pearsonMatrix[i][i] = 1;
        spearmanMatrix[i][i] = 1;
        for (let j = i + 1; j < n; j++) {
            // Build paired data (both valid)
            const paired: { x: number; y: number }[] = [];
            for (let k = 0; k < records.length; k++) {
                const x = parseNum(records[k][cols[i]]);
                const y = parseNum(records[k][cols[j]]);
                if (!isNaN(x) && !isNaN(y)) paired.push({ x, y });
            }

            if (paired.length < 5) continue;

            const xArr = paired.map(p => p.x);
            const yArr = paired.map(p => p.y);

            const pearson = computePearson(xArr, yArr);
            const spearman = computeSpearman(xArr, yArr);

            pearsonMatrix[i][j] = pearson;
            pearsonMatrix[j][i] = pearson;
            spearmanMatrix[i][j] = spearman;
            spearmanMatrix[j][i] = spearman;

            entries.push({
                col1: cols[i],
                col2: cols[j],
                pearson: Math.round(pearson * 1000) / 1000,
                spearman: Math.round(spearman * 1000) / 1000,
                pValue: estimatePValue(pearson, paired.length),
                n: paired.length,
                strength: correlationStrength(pearson),
            });
        }
    }

    return { columns: cols, matrix: pearsonMatrix, spearmanMatrix, entries };
}

// ═══════════════════════════════════════════════════════════════════
// 2. K-MEANS CLUSTERING
// ═══════════════════════════════════════════════════════════════════

export interface KMeansResult {
    k: number;
    clusters: number[];     // Cluster assignment per record
    centroids: number[][];  // Centroid coordinates
    silhouetteScore: number;
    clusterSizes: number[];
    iterations: number;
    features: string[];
    clusterProfiles: Array<{
        clusterId: number;
        size: number;
        centroid: Record<string, number>;
        label: string;
    }>;
}

function normalizeColumns(data: number[][]): { normalized: number[][]; mins: number[]; maxs: number[] } {
    const dims = data[0].length;
    const mins = new Array(dims).fill(Infinity);
    const maxs = new Array(dims).fill(-Infinity);

    for (const row of data) {
        for (let d = 0; d < dims; d++) {
            if (row[d] < mins[d]) mins[d] = row[d];
            if (row[d] > maxs[d]) maxs[d] = row[d];
        }
    }

    const normalized = data.map(row =>
        row.map((v, d) => {
            const range = maxs[d] - mins[d];
            return range === 0 ? 0 : (v - mins[d]) / range;
        })
    );

    return { normalized, mins, maxs };
}

function initCentroidsKMeansPP(data: number[][], k: number): number[][] {
    const centroids: number[][] = [];
    // Pick first centroid randomly
    centroids.push([...data[Math.floor(Math.random() * data.length)]]);

    for (let c = 1; c < k; c++) {
        // For each point, compute distance to nearest existing centroid
        const distances = data.map(point => {
            let minDist = Infinity;
            for (const cent of centroids) {
                const d = euclidean(point, cent);
                if (d < minDist) minDist = d;
            }
            return minDist * minDist; // D(x)^2
        });

        // Weighted random selection
        const totalDist = distances.reduce((s, d) => s + d, 0);
        let r = Math.random() * totalDist;
        for (let i = 0; i < distances.length; i++) {
            r -= distances[i];
            if (r <= 0) {
                centroids.push([...data[i]]);
                break;
            }
        }
        if (centroids.length <= c) {
            centroids.push([...data[Math.floor(Math.random() * data.length)]]);
        }
    }

    return centroids;
}

function computeSilhouette(data: number[][], assignments: number[], k: number): number {
    if (data.length < 2 || k < 2) return 0;

    const n = data.length;
    const sampleSize = Math.min(n, 500); // Sample for performance
    const sampleIndices = Array.from({ length: n }, (_, i) => i)
        .sort(() => Math.random() - 0.5)
        .slice(0, sampleSize);

    let totalSilhouette = 0;

    for (const idx of sampleIndices) {
        const myCluster = assignments[idx];
        const clusterDists: Record<number, { sum: number; count: number }> = {};

        for (let j = 0; j < n; j++) {
            if (j === idx) continue;
            const c = assignments[j];
            if (!clusterDists[c]) clusterDists[c] = { sum: 0, count: 0 };
            clusterDists[c].sum += euclidean(data[idx], data[j]);
            clusterDists[c].count++;
        }

        const a = clusterDists[myCluster]?.count > 0
            ? clusterDists[myCluster].sum / clusterDists[myCluster].count
            : 0;

        let b = Infinity;
        for (const [c, info] of Object.entries(clusterDists)) {
            if (Number(c) === myCluster || info.count === 0) continue;
            const avg = info.sum / info.count;
            if (avg < b) b = avg;
        }

        if (b === Infinity) b = 0;
        const s = Math.max(a, b) === 0 ? 0 : (b - a) / Math.max(a, b);
        totalSilhouette += s;
    }

    return totalSilhouette / sampleIndices.length;
}

export function kMeansClustering(
    records: any[],
    numericColumns: string[],
    k: number = 3,
    maxIterations: number = 100
): KMeansResult {
    const features = numericColumns.slice(0, 8); // Limit features
    const maxRows = Math.min(records.length, 5000); // Limit rows for performance

    // Build data matrix
    const rawData: number[][] = [];
    const validIndices: number[] = [];
    for (let i = 0; i < maxRows; i++) {
        const row = features.map(col => parseNum(records[i][col]));
        if (row.every(v => !isNaN(v))) {
            rawData.push(row);
            validIndices.push(i);
        }
    }

    if (rawData.length < k) {
        return {
            k, clusters: [], centroids: [], silhouetteScore: 0,
            clusterSizes: [], iterations: 0, features, clusterProfiles: []
        };
    }

    // Normalize
    const { normalized } = normalizeColumns(rawData);

    // K-Means++ initialization
    let centroids = initCentroidsKMeansPP(normalized, k);
    let assignments = new Array(normalized.length).fill(0);
    let iterations = 0;

    for (let iter = 0; iter < maxIterations; iter++) {
        iterations = iter + 1;
        let changed = false;

        // Assign each point to nearest centroid
        for (let i = 0; i < normalized.length; i++) {
            let minDist = Infinity;
            let minCluster = 0;
            for (let c = 0; c < k; c++) {
                const d = euclidean(normalized[i], centroids[c]);
                if (d < minDist) { minDist = d; minCluster = c; }
            }
            if (assignments[i] !== minCluster) changed = true;
            assignments[i] = minCluster;
        }

        if (!changed) break;

        // Recompute centroids
        const newCentroids = Array.from({ length: k }, () => new Array(features.length).fill(0));
        const counts = new Array(k).fill(0);

        for (let i = 0; i < normalized.length; i++) {
            const c = assignments[i];
            counts[c]++;
            for (let d = 0; d < features.length; d++) {
                newCentroids[c][d] += normalized[i][d];
            }
        }

        for (let c = 0; c < k; c++) {
            if (counts[c] > 0) {
                for (let d = 0; d < features.length; d++) {
                    newCentroids[c][d] /= counts[c];
                }
            }
        }

        centroids = newCentroids;
    }

    // Compute cluster sizes
    const clusterSizes = new Array(k).fill(0);
    assignments.forEach(c => clusterSizes[c]++);

    // Compute silhouette score
    const silhouetteScore = computeSilhouette(normalized, assignments, k);

    // Build cluster profiles (using original unscaled data)
    const clusterProfiles = Array.from({ length: k }, (_, clusterId) => {
        const memberIndices = assignments
            .map((c, i) => (c === clusterId ? i : -1))
            .filter(i => i >= 0);

        const centroid: Record<string, number> = {};
        features.forEach((feat, d) => {
            const vals = memberIndices.map(i => rawData[i][d]);
            centroid[feat] = vals.length > 0 ? Math.round(mean(vals) * 100) / 100 : 0;
        });

        // Auto-label based on dominant feature
        const maxFeat = features.reduce((best, feat) => {
            return centroid[feat] > centroid[best] ? feat : best;
        }, features[0]);

        return {
            clusterId,
            size: clusterSizes[clusterId],
            centroid,
            label: `Cluster ${clusterId + 1} (High ${maxFeat})`
        };
    });

    // Map assignments back to full record indices
    const fullAssignments = new Array(records.length).fill(-1);
    validIndices.forEach((recIdx, i) => { fullAssignments[recIdx] = assignments[i]; });

    return {
        k, clusters: fullAssignments, centroids, silhouetteScore: Math.round(silhouetteScore * 1000) / 1000,
        clusterSizes, iterations, features, clusterProfiles
    };
}

// ═══════════════════════════════════════════════════════════════════
// 3. DISTRIBUTION-AWARE OUTLIER DETECTION
// ═══════════════════════════════════════════════════════════════════

export interface OutlierResult {
    column: string;
    method: 'iqr' | 'modified_zscore' | 'log_iqr';
    distribution: 'normal' | 'log-normal' | 'skewed' | 'uniform' | 'unknown';
    outliers: number[];
    outlierIndices: number[];
    bounds: { lower: number; upper: number };
    skewness: number;
    kurtosis: number;
}

function computeSkewness(values: number[]): number {
    const n = values.length;
    if (n < 3) return 0;
    const m = mean(values);
    const s = stddev(values);
    if (s === 0) return 0;
    return (values.reduce((sum, v) => sum + ((v - m) / s) ** 3, 0) * n) / ((n - 1) * (n - 2));
}

function computeKurtosis(values: number[]): number {
    const n = values.length;
    if (n < 4) return 0;
    const m = mean(values);
    const s = stddev(values);
    if (s === 0) return 0;
    const m4 = values.reduce((sum, v) => sum + ((v - m) / s) ** 4, 0) / n;
    return m4 - 3; // Excess kurtosis
}

function detectDistribution(values: number[]): OutlierResult['distribution'] {
    const skew = Math.abs(computeSkewness(values));
    const kurt = computeKurtosis(values);

    // Check if log-normal (positive skew + all positive values)
    const allPositive = values.every(v => v > 0);
    if (allPositive && skew > 1) {
        const logVals = values.map(v => Math.log(v));
        const logSkew = Math.abs(computeSkewness(logVals));
        if (logSkew < 0.5) return 'log-normal';
    }

    if (skew < 0.5 && Math.abs(kurt) < 1) return 'normal';
    if (skew > 1) return 'skewed';
    if (Math.abs(kurt) < -1) return 'uniform';
    return 'unknown';
}

export function detectOutliersAdvanced(
    records: any[],
    column: string
): OutlierResult {
    const rawValues = records.map(r => parseNum(r[column]));
    const values = rawValues.filter(v => !isNaN(v));

    if (values.length < 10) {
        return {
            column, method: 'iqr', distribution: 'unknown',
            outliers: [], outlierIndices: [], bounds: { lower: -Infinity, upper: Infinity },
            skewness: 0, kurtosis: 0
        };
    }

    const skewness = computeSkewness(values);
    const kurtosis = computeKurtosis(values);
    const distribution = detectDistribution(values);

    let outliers: number[] = [];
    let outlierIndices: number[] = [];
    let bounds: { lower: number; upper: number };

    if (distribution === 'log-normal') {
        // Use IQR on log-transformed data
        const logVals = values.map(v => Math.log(v));
        const sorted = [...logVals].sort((a, b) => a - b);
        const q1 = sorted[Math.floor(sorted.length * 0.25)];
        const q3 = sorted[Math.floor(sorted.length * 0.75)];
        const iqr = q3 - q1;
        const logLower = q1 - 1.5 * iqr;
        const logUpper = q3 + 1.5 * iqr;
        bounds = { lower: Math.exp(logLower), upper: Math.exp(logUpper) };

        rawValues.forEach((v, i) => {
            if (!isNaN(v) && v > 0) {
                const lv = Math.log(v);
                if (lv < logLower || lv > logUpper) {
                    outliers.push(v);
                    outlierIndices.push(i);
                }
            }
        });

        return { column, method: 'log_iqr', distribution, outliers, outlierIndices, bounds, skewness, kurtosis };
    }

    if (distribution === 'skewed' || Math.abs(skewness) > 1) {
        // Use Modified Z-Score (MAD-based) — robust to skewness
        const sorted = [...values].sort((a, b) => a - b);
        const median = sorted[Math.floor(sorted.length / 2)];
        const absDeviations = values.map(v => Math.abs(v - median));
        const madSorted = [...absDeviations].sort((a, b) => a - b);
        const mad = madSorted[Math.floor(madSorted.length / 2)];
        const threshold = 3.5;

        if (mad === 0) {
            // Fallback to standard IQR
            const q1 = sorted[Math.floor(sorted.length * 0.25)];
            const q3 = sorted[Math.floor(sorted.length * 0.75)];
            const iqr = q3 - q1;
            bounds = { lower: q1 - 2.0 * iqr, upper: q3 + 2.0 * iqr }; // Wider bounds for skewed
        } else {
            const modZLower = median - threshold * mad * 1.4826;
            const modZUpper = median + threshold * mad * 1.4826;
            bounds = { lower: modZLower, upper: modZUpper };
        }

        rawValues.forEach((v, i) => {
            if (!isNaN(v) && (v < bounds.lower || v > bounds.upper)) {
                outliers.push(v);
                outlierIndices.push(i);
            }
        });

        return { column, method: 'modified_zscore', distribution, outliers, outlierIndices, bounds, skewness, kurtosis };
    }

    // Standard IQR for normal/uniform distributions
    const sorted = [...values].sort((a, b) => a - b);
    const q1 = sorted[Math.floor(sorted.length * 0.25)];
    const q3 = sorted[Math.floor(sorted.length * 0.75)];
    const iqr = q3 - q1;
    bounds = { lower: q1 - 1.5 * iqr, upper: q3 + 1.5 * iqr };

    rawValues.forEach((v, i) => {
        if (!isNaN(v) && (v < bounds.lower || v > bounds.upper)) {
            outliers.push(v);
            outlierIndices.push(i);
        }
    });

    return { column, method: 'iqr', distribution, outliers, outlierIndices, bounds, skewness, kurtosis };
}


// ═══════════════════════════════════════════════════════════════════
// 4. GENERATE ML INSIGHTS (Integrates into engine pipeline)
// ═══════════════════════════════════════════════════════════════════

export function generateMLInsights(
    records: any[],
    numericColumns: string[]
): { insights: Insight[]; options: AnalysisOption[]; correlationMatrix?: CorrelationMatrix; kmeansResult?: KMeansResult } {
    const insights: Insight[] = [];
    const options: AnalysisOption[] = [];

    if (numericColumns.length < 2 || records.length < 5) {
        return { insights, options };
    }

    // ── Correlation Matrix ──
    const corrMatrix = computeCorrelationMatrix(records, numericColumns);

    // Generate heatmap data for the matrix
    const heatmapData = corrMatrix.columns.map((col, i) => {
        const row: any = { name: col };
        corrMatrix.columns.forEach((col2, j) => {
            row[col2] = Math.round(corrMatrix.matrix[i][j] * 100) / 100;
        });
        return row;
    });

    if (heatmapData.length > 0) {
        options.push({
            id: 'ml-correlation-matrix',
            title: 'Pearson Correlation Matrix',
            description: `Full ${corrMatrix.columns.length}×${corrMatrix.columns.length} correlation matrix with Pearson coefficients.`,
            chartType: 'bar',
            data: heatmapData
        });
    }

    // Add insights for significant correlations
    const significant = corrMatrix.entries.filter(e => e.strength !== 'none' && e.strength !== 'weak');
    significant.sort((a, b) => Math.abs(b.pearson) - Math.abs(a.pearson));

    for (const entry of significant.slice(0, 5)) {
        const dir = entry.pearson > 0 ? 'positive' : 'negative';
        const spearmanNote = Math.abs(entry.pearson - entry.spearman) > 0.15
            ? ` Non-linear relationship detected (Spearman: ${entry.spearman}).`
            : '';

        insights.push({
            id: `ml-corr-${entry.col1}-${entry.col2}`,
            type: 'correlation',
            description: `**${entry.strength.replace('_', ' ')} ${dir} correlation** between ${entry.col1} and ${entry.col2} (r=${entry.pearson}, p${entry.pValue}, n=${entry.n}).${spearmanNote}`,
            confidence: Math.abs(entry.pearson),
            isVerified: true
        });
    }

    // ── K-Means Clustering ──
    if (records.length >= 10 && numericColumns.length >= 2) {
        // Try k=2,3,4,5 and pick best silhouette
        let bestResult: KMeansResult | null = null;
        let bestSilhouette = -1;

        for (const k of [2, 3, 4, 5]) {
            if (records.length < k * 3) continue;
            const result = kMeansClustering(records, numericColumns, k);
            if (result.silhouetteScore > bestSilhouette) {
                bestSilhouette = result.silhouetteScore;
                bestResult = result;
            }
        }

        if (bestResult && bestResult.clusterProfiles.length > 0) {
            // Create scatter chart data showing clusters
            const feat1 = bestResult.features[0];
            const feat2 = bestResult.features[1] || bestResult.features[0];
            const scatterData = records.slice(0, 500).map((r, i) => ({
                name: `Point ${i}`,
                x: parseNum(r[feat1]),
                y: parseNum(r[feat2]),
                cluster: bestResult!.clusters[i],
                value: parseNum(r[feat1])
            })).filter(p => !isNaN(p.x) && !isNaN(p.y) && p.cluster >= 0);

            options.push({
                id: 'ml-kmeans-clusters',
                title: `K-Means Clustering (k=${bestResult.k})`,
                description: `${bestResult.k} segments identified with silhouette score ${bestResult.silhouetteScore}. Features: ${bestResult.features.join(', ')}.`,
                chartType: 'scatter',
                data: scatterData
            });

            insights.push({
                id: 'ml-kmeans-summary',
                type: 'segment',
                description: `**${bestResult.k} natural segments** identified via K-Means clustering (silhouette: ${bestResult.silhouetteScore}, ${bestResult.iterations} iterations). ${bestResult.clusterProfiles.map(p => `${p.label}: ${p.size} records`).join('; ')}.`,
                confidence: Math.max(0.5, bestResult.silhouetteScore),
                isVerified: true
            });
        }
    }

    return { insights, options, correlationMatrix: corrMatrix, kmeansResult: undefined };
}

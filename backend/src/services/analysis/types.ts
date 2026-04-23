// ═══════════════════════════════════════════════════════════════════════════════
// Nalyse Analysis Engine — Type System v3.0
// Enterprise-grade type definitions for the analytical intelligence pipeline
// ═══════════════════════════════════════════════════════════════════════════════

export type AdvancedColumnType =
    | 'text' | 'number' | 'date' | 'category' | 'email'
    | 'currency' | 'percent' | 'id' | 'country' | 'city'
    | 'boolean' | 'url' | 'phone' | 'coordinate' | 'json';

export interface AnalysisOption {
    id: string;
    title: string;
    description: string;
    chartType: 'bar' | 'line' | 'pie' | 'area' | 'scatter' | 'treemap' | 'dual-axis' | 'heatmap' | 'radar';
    data: any[];
    priority?: number;  // Higher = more important, used for sorting
}

export interface Insight {
    id: string;
    type: 'pattern' | 'anomaly' | 'correlation' | 'trend' | 'quality' | 'segment' | 'prediction' | 'risk';
    description: string;
    confidence: number;
    isVerified: boolean;
    severity?: 'info' | 'warning' | 'critical';
    category?: string;
}

export interface ColumnHealth {
    column: string;
    type: string;
    completeness: number;
    uniqueness: number;
    validity: number;
    entropy?: number;       // Shannon entropy for information density
    skewness?: number;      // Distribution skewness for numeric columns
}

export interface DataHealth {
    score: number;
    issues: string[];
    cleanedRows: number;
    columnHealth: ColumnHealth[];
}

export interface AnalysisResult {
    type: string;
    summary: {
        rows: number;
        columns: number;
        columnTypes: Record<string, AdvancedColumnType>;
        dimensions?: string[];
        measures?: string[];
        statistics?: Record<string, ColumnStatistics>;
        [key: string]: any;
    };
    options: AnalysisOption[];
    aiInsights: Insight[];
    keyFindings: Insight[];
    dataLimitations: string[];
    processingLog: string[];
    sampleData: any[];
    dataHealth: DataHealth;
    executiveReasoning?: {
        executiveSummary: string;
        strategicAdvice: string[];
        priorityMatrix: Array<{ task: string; impact: string; effort: string }>;
    };
    metrics?: KeyMetric[];
    processingTimeMs?: number;

    // ── Advanced Intelligence (auto-populated by engine phases 3.5–3.8) ──
    mlAnalysis?: {
        correlationMatrix?: {
            columns: string[];
            matrix: number[][];
            spearmanMatrix: number[][];
            entries: Array<{
                col1: string;
                col2: string;
                pearson: number;
                spearman: number;
                pValue: string;
                n: number;
                strength: string;
            }>;
        };
        kmeansResult?: {
            k: number;
            silhouetteScore: number;
            clusterSizes: number[];
            clusterProfiles: Array<{
                clusterId: number;
                size: number;
                centroid: Record<string, number>;
                label: string;
            }>;
        };
        outlierResults?: Array<{
            column: string;
            method: string;
            distribution: string;
            outlierCount: number;
            bounds: { lower: number; upper: number };
            skewness: number;
            kurtosis: number;
        }>;
    };
    forecast?: {
        column: string;
        dateColumn: string;
        historical: Array<{ date: string; value: number }>;
        forecast: Array<{ date: string; value: number; lower: number; upper: number }>;
        metrics: {
            trend: 'increasing' | 'decreasing' | 'stable';
            confidence: number;
            mape: number;
            r2: number;
            modelReliability: 'High' | 'Medium' | 'Low';
        };
    };
    regressionModel?: {
        dependentVar: string;
        independentVar: string;
        equation: string;
        rSquared: number;
        adjustedRSquared: number;
        pValue: number;
        intercept: number;
        slope: number;
        diagnostics: {
            normalityOk: boolean;
            heteroskedasticity: boolean;
        };
        predictions: Array<{ actual: number; predicted: number }>;
    };
}

export interface KeyMetric {
    label: string;
    value: string;
    trend: string;
    color: string;
    icon: string;
}

export interface ColumnStatistics {
    min?: number;
    max?: number;
    mean?: number;
    median?: number;
    stdDev?: number;
    p25?: number;
    p75?: number;
    nullCount: number;
    distinctCount: number;
    topValues?: Array<{ value: string; count: number }>;
}

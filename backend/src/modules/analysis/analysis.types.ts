// ═══════════════════════════════════════════════════════════════════
// Analysis Configuration Types — Nalyse Analysis Engine
// ═══════════════════════════════════════════════════════════════════

export type AnalysisMode = 'basic' | 'advanced';
export type ThresholdDirection = 'above' | 'below' | 'between';
export type TimeGranularity = 'hourly' | 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';
export type AggregationMethod = 'mean' | 'median' | 'sum' | 'min' | 'max' | 'count' | 'std_dev';
export type ConfidenceLevel = 0.90 | 0.95 | 0.99;

/**
 * Threshold configuration for anomaly / outlier detection
 */
export interface ThresholdConfig {
    metric: string;
    direction: ThresholdDirection;
    value: number;
    upperBound?: number;           // Only when direction === 'between'
    sensitivity: number;           // 0..1, higher = more sensitive
}

/**
 * Weight assigned to a particular column / feature during analysis
 */
export interface FeatureWeight {
    column: string;
    weight: number;                // 0..1, must sum to <= 1.0
    enabled: boolean;
}

/**
 * Temporal filter applied before analysis
 */
export interface TimeRangeFilter {
    column: string;
    start?: string;                // ISO date string
    end?: string;
    granularity: TimeGranularity;
    includeProjections: boolean;   // Whether to generate future forecasts
}

/**
 * Custom row-level filter predicate
 */
export interface CustomFilter {
    column: string;
    operator: 'eq' | 'neq' | 'gt' | 'gte' | 'lt' | 'lte' | 'in' | 'not_in' | 'contains' | 'regex';
    value: string | number | (string | number)[];
}

/**
 * Full analysis configuration object
 */
export interface AnalysisConfig {
    // Identity
    name: string;
    description?: string;
    mode: AnalysisMode;
    isPreset: boolean;

    // Thresholds
    thresholds: ThresholdConfig[];

    // Feature engineering
    featureWeights: FeatureWeight[];
    aggregationMethod: AggregationMethod;

    // Time range
    timeRange?: TimeRangeFilter;

    // Filters
    customFilters: CustomFilter[];

    // Statistical
    confidenceLevel: ConfidenceLevel;
    outlierDetection: boolean;
    outlierMethod: 'iqr' | 'zscore' | 'isolation_forest';
    outlierThreshold: number;      // e.g. 1.5 for IQR, 3 for z-score

    // ML / Advanced
    enableCorrelation: boolean;
    enableClustering: boolean;
    clusterCount: number;
    enableForecasting: boolean;
    forecastHorizon: number;       // Number of periods to forecast

    // Sampling
    maxRows?: number;
    samplePercentage: number;      // 0..100
}

/**
 * Create/Update DTO
 */
export interface CreateAnalysisConfigDTO {
    name: string;
    description?: string;
    mode: AnalysisMode;
    isPreset?: boolean;
    config: Omit<AnalysisConfig, 'name' | 'description' | 'mode' | 'isPreset'>;
}

export interface UpdateAnalysisConfigDTO {
    name?: string;
    description?: string;
    config?: Partial<Omit<AnalysisConfig, 'name' | 'description' | 'mode' | 'isPreset'>>;
}

/**
 * ML-engine payload
 */
export interface MLEngineConfigPayload {
    configId: string;
    datasetId: string;
    config: AnalysisConfig;
}

/**
 * ML-engine response
 */
export interface MLEngineResult {
    insights: Record<string, any>[];
    accuracyMetrics: {
        r2Score?: number;
        mae?: number;
        rmse?: number;
        silhouetteScore?: number;
    };
    confidenceScore: number;       // 0..1
    processingTimeMs: number;
    warnings: string[];
}

/**
 * Validation result
 */
export interface ValidationResult {
    valid: boolean;
    errors: ValidationError[];
    warnings: string[];
}

export interface ValidationError {
    field: string;
    message: string;
    code: string;
}

// ═══════════════════════════════════════════════════════════════════
// Built-in presets
// ═══════════════════════════════════════════════════════════════════

export const DEFAULT_CONFIG: Omit<AnalysisConfig, 'name' | 'description' | 'mode' | 'isPreset'> = {
    thresholds: [],
    featureWeights: [],
    aggregationMethod: 'mean',
    customFilters: [],
    confidenceLevel: 0.95,
    outlierDetection: true,
    outlierMethod: 'iqr',
    outlierThreshold: 1.5,
    enableCorrelation: true,
    enableClustering: false,
    clusterCount: 3,
    enableForecasting: false,
    forecastHorizon: 12,
    samplePercentage: 100,
};

export const BUILT_IN_PRESETS: { name: string; description: string; config: typeof DEFAULT_CONFIG }[] = [
    {
        name: 'Quick Scan',
        description: 'Fast exploratory analysis with default thresholds. Perfect for initial data review.',
        config: {
            ...DEFAULT_CONFIG,
            outlierDetection: true,
            enableCorrelation: true,
            enableClustering: false,
            enableForecasting: false,
            samplePercentage: 50,
        },
    },
    {
        name: 'Deep Dive',
        description: 'Comprehensive analysis with clustering, correlations, and forecasting for strategic planning.',
        config: {
            ...DEFAULT_CONFIG,
            confidenceLevel: 0.99,
            outlierDetection: true,
            outlierMethod: 'isolation_forest',
            outlierThreshold: 0.1,
            enableCorrelation: true,
            enableClustering: true,
            clusterCount: 5,
            enableForecasting: true,
            forecastHorizon: 24,
            samplePercentage: 100,
        },
    },
    {
        name: 'Risk Assessment',
        description: 'Focused on anomaly detection and threshold monitoring for compliance & risk management.',
        config: {
            ...DEFAULT_CONFIG,
            confidenceLevel: 0.99,
            outlierDetection: true,
            outlierMethod: 'zscore',
            outlierThreshold: 2.5,
            enableCorrelation: true,
            enableClustering: false,
            enableForecasting: true,
            forecastHorizon: 6,
            samplePercentage: 100,
        },
    },
];

import {
    AnalysisConfig, ValidationResult, ValidationError,
    ThresholdConfig, FeatureWeight, CustomFilter
} from './analysis.types';

/**
 * Validate a complete analysis configuration.
 */
export function validateAnalysisConfig(
    config: Partial<AnalysisConfig>
): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: string[] = [];

    // ── Name ──────────────────────────────────────────────────────
    if (!config.name || config.name.trim().length < 2) {
        errors.push({ field: 'name', message: 'Name must be at least 2 characters.', code: 'NAME_TOO_SHORT' });
    }
    if (config.name && config.name.length > 120) {
        errors.push({ field: 'name', message: 'Name must be 120 characters or fewer.', code: 'NAME_TOO_LONG' });
    }

    // ── Confidence level ─────────────────────────────────────────
    if (config.confidenceLevel !== undefined) {
        if (![0.90, 0.95, 0.99].includes(config.confidenceLevel)) {
            errors.push({ field: 'confidenceLevel', message: 'Confidence level must be 0.90, 0.95, or 0.99.', code: 'INVALID_CONFIDENCE' });
        }
    }

    // ── Sample percentage ────────────────────────────────────────
    if (config.samplePercentage !== undefined) {
        if (config.samplePercentage < 1 || config.samplePercentage > 100) {
            errors.push({ field: 'samplePercentage', message: 'Sample percentage must be between 1 and 100.', code: 'INVALID_SAMPLE' });
        }
        if (config.samplePercentage < 10) {
            warnings.push('Sample percentage below 10% may yield unreliable results.');
        }
    }

    // ── Cluster count ────────────────────────────────────────────
    if (config.enableClustering && config.clusterCount !== undefined) {
        if (config.clusterCount < 2 || config.clusterCount > 20) {
            errors.push({ field: 'clusterCount', message: 'Cluster count must be between 2 and 20.', code: 'INVALID_CLUSTERS' });
        }
    }

    // ── Forecast horizon ─────────────────────────────────────────
    if (config.enableForecasting && config.forecastHorizon !== undefined) {
        if (config.forecastHorizon < 1 || config.forecastHorizon > 120) {
            errors.push({ field: 'forecastHorizon', message: 'Forecast horizon must be between 1 and 120 periods.', code: 'INVALID_HORIZON' });
        }
        if (config.forecastHorizon > 60) {
            warnings.push('Forecast horizon > 60 periods may reduce prediction accuracy.');
        }
    }

    // ── Thresholds ───────────────────────────────────────────────
    validateThresholds(config.thresholds, errors);

    // ── Feature weights ──────────────────────────────────────────
    validateFeatureWeights(config.featureWeights, errors, warnings);

    // ── Custom filters ───────────────────────────────────────────
    validateCustomFilters(config.customFilters, errors);

    // ── Outlier threshold ────────────────────────────────────────
    if (config.outlierDetection && config.outlierThreshold !== undefined) {
        if (config.outlierThreshold <= 0) {
            errors.push({ field: 'outlierThreshold', message: 'Outlier threshold must be positive.', code: 'INVALID_OUTLIER_THRESHOLD' });
        }
        if (config.outlierMethod === 'zscore' && config.outlierThreshold > 10) {
            errors.push({ field: 'outlierThreshold', message: 'Z-score threshold should not exceed 10.', code: 'ZSCORE_TOO_HIGH' });
        }
        if (config.outlierMethod === 'isolation_forest' && (config.outlierThreshold < 0 || config.outlierThreshold > 0.5)) {
            errors.push({ field: 'outlierThreshold', message: 'Isolation forest contamination should be between 0.0 and 0.5.', code: 'IF_CONTAMINATION_INVALID' });
        }
    }

    // ── Conflict detection ───────────────────────────────────────
    detectConflicts(config, errors, warnings);

    return { valid: errors.length === 0, errors, warnings };
}

// ─── Helpers ─────────────────────────────────────────────────────

function validateThresholds(thresholds: ThresholdConfig[] | undefined, errors: ValidationError[]) {
    if (!thresholds) return;

    thresholds.forEach((t, i) => {
        if (!t.metric) {
            errors.push({ field: `thresholds[${i}].metric`, message: 'Threshold metric is required.', code: 'THRESHOLD_NO_METRIC' });
        }
        if (t.sensitivity < 0 || t.sensitivity > 1) {
            errors.push({ field: `thresholds[${i}].sensitivity`, message: 'Sensitivity must be between 0 and 1.', code: 'THRESHOLD_SENSITIVITY' });
        }
        if (t.direction === 'between') {
            if (t.upperBound === undefined) {
                errors.push({ field: `thresholds[${i}].upperBound`, message: 'Upper bound is required for "between" direction.', code: 'THRESHOLD_NO_UPPER' });
            } else if (t.upperBound <= t.value) {
                errors.push({ field: `thresholds[${i}].upperBound`, message: 'Upper bound must be greater than lower value.', code: 'THRESHOLD_BOUNDS' });
            }
        }
    });
}

function validateFeatureWeights(weights: FeatureWeight[] | undefined, errors: ValidationError[], warnings: string[]) {
    if (!weights || weights.length === 0) return;

    const enabledWeights = weights.filter(w => w.enabled);
    const totalWeight = enabledWeights.reduce((sum, w) => sum + w.weight, 0);

    if (totalWeight > 1.01) {
        errors.push({ field: 'featureWeights', message: `Total enabled weight is ${totalWeight.toFixed(2)}, must be ≤ 1.0.`, code: 'WEIGHT_OVERFLOW' });
    }
    if (totalWeight > 0 && totalWeight < 0.5) {
        warnings.push(`Total feature weight is only ${(totalWeight * 100).toFixed(0)}%. Unweighted features will receive equal implicit weight.`);
    }

    weights.forEach((w, i) => {
        if (w.weight < 0 || w.weight > 1) {
            errors.push({ field: `featureWeights[${i}].weight`, message: 'Individual weight must be between 0 and 1.', code: 'WEIGHT_RANGE' });
        }
    });

    // Check duplicates
    const seen = new Set<string>();
    weights.forEach((w, i) => {
        if (seen.has(w.column)) {
            errors.push({ field: `featureWeights[${i}].column`, message: `Duplicate weight for column "${w.column}".`, code: 'WEIGHT_DUPLICATE' });
        }
        seen.add(w.column);
    });
}

function validateCustomFilters(filters: CustomFilter[] | undefined, errors: ValidationError[]) {
    if (!filters) return;

    const validOperators = ['eq', 'neq', 'gt', 'gte', 'lt', 'lte', 'in', 'not_in', 'contains', 'regex'];

    filters.forEach((f, i) => {
        if (!f.column) {
            errors.push({ field: `customFilters[${i}].column`, message: 'Filter column is required.', code: 'FILTER_NO_COLUMN' });
        }
        if (!validOperators.includes(f.operator)) {
            errors.push({ field: `customFilters[${i}].operator`, message: `Invalid operator "${f.operator}".`, code: 'FILTER_BAD_OP' });
        }
        if (['in', 'not_in'].includes(f.operator) && !Array.isArray(f.value)) {
            errors.push({ field: `customFilters[${i}].value`, message: 'Value must be an array for "in" / "not_in" operators.', code: 'FILTER_ARRAY_EXPECTED' });
        }
    });
}

function detectConflicts(config: Partial<AnalysisConfig>, errors: ValidationError[], warnings: string[]) {
    // Forecasting without a time range
    if (config.enableForecasting && !config.timeRange) {
        warnings.push('Forecasting is enabled but no time range is configured. The engine will attempt to auto-detect temporal columns.');
    }

    // Clustering with very small sample
    if (config.enableClustering && config.samplePercentage && config.samplePercentage < 20) {
        warnings.push('Clustering on less than 20% of data may produce unstable clusters.');
    }

    // Excessive thresholds
    if (config.thresholds && config.thresholds.length > 50) {
        errors.push({ field: 'thresholds', message: 'Maximum 50 thresholds allowed per configuration.', code: 'TOO_MANY_THRESHOLDS' });
    }

    // Excessive filters
    if (config.customFilters && config.customFilters.length > 30) {
        errors.push({ field: 'customFilters', message: 'Maximum 30 custom filters allowed per configuration.', code: 'TOO_MANY_FILTERS' });
    }
}

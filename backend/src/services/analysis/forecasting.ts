import * as ss from 'simple-statistics';
import { linearRegression, linearRegressionLine } from 'simple-statistics';

export interface ForecastResult {
    historical: Array<{ date: string; value: number }>;
    forecast: Array<{ date: string; value: number; lower: number; upper: number }>;
    metrics: {
        trend: 'increasing' | 'decreasing' | 'stable';
        confidence: number;
        mape: number; // Mean Absolute Percentage Error
        r2: number; // R-squared
        modelReliability: 'High' | 'Medium' | 'Low';
    };
}

/**
 * Generate time series forecast using linear regression + moving average
 */
export function generateForecast(
    data: any[],
    dateColumn: string,
    valueColumn: string,
    periods: number = 30
): ForecastResult {
    // Sort data by date
    const sorted = data
        .filter(row => row[dateColumn] && row[valueColumn] != null)
        .map(row => ({
            date: new Date(row[dateColumn]),
            value: parseFloat(row[valueColumn])
        }))
        .filter(row => !isNaN(row.value) && !isNaN(row.date.getTime()))
        .sort((a, b) => a.date.getTime() - b.date.getTime());

    if (sorted.length < 3) {
        throw new Error('Need at least 3 data points for forecasting');
    }

    // Convert dates to numeric values (days since first date)
    const firstDate = sorted[0].date.getTime();
    const points: Array<[number, number]> = sorted.map(row => [
        (row.date.getTime() - firstDate) / (1000 * 60 * 60 * 24), // Days
        row.value
    ]);

    // Calculate linear regression
    const regression = linearRegression(points);
    const predict = linearRegressionLine(regression);

    // Calculate R-squared
    const yMean = ss.mean(points.map(p => p[1]));
    const ssTotal = ss.sum(points.map(p => Math.pow(p[1] - yMean, 2)));
    const ssResidual = ss.sum(points.map(p => Math.pow(p[1] - predict(p[0]), 2)));
    const r2 = 1 - (ssResidual / ssTotal);

    // Calculate MAPE (Mean Absolute Percentage Error)
    // Avoid division by zero by adding a small epsilon or filtering zeros
    const mapeErrors = points
        .filter(p => Math.abs(p[1]) > 0.00001)
        .map(p => Math.abs((p[1] - predict(p[0])) / p[1]));

    const mape = mapeErrors.length > 0 ? ss.mean(mapeErrors) * 100 : 0;

    // Ensure metrics are valid numbers (prevent Infinity/NaN from JSON serialization issues)
    const safeMape = isFinite(mape) ? mape : 0;
    const safeR2 = isFinite(r2) ? r2 : 0;
    const confidence = Math.max(0, Math.min(100, (1 - safeMape / 100) * 100));
    const safeConfidence = isFinite(confidence) ? confidence : 0;

    // Calculate standard error for confidence intervals
    const residuals = points.map(p => p[1] - predict(p[0]));
    const stdError = ss.standardDeviation(residuals);

    // Determine trend
    const trend = regression.m > 0.01 ? 'increasing' :
        regression.m < -0.01 ? 'decreasing' : 'stable';

    // Generate forecast
    const lastDay = points[points.length - 1][0];
    const lastDate = sorted[sorted.length - 1].date;

    const forecast: Array<{ date: string; value: number; lower: number; upper: number }> = [];

    for (let i = 1; i <= periods; i++) {
        const futureDay = lastDay + i;
        const predictedValue = predict(futureDay);

        // Confidence interval widens as we go further into future
        const confidenceMultiplier = 1.96 * (1 + i / periods); // 95% confidence
        const margin = stdError * confidenceMultiplier;

        const futureDate = new Date(lastDate);
        futureDate.setDate(futureDate.getDate() + i);

        forecast.push({
            date: futureDate.toISOString().split('T')[0],
            value: Math.max(0, predictedValue), // Prevent negative forecasts
            lower: Math.max(0, predictedValue - margin),
            upper: predictedValue + margin
        });
    }

    // Format historical data
    const historical = sorted.map(row => ({
        date: row.date.toISOString().split('T')[0],
        value: row.value
    }));

    return {
        historical,
        forecast,
        metrics: {
            trend,
            confidence: safeConfidence,
            mape: safeMape,
            r2: safeR2,
            modelReliability: safeR2 > 0.8 ? 'High' : safeR2 > 0.5 ? 'Medium' : 'Low'
        }
    };
}

/**
 * Detect seasonality in time series data
 */
export function detectSeasonality(
    data: any[],
    dateColumn: string,
    valueColumn: string
): {
    hasSeasonality: boolean;
    period: number | null;
    strength: number;
} {
    const sorted = data
        .filter(row => row[dateColumn] && row[valueColumn] != null)
        .map(row => ({
            date: new Date(row[dateColumn]),
            value: parseFloat(row[valueColumn])
        }))
        .filter(row => !isNaN(row.value))
        .sort((a, b) => a.date.getTime() - b.date.getTime());

    if (sorted.length < 14) {
        return { hasSeasonality: false, period: null, strength: 0 };
    }

    // Check for weekly seasonality (7-day period)
    const weeklyPattern = sorted.map((row, i) => ({
        dayOfWeek: row.date.getDay(),
        value: row.value
    }));

    const dayAverages = new Array(7).fill(0).map((_, day) => {
        const dayValues = weeklyPattern.filter(p => p.dayOfWeek === day).map(p => p.value);
        return dayValues.length > 0 ? ss.mean(dayValues) : 0;
    });

    const overallMean = ss.mean(sorted.map(r => r.value));
    const seasonalVariance = ss.variance(dayAverages);
    const totalVariance = ss.variance(sorted.map(r => r.value));

    const strength = totalVariance > 0 ? (seasonalVariance / totalVariance) * 100 : 0;

    return {
        hasSeasonality: strength > 10, // >10% variance explained by day-of-week
        period: 7,
        strength
    };
}

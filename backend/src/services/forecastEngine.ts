import {
    linearRegression,
    linearRegressionLine,
    rSquared,
    sampleStandardDeviation
} from 'simple-statistics';

// Helper function to calculate RMSE
const calculateRMSE = (actual: number[], expected: number[]) => {
    if (actual.length !== expected.length || actual.length === 0) return 0;
    const sse = actual.reduce((sum, val, i) => sum + Math.pow(val - expected[i], 2), 0);
    return Math.sqrt(sse / actual.length);
};

export const runLinearForecast = (data: number[], forecastPeriods: number) => {
    // Format data for simple-statistics [x, y] where x is the time index
    const points = data.map((y, x) => [x, y] as [number, number]);
    
    // Train Model
    const regressionModel = linearRegression(points);
    const lineFunc = linearRegressionLine(regressionModel);
    
    // Evaluate Data Fit
    const predictedY = data.map((_, x) => lineFunc(x));
    const r2 = rSquared(points, lineFunc);
    const rmse = calculateRMSE(points.map(p => p[1]), predictedY);
    
    // Calculate Confidence Interval (Naive approximation ~ 95%)
    // 1.96 * standard deviation of residuals
    const residuals = points.map((p, x) => p[1] - lineFunc(x));
    const residualStdev = sampleStandardDeviation(residuals) || rmse;
    const marginOfError = 1.96 * residualStdev;

    // Generate Forecast Horizon
    const lastX = data.length - 1;
    const forecast = [];
    
    for (let i = 1; i <= forecastPeriods; i++) {
        const xOut = lastX + i;
        const yOut = lineFunc(xOut);
        
        // Expand the margin of error slightly over time to represent growing uncertainty
        const expandedMargin = marginOfError * (1 + (i * 0.05));
        
        forecast.push({
            step: i,
            value: yOut,
            upperBound: yOut + expandedMargin,
            lowerBound: Math.max(0, yOut - expandedMargin) // Assuming non-negative for most business metrics
        });
    }

    return {
        metrics: {
            rSquared: r2,
            rmse: rmse,
            direction: regressionModel.m > 0 ? 'Upward' : regressionModel.m < 0 ? 'Downward' : 'Flat',
            confidence: r2 > 0.8 ? 'High' : r2 > 0.5 ? 'Moderate' : 'Low'
        },
        forecast
    };
};

export const runHoltWintersForecast = (data: number[], forecastPeriods: number) => {
    // Double Exponential Smoothing (Holt's Linear Trend Method)
    const alpha = 0.3; // Data smoothing
    const beta = 0.2;  // Trend smoothing
    
    let level = data[0];
    let trend = data[1] - data[0];
    
    // Train against historical data
    for (let i = 1; i < data.length; i++) {
        const lastLevel = level;
        level = alpha * data[i] + (1 - alpha) * (level + trend);
        trend = beta * (level - lastLevel) + (1 - beta) * trend;
    }
    
    // RMSE approximation
    const historicalPredicted: number[] = [];
    let l = data[0];
    let t = data[1] - data[0];
    for(let i = 0; i < data.length; i++) {
        historicalPredicted.push(l + t);
        const lTemp = l;
        l = alpha * data[i] + (1 - alpha) * (l + t);
        t = beta * (l - lTemp) + (1 - beta) * t;
    }
    const rmse = calculateRMSE(data, historicalPredicted);
    const residualStdev = sampleStandardDeviation(data.map((y,i) => y - historicalPredicted[i])) || rmse;
    const marginOfError = 1.96 * residualStdev;

    // Generate Forecast Horizon
    const forecast = [];
    for (let i = 1; i <= forecastPeriods; i++) {
        const projectedLevel = level + (i * trend);
        const expandedMargin = marginOfError * (1 + (i * 0.1));
        
        forecast.push({
            step: i,
            value: projectedLevel,
            upperBound: projectedLevel + expandedMargin,
            lowerBound: Math.max(0, projectedLevel - expandedMargin)
        });
    }

    // Attempt an R2 equivalent for exponential smoothing fit
    const mean = data.reduce((a, b) => a + b, 0) / data.length;
    const sst = data.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0);
    const sse = data.reduce((sum, val, i) => sum + Math.pow(val - historicalPredicted[i], 2), 0);
    const pseudoR2 = 1 - (sse / sst);

    return {
        metrics: {
            rSquared: pseudoR2,
            rmse: rmse,
            direction: trend > 0 ? 'Upward' : trend < 0 ? 'Downward' : 'Flat',
            confidence: pseudoR2 > 0.8 ? 'High' : pseudoR2 > 0.5 ? 'Moderate' : 'Low'
        },
        forecast
    };
};

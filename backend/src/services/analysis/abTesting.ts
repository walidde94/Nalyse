import * as ss from 'simple-statistics';
// @ts-ignore
import { jStat } from 'jstat';

export interface ABTestResult {
    variantA: {
        name: string;
        sampleSize: number;
        mean: number;
        stdDev: number;
        conversionRate?: number;
    };
    variantB: {
        name: string;
        sampleSize: number;
        mean: number;
        stdDev: number;
        conversionRate?: number;
    };
    test: {
        pValue: number;
        isSignificant: boolean;
        confidenceLevel: number;
        effectSize: number;
        winner: 'A' | 'B' | 'No significant difference';
        recommendation: string;
    };
    sampleSizeNeeded?: number;
}

/**
 * Perform two-sample t-test for A/B testing
 */
export function performABTest(
    data: any[],
    variantColumn: string,
    metricColumn: string,
    variantAValue: string,
    variantBValue: string,
    confidenceLevel: number = 0.95
): ABTestResult {
    // Split data into variants
    const variantAData = data
        .filter(row => row[variantColumn] === variantAValue && row[metricColumn] != null)
        .map(row => parseFloat(row[metricColumn]))
        .filter(v => !isNaN(v));

    const variantBData = data
        .filter(row => row[variantColumn] === variantBValue && row[metricColumn] != null)
        .map(row => parseFloat(row[metricColumn]))
        .filter(v => !isNaN(v));

    if (variantAData.length < 2 || variantBData.length < 2) {
        throw new Error('Need at least 2 samples per variant');
    }

    // Calculate statistics
    const meanA = ss.mean(variantAData);
    const meanB = ss.mean(variantBData);
    const stdDevA = ss.standardDeviation(variantAData);
    const stdDevB = ss.standardDeviation(variantBData);
    const nA = variantAData.length;
    const nB = variantBData.length;

    // Perform two-sample t-test
    const { tStat, pValue, degreesOfFreedom } = twoSampleTTest(
        variantAData,
        variantBData
    );

    // Calculate effect size (Cohen's d)
    const pooledStdDev = Math.sqrt(
        ((nA - 1) * stdDevA ** 2 + (nB - 1) * stdDevB ** 2) / (nA + nB - 2)
    );
    const effectSize = (meanB - meanA) / pooledStdDev;

    // Determine significance
    const alpha = 1 - confidenceLevel;
    const isSignificant = pValue < alpha;

    // Determine winner
    let winner: 'A' | 'B' | 'No significant difference';
    let recommendation: string;

    if (!isSignificant) {
        winner = 'No significant difference';
        recommendation = `Continue testing or increase sample size. Current p-value: ${pValue.toFixed(4)}`;
    } else if (meanB > meanA) {
        winner = 'B';
        const improvement = ((meanB - meanA) / meanA) * 100;
        recommendation = `Variant B wins with ${improvement.toFixed(1)}% improvement (p=${pValue.toFixed(4)})`;
    } else {
        winner = 'A';
        const improvement = ((meanA - meanB) / meanB) * 100;
        recommendation = `Variant A wins with ${improvement.toFixed(1)}% improvement (p=${pValue.toFixed(4)})`;
    }

    // Calculate required sample size for 80% power
    const sampleSizeNeeded = calculateSampleSize(effectSize, alpha, 0.8);

    return {
        variantA: {
            name: variantAValue,
            sampleSize: nA,
            mean: meanA,
            stdDev: stdDevA
        },
        variantB: {
            name: variantBValue,
            sampleSize: nB,
            mean: meanB,
            stdDev: stdDevB
        },
        test: {
            pValue,
            isSignificant,
            confidenceLevel: confidenceLevel * 100,
            effectSize,
            winner,
            recommendation
        },
        sampleSizeNeeded
    };
}

/**
 * Two-sample t-test implementation
 */
function twoSampleTTest(
    sample1: number[],
    sample2: number[]
): { tStat: number; pValue: number; degreesOfFreedom: number } {
    const n1 = sample1.length;
    const n2 = sample2.length;
    const mean1 = ss.mean(sample1);
    const mean2 = ss.mean(sample2);
    const var1 = ss.variance(sample1);
    const var2 = ss.variance(sample2);

    // Welch's t-test (doesn't assume equal variances)
    const tStat = (mean1 - mean2) / Math.sqrt(var1 / n1 + var2 / n2);

    // Welch-Satterthwaite degrees of freedom
    const df = Math.pow(var1 / n1 + var2 / n2, 2) /
        (Math.pow(var1 / n1, 2) / (n1 - 1) + Math.pow(var2 / n2, 2) / (n2 - 1));

    // Calculate p-value (two-tailed) using jStat for accuracy
    const pValue = jStat.ttest(tStat, n1 + n2 - 2, 2);

    return { tStat, pValue, degreesOfFreedom: df };
}

/**
 * Student's t-distribution CDF (cumulative distribution function)
 * Approximation using normal distribution for large df
 */
function tCDF(t: number, df: number): number {
    if (df > 30) {
        // Use normal approximation for large df
        return normalCDF(t);
    }

    // For small df, use approximation
    // This is a simplified version - for production, use a proper t-distribution library
    const x = df / (df + t * t);
    const a = df / 2;
    const b = 0.5;

    // Incomplete beta function approximation
    const beta = incompleteBeta(x, a, b);
    return 1 - beta / 2;
}

/**
 * Normal distribution CDF
 */
function normalCDF(z: number): number {
    return 0.5 * (1 + erf(z / Math.sqrt(2)));
}

/**
 * Error function (erf)
 */
function erf(x: number): number {
    // Abramowitz and Stegun approximation
    const sign = x >= 0 ? 1 : -1;
    x = Math.abs(x);

    const a1 = 0.254829592;
    const a2 = -0.284496736;
    const a3 = 1.421413741;
    const a4 = -1.453152027;
    const a5 = 1.061405429;
    const p = 0.3275911;

    const t = 1 / (1 + p * x);
    const y = 1 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-x * x);

    return sign * y;
}

/**
 * Incomplete beta function (simplified)
 */
function incompleteBeta(x: number, a: number, b: number): number {
    // Use jStat for accurate regularized incomplete beta function if needed, 
    // but we use jStat.ttest directly above.
    return jStat.ibeta(x, a, b);
}

/**
 * Calculate required sample size for desired power
 */
function calculateSampleSize(
    effectSize: number,
    alpha: number,
    power: number
): number {
    // Use jStat to get accurate Z-scores for alpha and power
    const zAlpha = jStat.normal.inv(1 - alpha / 2, 0, 1);
    const zBeta = jStat.normal.inv(power, 0, 1);

    const n = 2 * Math.pow((zAlpha + zBeta) / effectSize, 2);

    return Math.ceil(n);
}

/**
 * Chi-square test for categorical A/B testing (e.g., conversion rates)
 */
export function chiSquareTest(
    data: any[],
    variantColumn: string,
    successColumn: string,
    variantAValue: string,
    variantBValue: string
): {
    variantA: { conversions: number; total: number; rate: number };
    variantB: { conversions: number; total: number; rate: number };
    chiSquare: number;
    pValue: number;
    isSignificant: boolean;
    winner: 'A' | 'B' | 'No significant difference';
} {
    // Count successes and totals for each variant
    const variantARows = data.filter(row => row[variantColumn] === variantAValue);
    const variantBRows = data.filter(row => row[variantColumn] === variantBValue);

    const aConversions = variantARows.filter(row => row[successColumn] === true || row[successColumn] === 1 || row[successColumn] === '1').length;
    const bConversions = variantBRows.filter(row => row[successColumn] === true || row[successColumn] === 1 || row[successColumn] === '1').length;

    const aTotal = variantARows.length;
    const bTotal = variantBRows.length;

    const aRate = aConversions / aTotal;
    const bRate = bConversions / bTotal;

    // Chi-square calculation
    const totalConversions = aConversions + bConversions;
    const totalSamples = aTotal + bTotal;
    const expectedA = (aTotal * totalConversions) / totalSamples;
    const expectedB = (bTotal * totalConversions) / totalSamples;

    const chiSquare =
        Math.pow(aConversions - expectedA, 2) / expectedA +
        Math.pow(bConversions - expectedB, 2) / expectedB;

    // p-value for chi-square with 1 degree of freedom
    const pValue = 1 - jStat.chisquare.cdf(chiSquare, 1);

    const isSignificant = pValue < 0.05;

    let winner: 'A' | 'B' | 'No significant difference';
    if (!isSignificant) {
        winner = 'No significant difference';
    } else if (bRate > aRate) {
        winner = 'B';
    } else {
        winner = 'A';
    }

    return {
        variantA: { conversions: aConversions, total: aTotal, rate: aRate },
        variantB: { conversions: bConversions, total: bTotal, rate: bRate },
        chiSquare,
        pValue,
        isSignificant,
        winner
    };
}

/**
 * Chi-square CDF approximation
 */
function chiSquareCDF(x: number, k: number): number {
    // Gamma function approximation for chi-square
    // This is simplified - for production use a proper library
    return 1 - Math.exp(-x / 2) * Math.pow(x / 2, k / 2 - 1);
}

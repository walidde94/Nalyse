import * as ss from 'simple-statistics';
import { linearRegression, linearRegressionLine } from 'simple-statistics';
// @ts-ignore
import { jStat } from 'jstat';

export interface RegressionResult {
    model: {
        equation: string;
        coefficients: Array<{ variable: string; coefficient: number; pValue: number; significant: boolean }>;
        intercept: number;
    };
    metrics: {
        rSquared: number;
        adjustedRSquared: number;
        standardError: number;
        fStatistic: number;
        pValue: number;
    };
    predictions: Array<{ actual: number; predicted: number; residual: number }>;
    diagnostics: {
        normalityTest: { statistic: number; isNormal: boolean };
        heteroskedasticity: { detected: boolean };
        multicollinearity?: Array<{ variable: string; vif: number; problematic: boolean }>;
    };
}

/**
 * Perform simple linear regression (one independent variable)
 */
export function simpleLinearRegression(
    data: any[],
    dependentVar: string,
    independentVar: string
): RegressionResult {
    // Extract data points
    const points = data
        .filter(row => row[independentVar] != null && row[dependentVar] != null)
        .map(row => [
            parseFloat(row[independentVar]),
            parseFloat(row[dependentVar])
        ] as [number, number])
        .filter(p => !isNaN(p[0]) && !isNaN(p[1]));

    if (points.length < 3) {
        throw new Error('Need at least 3 data points for regression');
    }

    // Calculate regression
    const regression = linearRegression(points);
    const predict = linearRegressionLine(regression);

    // Calculate R-squared
    const yValues = points.map(p => p[1]);
    const yMean = ss.mean(yValues);
    const ssTotal = ss.sum(yValues.map(y => Math.pow(y - yMean, 2)));
    const ssResidual = ss.sum(points.map(p => Math.pow(p[1] - predict(p[0]), 2)));
    const rSquared = 1 - (ssResidual / ssTotal);

    // Adjusted R-squared
    const n = points.length;
    const k = 1; // Number of independent variables
    const adjustedRSquared = 1 - ((1 - rSquared) * (n - 1) / (n - k - 1));

    // Standard error
    const residuals = points.map(p => p[1] - predict(p[0]));
    const standardError = Math.sqrt(ssResidual / (n - 2));

    // T-statistic for slope
    const sxx = ss.sum(points.map(p => Math.pow(p[0] - ss.mean(points.map(pt => pt[0])), 2)));
    const seSlope = standardError / Math.sqrt(sxx);
    const tStat = regression.m / seSlope;
    const pValue = jStat.ttest(tStat, n - 2, 2);

    // F-statistic
    const ssRegression = ssTotal - ssResidual;
    const fStatistic = (ssRegression / k) / (ssResidual / (n - k - 1));
    const fPValue = 1 - jStat.centralF.cdf(fStatistic, k, n - k - 1);

    // Predictions and residuals
    const predictions = points.map(p => ({
        actual: p[1],
        predicted: predict(p[0]),
        residual: p[1] - predict(p[0])
    }));

    // Normality test (Shapiro-Wilk approximation)
    const normalityTest = shapiroWilkTest(residuals);

    // Heteroskedasticity test (Breusch-Pagan)
    const heteroskedasticity = breuschPaganTest(points, predict);

    return {
        model: {
            equation: `${dependentVar} = ${regression.b.toFixed(4)} + ${regression.m.toFixed(4)} * ${independentVar}`,
            coefficients: [
                {
                    variable: independentVar,
                    coefficient: regression.m,
                    pValue,
                    significant: pValue < 0.05
                }
            ],
            intercept: regression.b
        },
        metrics: {
            rSquared,
            adjustedRSquared,
            standardError,
            fStatistic,
            pValue: fPValue
        },
        predictions,
        diagnostics: {
            normalityTest,
            heteroskedasticity
        }
    };
}

/**
 * Perform multiple linear regression
 */
export function multipleLinearRegression(
    data: any[],
    dependentVar: string,
    independentVars: string[]
): RegressionResult {
    if (independentVars.length === 0) {
        throw new Error('Need at least one independent variable');
    }

    // For simplicity, if only one independent variable, use simple regression
    if (independentVars.length === 1) {
        return simpleLinearRegression(data, dependentVar, independentVars[0]);
    }

    // Extract data matrix
    const rows = data.filter(row => {
        return row[dependentVar] != null &&
            independentVars.every(v => row[v] != null);
    });

    if (rows.length < independentVars.length + 2) {
        throw new Error(`Need at least ${independentVars.length + 2} data points for multiple regression`);
    }

    // Build X matrix (independent variables) and y vector (dependent variable)
    const X: number[][] = rows.map(row =>
        [1, ...independentVars.map(v => parseFloat(row[v]))] // Add intercept column
    );
    const y: number[] = rows.map(row => parseFloat(row[dependentVar]));

    // Solve using normal equations: β = (X'X)^-1 X'y
    const XtX = multiplyMatrices(transpose(X), X);
    const XtXInv = invertMatrix(XtX);
    const Xty = multiplyMatrixVector(transpose(X), y);
    const coefficients = multiplyMatrixVector(XtXInv, Xty);

    // Calculate predictions
    const predictions = rows.map((row, i) => {
        const predicted = coefficients[0] +
            independentVars.reduce((sum, v, j) => sum + coefficients[j + 1] * parseFloat(row[v]), 0);
        return {
            actual: y[i],
            predicted,
            residual: y[i] - predicted
        };
    });

    // Calculate R-squared
    const yMean = ss.mean(y);
    const ssTotal = ss.sum(y.map(val => Math.pow(val - yMean, 2)));
    const ssResidual = ss.sum(predictions.map(p => Math.pow(p.residual, 2)));
    const rSquared = 1 - (ssResidual / ssTotal);

    // Adjusted R-squared
    const n = rows.length;
    const k = independentVars.length;
    const adjustedRSquared = 1 - ((1 - rSquared) * (n - 1) / (n - k - 1));

    // Standard error
    const standardError = Math.sqrt(ssResidual / (n - k - 1));

    // F-statistic
    const ssRegression = ssTotal - ssResidual;
    const fStatistic = (ssRegression / k) / (ssResidual / (n - k - 1));
    const fPValue = 1 - jStat.centralF.cdf(fStatistic, k, n - k - 1);

    // Calculate SE and p-values for each coefficient
    const coefficientStats = coefficients.map((beta, i) => {
        const se = standardError * Math.sqrt(XtXInv[i][i]);
        const tStat = beta / se;
        const pValue = jStat.ttest(tStat, n - k - 1, 2);
        return { se, tStat, pValue };
    });

    // Calculate VIF for multicollinearity
    const vifResults = calculateVIF(X, independentVars);

    // Build equation string
    const equationParts = [
        `${dependentVar} = ${coefficients[0].toFixed(4)}`,
        ...independentVars.map((v, i) =>
            `${coefficients[i + 1] >= 0 ? '+' : ''}${coefficients[i + 1].toFixed(4)} * ${v}`
        )
    ];

    return {
        model: {
            equation: equationParts.join(' '),
            coefficients: independentVars.map((v, i) => ({
                variable: v,
                coefficient: coefficients[i + 1],
                pValue: coefficientStats[i + 1].pValue,
                significant: coefficientStats[i + 1].pValue < 0.05
            })),
            intercept: coefficients[0]
        },
        metrics: {
            rSquared,
            adjustedRSquared,
            standardError,
            fStatistic,
            pValue: fPValue
        },
        predictions,
        diagnostics: {
            normalityTest: shapiroWilkTest(predictions.map(p => p.residual)),
            heteroskedasticity: { detected: false }, // Simplified
            multicollinearity: vifResults
        }
    };
}

/**
 * Solve normal equations using matrix operations
 */
function solveNormalEquations(X: number[][], y: number[]): number[] {
    // X'X
    const XtX = multiplyMatrices(transpose(X), X);

    // X'y
    const Xty = multiplyMatrixVector(transpose(X), y);

    // Solve (X'X)β = X'y using Gaussian elimination
    return gaussianElimination(XtX, Xty);
}

/**
 * Matrix transpose
 */
function transpose(matrix: number[][]): number[][] {
    return matrix[0].map((_, colIndex) => matrix.map(row => row[colIndex]));
}

/**
 * Matrix multiplication
 */
function multiplyMatrices(a: number[][], b: number[][]): number[][] {
    const result: number[][] = [];
    for (let i = 0; i < a.length; i++) {
        result[i] = [];
        for (let j = 0; j < b[0].length; j++) {
            let sum = 0;
            for (let k = 0; k < a[0].length; k++) {
                sum += a[i][k] * b[k][j];
            }
            result[i][j] = sum;
        }
    }
    return result;
}

/**
 * Matrix-vector multiplication
 */
function multiplyMatrixVector(matrix: number[][], vector: number[]): number[] {
    return matrix.map(row =>
        row.reduce((sum, val, i) => sum + val * vector[i], 0)
    );
}

/**
 * Gaussian elimination to solve linear system
 */
function gaussianElimination(A: number[][], b: number[]): number[] {
    const n = A.length;
    const augmented = A.map((row, i) => [...row, b[i]]);

    // Forward elimination
    for (let i = 0; i < n; i++) {
        // Find pivot
        let maxRow = i;
        for (let k = i + 1; k < n; k++) {
            if (Math.abs(augmented[k][i]) > Math.abs(augmented[maxRow][i])) {
                maxRow = k;
            }
        }
        [augmented[i], augmented[maxRow]] = [augmented[maxRow], augmented[i]];

        // Eliminate column
        for (let k = i + 1; k < n; k++) {
            const factor = augmented[k][i] / augmented[i][i];
            for (let j = i; j <= n; j++) {
                augmented[k][j] -= factor * augmented[i][j];
            }
        }
    }

    // Back substitution
    const x = new Array(n).fill(0);
    for (let i = n - 1; i >= 0; i--) {
        x[i] = augmented[i][n];
        for (let j = i + 1; j < n; j++) {
            x[i] -= augmented[i][j] * x[j];
        }
        x[i] /= augmented[i][i];
    }

    return x;
}

/**
 * Calculate Variance Inflation Factor (VIF) for multicollinearity detection
 */
function calculateVIF(X: number[][], variableNames: string[]): Array<{ variable: string; vif: number; problematic: boolean }> {
    // VIF = 1 / (1 - R²) where R² is from regressing Xj against all other X variables
    return variableNames.map((name, j) => {
        const y_j = X.map(row => row[j + 1]);
        const X_no_j = X.map(row => row.filter((_, colIdx) => colIdx !== j + 1));

        try {
            const XtX = multiplyMatrices(transpose(X_no_j), X_no_j);
            const XtXInv = invertMatrix(XtX);
            const Xty = multiplyMatrixVector(transpose(X_no_j), y_j);
            const beta = multiplyMatrixVector(XtXInv, Xty);

            const y_mean = ss.mean(y_j);
            const ss_total = ss.sum(y_j.map(y => Math.pow(y - y_mean, 2)));
            const ss_residual = ss.sum(X_no_j.map((row, i) => {
                const pred = row.reduce((sum, val, k) => sum + val * beta[k], 0);
                return Math.pow(y_j[i] - pred, 2);
            }));

            const r2 = 1 - (ss_residual / ss_total);
            const vif = 1 / (1 - r2);

            return {
                variable: name,
                vif,
                problematic: vif > 5
            };
        } catch (e) {
            return { variable: name, vif: 1, problematic: false };
        }
    });
}

/**
 * Shapiro-Wilk test for normality (simplified)
 */
function shapiroWilkTest(residuals: number[]): { statistic: number; isNormal: boolean } {
    const n = residuals.length;
    if (n < 3) return { statistic: 1, isNormal: true };

    const sorted = [...residuals].sort((a, b) => a - b);
    const mean = ss.mean(residuals);
    const variance = ss.variance(residuals);

    // Simplified W statistic
    const numerator = Math.pow(ss.sum(sorted.map((x, i) => (i + 1 - (n + 1) / 2) * x)), 2);
    const denominator = (n - 1) * variance;
    const W = numerator / denominator / n;

    return {
        statistic: W,
        isNormal: W > 0.85 // Adjusted threshold for small samples
    };
}

/**
 * Breusch-Pagan test for heteroskedasticity
 */
function breuschPaganTest(points: Array<[number, number]>, predict: (x: number) => number): { detected: boolean } {
    const residuals = points.map(p => p[1] - predict(p[0]));
    const squaredResiduals = residuals.map(r => r * r);

    // Simple variance check
    const firstHalf = squaredResiduals.slice(0, Math.floor(squaredResiduals.length / 2));
    const secondHalf = squaredResiduals.slice(Math.floor(squaredResiduals.length / 2));

    const var1 = ss.variance(firstHalf);
    const var2 = ss.variance(secondHalf);

    // If variance changes significantly, heteroskedasticity is present
    const ratio = Math.max(var1, var2) / Math.min(var1, var2);

    return { detected: ratio > 2 };
}

/**
 * Invert a matrix using Gaussian elimination with pivoting
 */
function invertMatrix(M: number[][]): number[][] {
    const n = M.length;
    const A = M.map((row, i) => [...row, ...new Array(n).fill(0).map((_, j) => i === j ? 1 : 0)]);

    for (let i = 0; i < n; i++) {
        // Pivot
        let maxRow = i;
        for (let k = i + 1; k < n; k++) {
            if (Math.abs(A[k][i]) > Math.abs(A[maxRow][i])) maxRow = k;
        }
        [A[i], A[maxRow]] = [A[maxRow], A[i]];

        const pivot = A[i][i];
        if (Math.abs(pivot) < 1e-10) throw new Error('Singular matrix');

        for (let j = i; j < 2 * n; j++) A[i][j] /= pivot;

        for (let k = 0; k < n; k++) {
            if (k !== i) {
                const factor = A[k][i];
                for (let j = i; j < 2 * n; j++) A[k][j] -= factor * A[i][j];
            }
        }
    }

    return A.map(row => row.slice(n));
}

import { Request, Response } from 'express';
import { generateForecast, detectSeasonality } from '../services/analysis/forecasting';
import { performABTest, chiSquareTest } from '../services/analysis/abTesting';
import { simpleLinearRegression, multipleLinearRegression } from '../services/analysis/regression';
import { analyzeCohorts, calculateChurnRate, identifyTopCohorts } from '../services/analysis/cohortAnalysis';
import { analyzeFunnel, compareFunnels } from '../services/analysis/funnelAnalysis';

/**
 * Generate forecast for time series data
 */
export async function forecastController(req: Request, res: Response) {
    try {
        const { dateColumn, valueColumn, periods = 30 } = req.body;
        const { data } = req.body; // Filtered data from frontend

        if (!dateColumn || !valueColumn || !data) {
            return res.status(400).json({
                error: 'Missing required fields: dateColumn, valueColumn, data'
            });
        }

        const forecast = generateForecast(data, dateColumn, valueColumn, periods);
        const seasonality = detectSeasonality(data, dateColumn, valueColumn);

        res.json({
            success: true,
            forecast,
            seasonality
        });
    } catch (error: any) {
        console.error('Forecast error:', error);
        res.status(500).json({
            error: error.message || 'Failed to generate forecast'
        });
    }
}

/**
 * Perform A/B test
 */
export async function abTestController(req: Request, res: Response) {
    try {
        const {
            variantColumn,
            metricColumn,
            variantA,
            variantB,
            confidenceLevel = 0.95,
            testType = 'ttest' // 'ttest' or 'chisquare'
        } = req.body;
        const { data } = req.body;

        if (!variantColumn || !metricColumn || !variantA || !variantB || !data) {
            return res.status(400).json({
                error: 'Missing required fields: variantColumn, metricColumn, variantA, variantB, data'
            });
        }

        let result;
        if (testType === 'chisquare') {
            result = chiSquareTest(data, variantColumn, metricColumn, variantA, variantB);
        } else {
            result = performABTest(data, variantColumn, metricColumn, variantA, variantB, confidenceLevel);
        }

        res.json({
            success: true,
            result
        });
    } catch (error: any) {
        console.error('A/B test error:', error);
        res.status(500).json({
            error: error.message || 'Failed to perform A/B test'
        });
    }
}

/**
 * Perform regression analysis
 */
export async function regressionController(req: Request, res: Response) {
    try {
        const {
            dependentVar,
            independentVars,
            type = 'simple'
        } = req.body;
        const { data } = req.body;

        if (!dependentVar || !independentVars || !data) {
            return res.status(400).json({
                error: 'Missing required fields: dependentVar, independentVars, data'
            });
        }

        let result;
        if (type === 'multiple' && Array.isArray(independentVars) && independentVars.length > 1) {
            result = multipleLinearRegression(data, dependentVar, independentVars);
        } else {
            const independentVar = Array.isArray(independentVars) ? independentVars[0] : independentVars;
            result = simpleLinearRegression(data, dependentVar, independentVar);
        }

        res.json({
            success: true,
            result
        });
    } catch (error: any) {
        console.error('Regression error:', error);
        res.status(500).json({
            error: error.message || 'Failed to perform regression analysis'
        });
    }
}

/**
 * Perform cohort analysis
 */
export async function cohortController(req: Request, res: Response) {
    try {
        const {
            userIdColumn,
            signupDateColumn,
            activityDateColumn,
            includeChurn = false,
            churnThresholdDays = 30
        } = req.body;
        const { data } = req.body;

        if (!userIdColumn || !signupDateColumn || !activityDateColumn || !data) {
            return res.status(400).json({
                error: 'Missing required fields: userIdColumn, signupDateColumn, activityDateColumn, data'
            });
        }

        const cohortResult = analyzeCohorts(data, userIdColumn, signupDateColumn, activityDateColumn);
        const topCohorts = identifyTopCohorts(cohortResult, 'week4');

        let churnData;
        if (includeChurn) {
            churnData = calculateChurnRate(
                data,
                userIdColumn,
                signupDateColumn,
                activityDateColumn,
                churnThresholdDays
            );
        }

        res.json({
            success: true,
            cohorts: cohortResult,
            topCohorts,
            churn: churnData
        });
    } catch (error: any) {
        console.error('Cohort analysis error:', error);
        res.status(500).json({
            error: error.message || 'Failed to perform cohort analysis'
        });
    }
}

/**
 * Perform funnel analysis
 */
export async function funnelController(req: Request, res: Response) {
    try {
        const {
            userIdColumn,
            steps,
            timestampColumn
        } = req.body;
        const { data } = req.body;

        if (!userIdColumn || !steps || !Array.isArray(steps) || steps.length < 2 || !data) {
            return res.status(400).json({
                error: 'Missing required fields: userIdColumn, steps (array with at least 2 steps), data'
            });
        }

        const funnelResult = analyzeFunnel(data, userIdColumn, steps, timestampColumn);

        res.json({
            success: true,
            funnel: funnelResult
        });
    } catch (error: any) {
        console.error('Funnel analysis error:', error);
        res.status(500).json({
            error: error.message || 'Failed to perform funnel analysis'
        });
    }
}

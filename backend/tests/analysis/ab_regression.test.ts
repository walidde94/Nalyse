import { performABTest, chiSquareTest } from '../../src/services/analysis/abTesting';
import { simpleLinearRegression, multipleLinearRegression } from '../../src/services/analysis/regression';

describe('Advanced Analytics Service - AB Testing & Regression', () => {
    const mockData = [
        { variant: 'A', conversions: 1, score: 10, spend: 100, age: 25 },
        { variant: 'A', conversions: 0, score: 12, spend: 110, age: 30 },
        { variant: 'A', conversions: 1, score: 11, spend: 105, age: 28 },
        { variant: 'B', conversions: 1, score: 20, spend: 200, age: 35 },
        { variant: 'B', conversions: 1, score: 22, spend: 210, age: 40 },
        { variant: 'B', conversions: 1, score: 21, spend: 205, age: 38 },
    ];

    describe('AB Testing', () => {
        it('should perform t-test and identify B as winner', () => {
            const result = performABTest(mockData, 'variant', 'score', 'A', 'B');
            expect(result.test.isSignificant).toBe(true);
            expect(result.test.winner).toBe('B');
            expect(result.variantB.mean).toBeGreaterThan(result.variantA.mean);
        });

        it('should perform chi-square test for conversion rates', () => {
            const result = chiSquareTest(mockData, 'variant', 'conversions', 'A', 'B');
            expect(result.variantB.rate).toBe(1);
            expect(result.variantA.rate).toBeCloseTo(0.66, 1);
        });
    });

    describe('Regression Analysis', () => {
        it('should perform simple linear regression', () => {
            const result = simpleLinearRegression(mockData, 'score', 'spend');
            expect(result.metrics.rSquared).toBeGreaterThan(0.9);
            expect(result.model.coefficients[0].significant).toBe(true);
        });

        it('should perform multiple linear regression with p-values', () => {
            const result = multipleLinearRegression(mockData, 'score', ['spend', 'age']);
            expect(result.metrics.rSquared).toBeGreaterThan(0.9);
            expect(result.model.coefficients.length).toBe(2);
            // Each coefficient should have a valid p-value
            result.model.coefficients.forEach(coeff => {
                expect(coeff.pValue).toBeLessThanOrEqual(1);
                expect(coeff.pValue).toBeGreaterThanOrEqual(0);
            });
        });

        it('should detect multicollinearity (VIF)', () => {
            const result = multipleLinearRegression(mockData, 'score', ['spend', 'age']);
            expect(result.diagnostics.multicollinearity).toBeDefined();
            expect(result.diagnostics.multicollinearity![0].vif).toBeGreaterThan(0);
        });
    });
});

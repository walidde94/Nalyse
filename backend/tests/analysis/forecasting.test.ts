import { generateForecast, detectSeasonality } from '../../src/services/analysis/forecasting';

describe('Forecasting Service', () => {
    // Linear trend: y = 10 + 2x
    const linearData = [
        { date: '2024-01-01', value: 10 },
        { date: '2024-01-02', value: 12 },
        { date: '2024-01-03', value: 14 },
        { date: '2024-01-04', value: 16 },
        { date: '2024-01-05', value: 18 },
    ];

    it('should forecast future values based on linear trend', () => {
        const result = generateForecast(linearData, 'date', 'value', 2);

        expect(result.metrics.trend).toBe('increasing');
        expect(result.forecast.length).toBe(2);

        // Expected for Next 2 days: 20, 22
        expect(result.forecast[0].value).toBeCloseTo(20, 1);
        expect(result.forecast[1].value).toBeCloseTo(22, 1);

        expect(result.metrics.r2).toBeGreaterThan(0.99);
        expect(result.metrics.confidence).toBeGreaterThan(90);
    });

    it('should detect seasonality in weekly data', () => {
        // Create 3 weeks of data with weekends at half volume
        const seasonalData = [];
        for (let i = 0; i < 21; i++) {
            const date = new Date('2024-01-01');
            date.setDate(date.getDate() + i);
            const isWeekend = date.getDay() === 0 || date.getDay() === 6;
            seasonalData.push({
                date: date.toISOString().split('T')[0],
                value: isWeekend ? 50 : 100
            });
        }

        const result = detectSeasonality(seasonalData, 'date', 'value');
        expect(result.hasSeasonality).toBe(true);
        expect(result.period).toBe(7);
        expect(result.strength).toBeGreaterThan(50);
    });

    it('should throw error if not enough data points', () => {
        const minimalData = [{ date: '2024-01-01', value: 10 }];
        expect(() => generateForecast(minimalData, 'date', 'value')).toThrow(/at least 3 data points/);
    });
});

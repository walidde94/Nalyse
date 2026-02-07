import { analyzeCohorts } from '../../src/services/analysis/cohortAnalysis';

describe('Cohort Analysis Service', () => {
    const mockData = [
        // Cohort 2024-01
        { userId: '1', signupDate: '2024-01-01', activityDate: '2024-01-01' },
        { userId: '1', signupDate: '2024-01-01', activityDate: '2024-01-08' }, // week 1
        { userId: '1', signupDate: '2024-01-01', activityDate: '2024-02-01' }, // week 4
        { userId: '2', signupDate: '2024-01-15', activityDate: '2024-01-15' },
        { userId: '2', signupDate: '2024-01-15', activityDate: '2024-01-22' }, // week 1

        // Cohort 2024-02
        { userId: '3', signupDate: '2024-02-01', activityDate: '2024-02-01' },
        { userId: '3', signupDate: '2024-02-01', activityDate: '2024-02-15' }, // week 2 (should count for week 1)
    ];

    it('should correctly group users into monthly cohorts', () => {
        const realResult = analyzeCohorts(mockData, 'userId', 'signupDate', 'activityDate');

        expect(realResult.overall.activeCohorts).toBe(2);
        expect(realResult.cohorts[0].cohortName).toBe('2024-01');
        expect(realResult.cohorts[0].size).toBe(2); // users 1 and 2
        expect(realResult.cohorts[1].cohortName).toBe('2024-02');
        expect(realResult.cohorts[1].size).toBe(1); // user 3
    });

    it('should calculate retention rates correctly', () => {
        const result = analyzeCohorts(mockData, 'userId', 'signupDate', 'activityDate');

        // Jan Cohort: 2 users. Both active in week 1. 1 active in week 4.
        const jan = result.cohorts.find(c => c.cohortName === '2024-01');
        expect(jan?.retentionRates.week1).toBe(100);
        expect(jan?.retentionRates.week4).toBe(50);

        // Feb Cohort: 1 user. Active in week 2 (count as week 1).
        const feb = result.cohorts.find(c => c.cohortName === '2024-02');
        expect(feb?.retentionRates.week1).toBe(100);
        expect(feb?.retentionRates.week4).toBe(0);
    });

    it('should handle invalid dates gracefully', () => {
        const dataWithInvalid = [
            ...mockData,
            { userId: '4', signupDate: 'invalid', activityDate: '2024-01-01' }
        ];
        const result = analyzeCohorts(dataWithInvalid, 'userId', 'signupDate', 'activityDate');
        expect(result.overall.totalUsers).toBe(3); // User 4 ignored
    });
});

import { analyzeFunnel, FunnelStep } from '../../src/services/analysis/funnelAnalysis';

describe('Funnel Analysis Service', () => {
    const mockData = [
        { userId: '1', event: 'visit', timestamp: '2024-01-01T10:00:00Z' },
        { userId: '1', event: 'signup', timestamp: '2024-01-01T10:10:00Z' },
        { userId: '1', event: 'purchase', timestamp: '2024-01-02T10:00:00Z' },
        { userId: '2', event: 'visit', timestamp: '2024-01-01T11:00:00Z' },
        { userId: '2', event: 'signup', timestamp: '2024-01-01T11:30:00Z' },
        { userId: '3', event: 'visit', timestamp: '2024-01-02T09:00:00Z' },
        { userId: '4', event: 'purchase', timestamp: '2024-01-02T12:00:00Z' }, // Out of order purchase (should not count if sequential)
    ];

    const steps: FunnelStep[] = [
        { name: 'Visit', eventColumn: 'event', eventValue: 'visit' },
        { name: 'Signup', eventColumn: 'event', eventValue: 'signup' },
        { name: 'Purchase', eventColumn: 'event', eventValue: 'purchase' },
    ];

    it('should correctly calculate funnel metrics for sequential users', () => {
        const result = analyzeFunnel(mockData, 'userId', steps, 'timestamp');

        expect(result.overall.totalUsers).toBe(3); // users 1, 2, 3 visited
        expect(result.overall.completedUsers).toBe(1); // only user 1 did all 3
        expect(result.overall.overallConversion).toBeCloseTo(33.33, 1);

        expect(result.steps[0].users).toBe(3); // visit
        expect(result.steps[1].users).toBe(2); // signup (1 and 2)
        expect(result.steps[2].users).toBe(1); // purchase (only 1)

        expect(result.bottleneck.stepName).toBe('Purchase');
    });

    it('should calculate average time between steps', () => {
        const result = analyzeFunnel(mockData, 'userId', steps, 'timestamp');

        // User 1: visit (T+0) -> signup (T+10m) -> purchase (T+24h)
        // User 2: visit (T+0) -> signup (T+30m)
        // Avg visit to signup: (10m + 30m) / 2 = 20m = 0.0138 days
        expect(result.steps[1].averageTimeToStep).toBeLessThan(0.1);
        expect(result.steps[2].averageTimeToStep).toBeCloseTo(1, 1); // ~1 day
    });

    it('should handle empty data', () => {
        expect(() => analyzeFunnel([], 'userId', steps)).toThrow(); // In reality, many functions might fail on empty. Let's see if it throws or returns empty.
        // Looking at code: steps.forEach uses stepUsers.get(0)!.size. If no users, startUsers = 0.
        // conversionFromStart = (sequentialUsers / startUsers) * 100 -> NaN if startUsers is 0.
    });

    it('should generate meaningful insights', () => {
        const result = analyzeFunnel(mockData, 'userId', steps, 'timestamp');
        expect(result.insights.length).toBeGreaterThan(0);
        expect(result.insights.some(i => i.includes('bottleneck'))).toBeTruthy();
    });
});

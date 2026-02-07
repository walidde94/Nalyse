export interface CohortResult {
    cohorts: Array<{
        cohortName: string;
        cohortDate: string;
        size: number;
        retention: {
            week0: number;
            week1: number;
            week4: number;
            week12: number;
        };
        retentionRates: {
            week0: number; // Always 100%
            week1: number;
            week4: number;
            week12: number;
        };
    }>;
    overall: {
        averageRetention: {
            week1: number;
            week4: number;
            week12: number;
        };
        totalUsers: number;
        activeCohorts: number;
    };
    heatmapData: Array<Array<number>>; // For visualization
}

/**
 * Perform cohort retention analysis
 */
export function analyzeCohorts(
    data: any[],
    userIdColumn: string,
    signupDateColumn: string,
    activityDateColumn: string
): CohortResult {
    // Group users by signup cohort (month)
    const cohortMap = new Map<string, Set<string>>();
    const activityMap = new Map<string, Map<string, Set<string>>>(); // cohort -> week -> users

    data.forEach(row => {
        const userId = String(row[userIdColumn]);
        const signupDate = new Date(row[signupDateColumn]);
        const activityDate = new Date(row[activityDateColumn]);

        if (isNaN(signupDate.getTime()) || isNaN(activityDate.getTime())) {
            return;
        }

        // Cohort key: YYYY-MM
        const cohortKey = `${signupDate.getFullYear()}-${String(signupDate.getMonth() + 1).padStart(2, '0')}`;

        // Add user to cohort
        if (!cohortMap.has(cohortKey)) {
            cohortMap.set(cohortKey, new Set());
        }
        cohortMap.get(cohortKey)!.add(userId);

        // Calculate weeks since signup
        const weeksSinceSignup = Math.floor(
            (activityDate.getTime() - signupDate.getTime()) / (1000 * 60 * 60 * 24 * 7)
        );

        // Track activity by week
        if (!activityMap.has(cohortKey)) {
            activityMap.set(cohortKey, new Map());
        }
        const cohortActivity = activityMap.get(cohortKey)!;

        // Track weeks 0, 1, 4, 12
        const weeksToTrack = [0, 1, 4, 12];
        weeksToTrack.forEach(week => {
            if (weeksSinceSignup >= week) {
                const weekKey = `week${week}`;
                if (!cohortActivity.has(weekKey)) {
                    cohortActivity.set(weekKey, new Set());
                }
                cohortActivity.get(weekKey)!.add(userId);
            }
        });
    });

    // Build cohort results
    const cohorts: CohortResult['cohorts'] = [];
    const heatmapData: number[][] = [];

    // Sort cohorts by date
    const sortedCohorts = Array.from(cohortMap.entries()).sort((a, b) => a[0].localeCompare(b[0]));

    sortedCohorts.forEach(([cohortKey, users]) => {
        const cohortSize = users.size;
        const activity = activityMap.get(cohortKey) || new Map();

        const retention = {
            week0: activity.get('week0')?.size || cohortSize,
            week1: activity.get('week1')?.size || 0,
            week4: activity.get('week4')?.size || 0,
            week12: activity.get('week12')?.size || 0
        };

        const retentionRates = {
            week0: 100,
            week1: (retention.week1 / cohortSize) * 100,
            week4: (retention.week4 / cohortSize) * 100,
            week12: (retention.week12 / cohortSize) * 100
        };

        cohorts.push({
            cohortName: cohortKey,
            cohortDate: cohortKey,
            size: cohortSize,
            retention,
            retentionRates
        });

        // Add to heatmap
        heatmapData.push([
            retentionRates.week0,
            retentionRates.week1,
            retentionRates.week4,
            retentionRates.week12
        ]);
    });

    // Calculate overall averages
    const totalUsers = Array.from(cohortMap.values()).reduce((sum, users) => sum + users.size, 0);
    const avgWeek1 = cohorts.reduce((sum, c) => sum + c.retentionRates.week1, 0) / cohorts.length;
    const avgWeek4 = cohorts.reduce((sum, c) => sum + c.retentionRates.week4, 0) / cohorts.length;
    const avgWeek12 = cohorts.reduce((sum, c) => sum + c.retentionRates.week12, 0) / cohorts.length;

    return {
        cohorts,
        overall: {
            averageRetention: {
                week1: avgWeek1 || 0,
                week4: avgWeek4 || 0,
                week12: avgWeek12 || 0
            },
            totalUsers,
            activeCohorts: cohorts.length
        },
        heatmapData
    };
}

/**
 * Calculate churn rate for a cohort
 */
export function calculateChurnRate(
    data: any[],
    userIdColumn: string,
    signupDateColumn: string,
    lastActivityDateColumn: string,
    churnThresholdDays: number = 30
): {
    totalUsers: number;
    activeUsers: number;
    churnedUsers: number;
    churnRate: number;
    averageDaysToChurn: number;
} {
    const now = new Date();
    const users = new Map<string, { signupDate: Date; lastActivity: Date }>();

    data.forEach(row => {
        const userId = String(row[userIdColumn]);
        const signupDate = new Date(row[signupDateColumn]);
        const lastActivity = new Date(row[lastActivityDateColumn]);

        if (isNaN(signupDate.getTime()) || isNaN(lastActivity.getTime())) {
            return;
        }

        if (!users.has(userId) || users.get(userId)!.lastActivity < lastActivity) {
            users.set(userId, { signupDate, lastActivity });
        }
    });

    let churnedUsers = 0;
    let totalDaysToChurn = 0;

    users.forEach(({ signupDate, lastActivity }) => {
        const daysSinceActivity = (now.getTime() - lastActivity.getTime()) / (1000 * 60 * 60 * 24);

        if (daysSinceActivity > churnThresholdDays) {
            churnedUsers++;
            const daysToChurn = (lastActivity.getTime() - signupDate.getTime()) / (1000 * 60 * 60 * 24);
            totalDaysToChurn += daysToChurn;
        }
    });

    const totalUsers = users.size;
    const activeUsers = totalUsers - churnedUsers;
    const churnRate = (churnedUsers / totalUsers) * 100;
    const averageDaysToChurn = churnedUsers > 0 ? totalDaysToChurn / churnedUsers : 0;

    return {
        totalUsers,
        activeUsers,
        churnedUsers,
        churnRate,
        averageDaysToChurn
    };
}

/**
 * Identify best and worst performing cohorts
 */
export function identifyTopCohorts(
    cohortResult: CohortResult,
    metric: 'week1' | 'week4' | 'week12' = 'week4'
): {
    best: CohortResult['cohorts'][0];
    worst: CohortResult['cohorts'][0];
    insights: string[];
} {
    const cohorts = cohortResult.cohorts;

    if (cohorts.length === 0) {
        throw new Error('No cohorts to analyze');
    }

    const sorted = [...cohorts].sort((a, b) =>
        b.retentionRates[metric] - a.retentionRates[metric]
    );

    const best = sorted[0];
    const worst = sorted[sorted.length - 1];

    const insights: string[] = [];

    // Generate insights
    const avgRetention = cohortResult.overall.averageRetention[metric];
    const bestDiff = best.retentionRates[metric] - avgRetention;
    const worstDiff = avgRetention - worst.retentionRates[metric];

    if (bestDiff > 10) {
        insights.push(`${best.cohortName} cohort performs ${bestDiff.toFixed(1)}% above average at ${metric}`);
    }

    if (worstDiff > 10) {
        insights.push(`${worst.cohortName} cohort performs ${worstDiff.toFixed(1)}% below average at ${metric}`);
    }

    if (cohorts.length >= 3) {
        const trend = calculateRetentionTrend(cohorts, metric);
        if (trend > 0) {
            insights.push(`Retention is improving over time (+${trend.toFixed(1)}% per cohort)`);
        } else if (trend < 0) {
            insights.push(`Retention is declining over time (${trend.toFixed(1)}% per cohort)`);
        }
    }

    return { best, worst, insights };
}

/**
 * Calculate retention trend across cohorts
 */
function calculateRetentionTrend(
    cohorts: CohortResult['cohorts'],
    metric: 'week1' | 'week4' | 'week12'
): number {
    if (cohorts.length < 2) return 0;

    const values = cohorts.map((c, i) => [i, c.retentionRates[metric]]);

    // Simple linear regression
    const n = values.length;
    const sumX = values.reduce((sum, [x]) => sum + x, 0);
    const sumY = values.reduce((sum, [, y]) => sum + y, 0);
    const sumXY = values.reduce((sum, [x, y]) => sum + x * y, 0);
    const sumX2 = values.reduce((sum, [x]) => sum + x * x, 0);

    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);

    return slope;
}

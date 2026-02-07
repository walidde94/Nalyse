export interface FunnelStep {
    name: string;
    eventColumn: string;
    eventValue: any;
}

export interface FunnelResult {
    steps: Array<{
        stepNumber: number;
        stepName: string;
        users: number;
        conversionFromPrevious: number; // %
        conversionFromStart: number; // %
        dropOffFromPrevious: number; // %
        averageTimeToStep?: number; // days
    }>;
    overall: {
        totalUsers: number;
        completedUsers: number;
        overallConversion: number; // %
        averageTimeToComplete?: number; // days
    };
    bottleneck: {
        stepNumber: number;
        stepName: string;
        dropOffRate: number;
    };
    insights: string[];
}

/**
 * Analyze conversion funnel
 */
export function analyzeFunnel(
    data: any[],
    userIdColumn: string,
    steps: FunnelStep[],
    timestampColumn?: string
): FunnelResult {
    if (steps.length < 2) {
        throw new Error('Funnel must have at least 2 steps');
    }

    if (!data || data.length === 0) {
        throw new Error('No data provided for funnel analysis');
    }

    // Track which users completed each step
    const stepUsers: Map<number, Set<string>> = new Map();
    const stepTimestamps: Map<string, Map<number, Date>> = new Map(); // userId -> stepNumber -> timestamp

    // Initialize step tracking
    steps.forEach((_, index) => {
        stepUsers.set(index, new Set());
    });

    // Process data
    data.forEach(row => {
        const userId = String(row[userIdColumn]);

        steps.forEach((step, index) => {
            const eventValue = row[step.eventColumn];

            // Check if this row matches the step criteria
            if (eventValue === step.eventValue ||
                (typeof eventValue === 'string' && typeof step.eventValue === 'string' &&
                    eventValue.toLowerCase() === step.eventValue.toLowerCase())) {

                stepUsers.get(index)!.add(userId);

                // Track timestamp if provided
                if (timestampColumn && row[timestampColumn]) {
                    if (!stepTimestamps.has(userId)) {
                        stepTimestamps.set(userId, new Map());
                    }
                    const timestamp = new Date(row[timestampColumn]);
                    if (!isNaN(timestamp.getTime())) {
                        const userTimestamps = stepTimestamps.get(userId)!;
                        if (!userTimestamps.has(index) || userTimestamps.get(index)! > timestamp) {
                            userTimestamps.set(index, timestamp);
                        }
                    }
                }
            }
        });
    });

    // Calculate funnel metrics
    const funnelSteps: FunnelResult['steps'] = [];
    let previousUsers = 0;
    const startUsers = stepUsers.get(0)!.size;

    steps.forEach((step, index) => {
        const currentUsers = stepUsers.get(index)!.size;

        // Filter users who completed previous steps (sequential funnel)
        let sequentialUsers = currentUsers;
        if (index > 0) {
            const prevStepUsers = stepUsers.get(index - 1)!;
            sequentialUsers = Array.from(stepUsers.get(index)!).filter(userId =>
                prevStepUsers.has(userId)
            ).length;
        }

        const conversionFromPrevious = index === 0 ? 100 : (previousUsers > 0 ? (sequentialUsers / previousUsers) * 100 : 0);
        const conversionFromStart = startUsers > 0 ? (sequentialUsers / startUsers) * 100 : 0;
        const dropOffFromPrevious = index === 0 ? 0 : 100 - conversionFromPrevious;

        // Calculate average time to reach this step
        let averageTimeToStep: number | undefined;
        if (timestampColumn && index > 0) {
            const times: number[] = [];
            stepTimestamps.forEach((userSteps, userId) => {
                if (userSteps.has(0) && userSteps.has(index)) {
                    const startTime = userSteps.get(0)!.getTime();
                    const stepTime = userSteps.get(index)!.getTime();
                    const daysDiff = (stepTime - startTime) / (1000 * 60 * 60 * 24);
                    if (daysDiff >= 0) {
                        times.push(daysDiff);
                    }
                }
            });
            if (times.length > 0) {
                averageTimeToStep = times.reduce((sum, t) => sum + t, 0) / times.length;
            }
        }

        funnelSteps.push({
            stepNumber: index + 1,
            stepName: step.name,
            users: sequentialUsers,
            conversionFromPrevious,
            conversionFromStart,
            dropOffFromPrevious,
            averageTimeToStep
        });

        previousUsers = sequentialUsers;
    });

    // Identify bottleneck (step with highest drop-off)
    const bottleneckStep = funnelSteps
        .slice(1) // Skip first step (always 0% drop-off)
        .reduce((max, step) =>
            step.dropOffFromPrevious > max.dropOffFromPrevious ? step : max
        );

    // Calculate overall metrics
    const completedUsers = funnelSteps[funnelSteps.length - 1].users;
    const overallConversion = (completedUsers / startUsers) * 100;

    // Calculate average time to complete
    let averageTimeToComplete: number | undefined;
    if (timestampColumn) {
        const completionTimes: number[] = [];
        stepTimestamps.forEach((userSteps) => {
            if (userSteps.has(0) && userSteps.has(steps.length - 1)) {
                const startTime = userSteps.get(0)!.getTime();
                const endTime = userSteps.get(steps.length - 1)!.getTime();
                const daysDiff = (endTime - startTime) / (1000 * 60 * 60 * 24);
                if (daysDiff >= 0) {
                    completionTimes.push(daysDiff);
                }
            }
        });
        if (completionTimes.length > 0) {
            averageTimeToComplete = completionTimes.reduce((sum, t) => sum + t, 0) / completionTimes.length;
        }
    }

    // Generate insights
    const insights = generateFunnelInsights(funnelSteps, bottleneckStep, overallConversion);

    return {
        steps: funnelSteps,
        overall: {
            totalUsers: startUsers,
            completedUsers,
            overallConversion,
            averageTimeToComplete
        },
        bottleneck: {
            stepNumber: bottleneckStep.stepNumber,
            stepName: bottleneckStep.stepName,
            dropOffRate: bottleneckStep.dropOffFromPrevious
        },
        insights
    };
}

/**
 * Generate actionable insights from funnel data
 */
function generateFunnelInsights(
    steps: FunnelResult['steps'],
    bottleneck: { stepNumber: number; stepName: string; dropOffFromPrevious: number },
    overallConversion: number
): string[] {
    const insights: string[] = [];

    // Overall conversion insight
    if (overallConversion < 10) {
        insights.push(`⚠️ Low overall conversion rate (${overallConversion.toFixed(1)}%). Consider optimizing the entire funnel.`);
    } else if (overallConversion > 50) {
        insights.push(`✅ Strong overall conversion rate (${overallConversion.toFixed(1)}%).`);
    }

    // Bottleneck insight
    if (bottleneck.dropOffFromPrevious >= 50) {
        insights.push(`🚨 Critical bottleneck at "${bottleneck.stepName}" with ${bottleneck.dropOffFromPrevious.toFixed(1)}% drop-off. Immediate attention needed.`);
    } else if (bottleneck.dropOffFromPrevious >= 30) {
        insights.push(`⚠️ Significant drop-off at "${bottleneck.stepName}" (${bottleneck.dropOffFromPrevious.toFixed(1)}%). Consider A/B testing improvements.`);
    }

    // Step-by-step insights
    steps.forEach((step, index) => {
        if (index > 0 && step.conversionFromPrevious < 50) {
            insights.push(`📉 Only ${step.conversionFromPrevious.toFixed(1)}% of users progress from "${steps[index - 1].stepName}" to "${step.stepName}".`);
        }
    });

    // Time-based insights
    const stepsWithTime = steps.filter(s => s.averageTimeToStep !== undefined);
    if (stepsWithTime.length > 0) {
        const slowestStep = stepsWithTime.reduce((max, step) =>
            (step.averageTimeToStep || 0) > (max.averageTimeToStep || 0) ? step : max
        );
        if ((slowestStep.averageTimeToStep || 0) > 7) {
            insights.push(`⏱️ Users take an average of ${slowestStep.averageTimeToStep?.toFixed(1)} days to reach "${slowestStep.stepName}". Consider reducing friction.`);
        }
    }

    // Best performing step
    const bestStep = steps.slice(1).reduce((max, step) =>
        step.conversionFromPrevious > max.conversionFromPrevious ? step : max
    );
    if (bestStep.conversionFromPrevious > 80) {
        insights.push(`✨ "${bestStep.stepName}" has excellent conversion (${bestStep.conversionFromPrevious.toFixed(1)}%). Use this as a model for other steps.`);
    }

    return insights;
}

/**
 * Compare two funnels (e.g., before/after optimization)
 */
export function compareFunnels(
    funnel1: FunnelResult,
    funnel2: FunnelResult,
    funnel1Name: string = 'Before',
    funnel2Name: string = 'After'
): {
    overallImprovement: number; // % change in overall conversion
    stepImprovements: Array<{
        stepName: string;
        improvement: number; // % change
        significant: boolean;
    }>;
    summary: string;
} {
    const overallImprovement =
        ((funnel2.overall.overallConversion - funnel1.overall.overallConversion) / funnel1.overall.overallConversion) * 100;

    const stepImprovements = funnel1.steps.map((step1, index) => {
        const step2 = funnel2.steps[index];
        const improvement =
            ((step2.conversionFromPrevious - step1.conversionFromPrevious) / step1.conversionFromPrevious) * 100;

        return {
            stepName: step1.stepName,
            improvement,
            significant: Math.abs(improvement) > 10 // >10% change is significant
        };
    });

    let summary: string;
    if (overallImprovement > 10) {
        summary = `${funnel2Name} shows ${overallImprovement.toFixed(1)}% improvement in overall conversion. Optimization successful! 🎉`;
    } else if (overallImprovement < -10) {
        summary = `${funnel2Name} shows ${Math.abs(overallImprovement).toFixed(1)}% decline in overall conversion. Review changes. ⚠️`;
    } else {
        summary = `No significant change in overall conversion (${overallImprovement.toFixed(1)}%). Continue testing.`;
    }

    return {
        overallImprovement,
        stepImprovements,
        summary
    };
}

/**
 * Calculate funnel velocity (how fast users move through funnel)
 */
export function calculateFunnelVelocity(
    funnelResult: FunnelResult
): {
    averageVelocity: number; // steps per day
    fastestUsers: number; // % of users who complete in <1 day
    slowestUsers: number; // % of users who take >7 days
} {
    const stepsWithTime = funnelResult.steps.filter(s => s.averageTimeToStep !== undefined);

    if (stepsWithTime.length === 0) {
        return { averageVelocity: 0, fastestUsers: 0, slowestUsers: 0 };
    }

    const totalTime = funnelResult.overall.averageTimeToComplete || 0;
    const totalSteps = funnelResult.steps.length;
    const averageVelocity = totalTime > 0 ? totalSteps / totalTime : 0;

    // These would require individual user data to calculate accurately
    // Simplified estimates for now
    const fastestUsers = 20; // Placeholder
    const slowestUsers = 15; // Placeholder

    return {
        averageVelocity,
        fastestUsers,
        slowestUsers
    };
}

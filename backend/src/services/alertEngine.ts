import { prisma } from '../config/database';
import axios from 'axios';
import crypto from 'crypto';

// A simple in-memory log to prevent spamming webhooks every second
const recentTriggers = new Map<string, number>();

/**
 * Generates a mock telemetry value for checking.
 * In a production architecture, this would query ClickHouse or Postgres for the real recent value.
 */
const fetchLatestMetricValue = async (metric: string): Promise<number> => {
    // Return some semi-random data to simulate live telemtry
    // For CPU, return between 10 and 95
    if (metric.includes('cpu')) return Math.random() * 85 + 10;
    // For transactions, between 100 and 1000
    if (metric.includes('transaction')) return Math.random() * 900 + 100;
    // For errors, between 0 and 150
    if (metric.includes('error') || metric.includes('action')) return Math.random() * 150;
    
    return Math.random() * 100;
};

const evaluateRule = (operator: string, threshold: number, actualValue: number): boolean => {
    switch (operator) {
        case '>': return actualValue > threshold;
        case '<': return actualValue < threshold;
        case '>=': return actualValue >= threshold;
        case '<=': return actualValue <= threshold;
        case '==': 
        case 'is': return actualValue === threshold;
        case '!=': return actualValue !== threshold;
        default: return false;
    }
};

const fireWebhook = async (targetUrl: string, rule: any, actualValue: number) => {
    const payload = {
        event: 'alert.triggered',
        timestamp: new Date().toISOString(),
        data: {
            ruleId: rule.id,
            ruleName: rule.name,
            metric: rule.metric,
            operator: rule.operator,
            threshold: rule.threshold,
            actualValue: actualValue
        }
    };

    try {
        // We'll generate a dummy signature secret just for demonstration
        const mockSecret = 'whsec_dummy';
        const signature = crypto
            .createHmac('sha256', mockSecret)
            .update(JSON.stringify(payload))
            .digest('hex');

        await axios.post(targetUrl, payload, {
            headers: {
                'Content-Type': 'application/json',
                'X-Nalyse-Signature': `sha256=${signature}`,
                'X-Nalyse-Event': 'alert.triggered'
            },
            timeout: 5000 // 5 second timeout
        });
        console.log(`[AlertEngine] Webhook successfully delivered to ${targetUrl} for rule ${rule.name}`);
    } catch (error: any) {
        console.error(`[AlertEngine] Failed to deliver webhook to ${targetUrl}: ${error.message}`);
        // Optionally update rule state to reflect error
    }
};

const fireEmail = async (targetEmail: string, rule: any, actualValue: number) => {
    console.log(`[AlertEngine] Emulating Email dispatch to ${targetEmail}.`);
    console.log(`  Subject: ALERT: ${rule.name}`);
    console.log(`  Body: Metric ${rule.metric} is currently ${actualValue}, which violates condition '${rule.operator} ${rule.threshold}'.`);
};

export const runAlertEvaluationEngine = async () => {
    console.log(`[AlertEngine] Running evaluation cycle...`);
    try {
        const activeRules = await prisma.alertRule.findMany({
            where: { isActive: true }
        });

        for (const rule of activeRules) {
            const actualValue = await fetchLatestMetricValue(rule.metric);
            const isTriggered = evaluateRule(rule.operator, rule.threshold, actualValue);

            if (isTriggered) {
                // Throttle triggers to once every 60 seconds per rule (cooldown)
                const lastTriggerTime = recentTriggers.get(rule.id) || 0;
                const now = Date.now();
                if (now - lastTriggerTime < 60000) {
                    continue; // Skip, in cooldown
                }

                console.log(`[AlertEngine] 🚨 Rule Triggered: ${rule.name} (Value: ${actualValue.toFixed(2)} ${rule.operator} ${rule.threshold})`);

                // Fire Action
                const actionObj = rule.actions as any;
                if (actionObj && actionObj.type) {
                    if (actionObj.type === 'webhook') {
                        await fireWebhook(actionObj.target, rule, actualValue);
                    } else if (actionObj.type === 'email') {
                        await fireEmail(actionObj.target, rule, actualValue);
                    }
                }

                // Update database state
                await prisma.alertRule.update({
                    where: { id: rule.id },
                    data: { lastTriggeredAt: new Date() }
                });

                recentTriggers.set(rule.id, now);
            }
        }
    } catch (error) {
        console.error('[AlertEngine] Error evaluating rules:', error);
    }
};

// Singleton to ensure we only start the cron once
let engineInterval: NodeJS.Timeout | null = null;

export const startAlertEngine = (intervalMs: number = 30000) => {
    if (engineInterval) {
        console.log('[AlertEngine] Cron is already running.');
        return;
    }
    
    console.log(`[AlertEngine] Starting background evaluation engine (Interval: ${intervalMs}ms)`);
    engineInterval = setInterval(runAlertEvaluationEngine, intervalMs);
};

export const stopAlertEngine = () => {
    if (engineInterval) {
        clearInterval(engineInterval);
        engineInterval = null;
        console.log('[AlertEngine] Stopped.');
    }
};

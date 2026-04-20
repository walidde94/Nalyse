import { Queue, Worker, Job } from 'bullmq';
import Redis from 'ioredis';
import { prisma } from '../../config/database';
import { broadcastUpdate } from '../../index';

// Only create Redis connection if REDIS_URL is explicitly set
let connection: Redis | null = null;

if (process.env.REDIS_URL) {
    connection = new Redis(process.env.REDIS_URL, {
        maxRetriesPerRequest: null,
        enableOfflineQueue: false,
        lazyConnect: true,
        connectTimeout: 5000,
        retryStrategy(times) {
            if (times > 3) return null;
            return Math.min(times * 200, 2000);
        }
    }) as any;
    (connection as Redis).on('error', () => { /* silently ignore in dev */ });
    
    // Non-blocking connection attempt
    (connection as Redis).connect().catch(() => {
        if (process.env.NODE_ENV === 'development') {
            console.warn('[Automation] Running without Redis background worker (local dev).');
        }
    });
}

// Only create Queue and Worker if Redis is available
export let automationQueue: Queue | null = null;
export let automationWorker: Worker | null = null;

if (connection) {
    try {
        automationQueue = new Queue('AutomationQueue', { connection });

        automationWorker = new Worker('AutomationQueue', async (job: Job) => {
            switch (job.name) {
                case 'TestJob':
                    console.log('Running Test Job', job.data);
                    return { status: 'success' };
                case 'ExecuteSchedule':
                    return handleExecuteSchedule(job.data);
                case 'FireWebhook':
                    return handleFireWebhook(job.data);
                case 'EvaluateAlert':
                    return handleEvaluateAlert(job.data);
                default:
                    throw new Error(`Unknown job type: ${job.name}`);
            }
        }, { connection, concurrency: 5 });

        automationWorker.on('completed', (job) => {
            console.log(`${job.id} has completed!`);
        });

        automationWorker.on('failed', (job, err) => {
            console.error(`${job?.id} has failed with ${err.message}`);
        });

        automationWorker.on('error', () => { /* silently ignore */ });
    } catch {
        console.warn('[Automation] Could not initialize queue — Redis unavailable.');
    }
}

// Handlers
async function handleExecuteSchedule(data: any) {
    const { scheduleId } = data;
    const schedule = await (prisma as any).schedule?.findUnique({ where: { id: scheduleId } });

    if (!schedule || !schedule.isActive) {
        console.log(`Schedule ${scheduleId} is inactive or not found.`);
        return;
    }

    console.log(`Executing Schedule ${schedule.name}...`);
    broadcastUpdate('schedule_executed', { id: schedule.id, name: schedule.name, executedAt: new Date() });
}

async function handleFireWebhook(data: any) {
    const { webhookId, payload } = data;
    const webhook = await (prisma as any).webhook?.findUnique({ where: { id: webhookId } });

    if (!webhook || !webhook.isActive) return;

    console.log(`Firing Webhook ${webhook.name} to ${webhook.url}`);
    broadcastUpdate('webhook_fired', { id: webhook.id, name: webhook.name });
}

async function handleEvaluateAlert(data: any) {
    console.log("Evaluating Alert logic...", data);
}

// Global helpers
export async function dispatchWebhook(eventName: string, payload: any, organizationId: string) {
    if (!automationQueue) {
        console.warn('[Automation] Redis unavailable — webhook dispatch skipped.');
        return;
    }

    const allWebhooks = await (prisma as any).webhook?.findMany({
        where: {
            organizationId,
            isActive: true
        }
    }) || [];

    const webhooks = allWebhooks.filter((w: any) => {
        try {
            const events = w.events as string[];
            return events && Array.isArray(events) && events.includes(eventName);
        } catch (e) {
            return false;
        }
    });

    for (const webhook of webhooks) {
        await automationQueue.add('FireWebhook', {
            webhookId: webhook.id,
            payload
        }, { attempts: 3, backoff: { type: 'exponential', delay: 2000 } });
    }
}

import { Queue, Worker, Job } from 'bullmq';
import Redis from 'ioredis';
import { prisma } from '../../config/database';
import { broadcastUpdate } from '../../index';

// Initialize Redis Connection
const connection = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
    maxRetriesPerRequest: null,
}) as any;

export const automationQueue = new Queue('AutomationQueue', { connection });

// Define Worker
export const automationWorker = new Worker('AutomationQueue', async (job: Job) => {
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

// Handlers
async function handleExecuteSchedule(data: any) {
    const { scheduleId } = data;
    const schedule = await prisma.schedule.findUnique({ where: { id: scheduleId } });

    if (!schedule || !schedule.isActive) {
        console.log(`Schedule ${scheduleId} is inactive or not found.`);
        return;
    }

    console.log(`Executing Schedule ${schedule.name}...`);
    // TODO: Perform analysis or long-running agent task based on schedule.config
    broadcastUpdate('schedule_executed', { id: schedule.id, name: schedule.name, executedAt: new Date() });
}

async function handleFireWebhook(data: any) {
    const { webhookId, payload } = data;
    const webhook = await prisma.webhook.findUnique({ where: { id: webhookId } });

    if (!webhook || !webhook.isActive) return;

    console.log(`Firing Webhook ${webhook.name} to ${webhook.url}`);

    // Fake sending the webhook here using fetch/axios
    // In production, we would use axios.post(webhook.url, payload, { headers: { 'Authorization': webhook.secret } })
    broadcastUpdate('webhook_fired', { id: webhook.id, name: webhook.name });
}

async function handleEvaluateAlert(data: any) {
    // Logic to evaluate a metric against the AlertRule threshold
    console.log("Evaluating Alert logic...", data);
}

// Global helpers
export async function dispatchWebhook(eventName: string, payload: any, organizationId: string) {
    // Fetch all active webhooks for the org
    const allWebhooks = await prisma.webhook.findMany({
        where: {
            organizationId,
            isActive: true
        }
    });

    // Filter in JS since events is stored as Json and Prisma's Json filtering is dialect-specific
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

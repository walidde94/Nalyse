import { Queue, Worker, Job } from 'bullmq';
import Redis from 'ioredis';

// Redis connection setup for BullMQ
const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

let connection: Redis | null = null;
let redisAvailable = false;

// Only attempt connection if REDIS_URL is explicitly set (i.e. Redis is expected to be available)
if (process.env.REDIS_URL) {
    connection = new Redis(redisUrl, {
        maxRetriesPerRequest: null,
        enableOfflineQueue: false,
        retryStrategy(times) {
            if (times > 3) return null;
            return Math.min(times * 200, 2000);
        }
    });
    connection.on('error', () => { /* silently ignore */ });
    connection.on('ready', () => { redisAvailable = true; });
}

export interface IJobData {
    type: 'ANALYSIS' | 'EXPORT' | 'AI_FORECAST' | 'DATA_PIPELINE' | 'WEBHOOK_DELIVERY';
    payload: any;
    userId: string;
    jobId: string;
}

export interface IQueueService {
    addJob(data: IJobData): Promise<void>;
    processJobs(handler: (job: IJobData) => Promise<void>): void;
}

export class RedisQueueService implements IQueueService {
    private queue: Queue | null = null;
    private worker: Worker | null = null;
    private handlers: ((job: IJobData) => Promise<void>)[] = [];

    private ensureQueue(): Queue | null {
        if (this.queue) return this.queue;
        if (!connection) return null;
        try {
            this.queue = new Queue('nalyse-tasks', {
                connection,
                defaultJobOptions: {
                    attempts: 3,
                    backoff: { type: 'exponential', delay: 2000 },
                    removeOnComplete: true,
                    removeOnFail: false
                }
            });
            return this.queue;
        } catch {
            return null;
        }
    }

    async addJob(data: IJobData): Promise<void> {
        const q = this.ensureQueue();
        if (!q) {
            console.warn(`[Queue] Redis unavailable — job ${data.jobId} skipped.`);
            return;
        }
        const priority = data.type === 'DATA_PIPELINE' ? 1 : 10;
        await q.add(data.type, data, { jobId: data.jobId, priority });
        console.log(`[Queue] Added job ${data.jobId} of type ${data.type}`);
    }

    processJobs(handler: (job: IJobData) => Promise<void>): void {
        this.handlers.push(handler);

        if (!this.worker && connection) {
            const q = this.ensureQueue();
            if (!q) return;

            try {
                this.worker = new Worker(q.name, async (job: Job) => {
                    const jobData = job.data as IJobData;
                    console.log(`[Queue] Processing job ${jobData.jobId}...`);
                    try {
                        for (const registeredHandler of this.handlers) {
                            await registeredHandler(jobData);
                        }
                    } catch (err: any) {
                        console.error(`[Queue] Job ${jobData.jobId} failed:`, err.message);
                        throw err;
                    }
                }, {
                    connection,
                    concurrency: parseInt(process.env.QUEUE_CONCURRENCY || '5', 10)
                });

                this.worker.on('completed', (job: Job) => {
                    console.log(`[Queue] Job ${job.id} completed successfully`);
                });
                this.worker.on('failed', (job: Job | undefined, err: Error) => {
                    console.error(`[Queue] Job ${job?.id} completely failed:`, err.message);
                });
                this.worker.on('error', () => { /* silently ignore worker-level Redis errors */ });
            } catch {
                console.warn('[Queue] Could not start worker — Redis unavailable.');
            }
        }
    }

    async getQueueMetrics() {
        const q = this.ensureQueue();
        if (!q) return { waiting: 0, active: 0, completed: 0, failed: 0 };
        const [waiting, active, completed, failed] = await Promise.all([
            q.getWaitingCount(),
            q.getActiveCount(),
            q.getCompletedCount(),
            q.getFailedCount()
        ]);
        return { waiting, active, completed, failed };
    }
}

// Global Singleton
export const queueService = new RedisQueueService();


export interface IJobData {
    type: 'ANALYSIS' | 'EXPORT' | 'AI_FORECAST';
    payload: any;
    userId: string;
    jobId: string;
}

export interface IQueueService {
    addJob(data: IJobData): Promise<void>;
    processJobs(handler: (job: IJobData) => Promise<void>): void;
}

export class InMemoryQueueService implements IQueueService {
    private queue: IJobData[] = [];
    private isProcessing = false;
    private handlers: ((job: IJobData) => Promise<void>)[] = [];

    async addJob(data: IJobData): Promise<void> {
        console.log(`[Queue] Adding job ${data.jobId} of type ${data.type}`);
        this.queue.push(data);
        this.processNext();
    }

    processJobs(handler: (job: IJobData) => Promise<void>): void {
        this.handlers.push(handler);
    }

    private async processNext() {
        if (this.isProcessing || this.queue.length === 0) return;

        this.isProcessing = true;
        const job = this.queue.shift();

        if (job && this.handlers.length > 0) {
            try {
                // Execute all handlers (in reality, likely routed by job type)
                // For simplicity, just run the first registered handler roughly matching logic
                for (const handler of this.handlers) {
                    await handler(job);
                }
                console.log(`[Queue] Job ${job.jobId} completed`);
            } catch (err) {
                console.error(`[Queue] Job ${job.jobId} failed`, err);
                // Simple retry logic?
            }
        }

        this.isProcessing = false;
        // Check for more
        if (this.queue.length > 0) this.processNext();
    }
}

// Singleton for now
export const queueService = new InMemoryQueueService();

import { IJobData, queueService } from '../queue';
import { analyzeFile } from '../analyzer';
import { AppDataSource } from '../../config/database';
import { File } from '../../entities/File';
import { Analysis } from '../../entities/Analysis';

// This function starts the worker listener
export const initAnalysisWorker = () => {
    console.log('[Worker] Analysis worker initialized');

    queueService.processJobs(async (job: IJobData) => {
        if (job.type !== 'ANALYSIS') return;

        console.log(`[Worker] Processing Analysis job for file: ${job.payload.fileId}`);
        const { fileId, userId } = job.payload;

        const fileRepo = AppDataSource.getRepository(File);
        const analysisRepo = AppDataSource.getRepository(Analysis);

        try {
            const file = await fileRepo.findOne({ where: { id: fileId } });
            if (!file) {
                console.error(`[Worker] File ${fileId} not found`);
                return;
            }

            // Perform Analysis (Heavy CPU Task)
            const startTime = Date.now();
            const analysisResult = await analyzeFile(file.s3Key || file.filename, file.mimeType);
            const duration = Date.now() - startTime;

            // Save Result to DB
            const analysis = analysisRepo.create({
                fileId: file.id,
                createdById: userId,
                status: 'completed',
                results: analysisResult.options,
                insights: analysisResult.aiInsights,
                statistics: {
                    summary: analysisResult.summary,
                    health: analysisResult.dataHealth,
                    findings: analysisResult.keyFindings
                },
                processingTimeMs: duration,
                completedAt: new Date()
            });

            await analysisRepo.save(analysis);
            console.log(`[Worker] Analysis saved for file ${fileId} in ${duration}ms`);

        } catch (error: any) {
            console.error(`[Worker] Analysis failed for file ${fileId}`, error);
        }
    });
};

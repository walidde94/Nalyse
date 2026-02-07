import { Response } from 'express';
import { ApiRequest } from '../../middleware/apiKeyAuth';
import { AppDataSource } from '../../config/database';
import { File } from '../../entities/File';
import { Organization } from '../../entities/Organization';
import { analyzeFile } from '../../services/analyzer';

const API_URL = process.env.API_URL || 'http://localhost:3000';

const isUUID = (str: string) => {
    const regex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    return regex.test(str);
};

export const apiUploadDataset = async (req: ApiRequest, res: Response) => {
    if (!req.file) return res.status(400).json({ error: 'No file provided', message: 'Please upload a CSV or JSON file in the format of multipart/form-data with the key "file".' });

    const userId = req.user?.userId;
    const orgId = req.apiKey?.owner?.organizationId || '';

    if (!orgId) return res.status(403).json({ error: 'Access Denied', message: 'This API key is not associated with an organization.' });

    try {
        const result = await AppDataSource.transaction(async (transactionalEntityManager) => {
            const isTest = process.env.NODE_ENV === 'test';
            // 1. Fetch Organization - Conditional locking for SQLite compatibility
            const org = await transactionalEntityManager.findOne(Organization, {
                where: { id: orgId },
                ...(isTest ? {} : { lock: { mode: 'pessimistic_write' } })
            });

            if (!org) throw new Error('Organization not found');

            // 2. Enforcement (B-17)
            const fileSize = req.file!.size;
            const currentUsage = Number(org.storageUsed);
            const limit = Number(org.storageLimit);

            if (currentUsage + fileSize > limit) {
                const limitErr = new Error(`Storage quota exceeded. Your plan limit is ${(limit / 1024).toFixed(0)}KB.`);
                (limitErr as any).statusCode = 403;
                throw limitErr;
            }

            // 3. Create File Entry
            const newFile = transactionalEntityManager.create(File, {
                filename: req.file!.filename,
                originalName: req.file!.originalname,
                mimeType: req.file!.mimetype,
                size: fileSize,
                s3Key: req.file!.path,
                ownerId: userId!,
                organizationId: orgId,
                isFavorite: false
            });

            const savedFile = await transactionalEntityManager.save(File, newFile);

            // 4. Update Real-time usage tracking (B-18)
            org.storageUsed = currentUsage + fileSize;
            await transactionalEntityManager.save(Organization, org);

            return savedFile;
        });

        res.status(201).json({
            id: result.id,
            filename: result.filename,
            size: result.size,
            mimeType: result.mimeType,
            createdAt: result.createdAt
        });
    } catch (error: any) {
        console.error('[UPLOAD_ERROR]', error);
        if (error.statusCode === 403) {
            return res.status(403).json({ error: 'Quota Exceeded', message: error.message });
        }
        res.status(500).json({ error: 'Internal server error during upload', message: error.message });
    }
};

export const apiGetDataset = async (req: ApiRequest, res: Response) => {
    const fileRepo = AppDataSource.getRepository(File);
    try {
        const identifier = req.params.id as string;
        let file;

        if (isUUID(identifier)) {
            file = await fileRepo.findOne({ where: { id: identifier, ownerId: req.user?.userId } });
        }

        if (!file) {
            // Try by exact filename
            file = await fileRepo.findOne({ where: { filename: identifier, ownerId: req.user?.userId } });
        }

        if (!file) {
            // Try by filename without extension
            file = await fileRepo.findOne({
                where: [
                    { filename: identifier + '.csv', ownerId: req.user?.userId, isDeleted: false },
                    { filename: identifier + '.json', ownerId: req.user?.userId, isDeleted: false }
                ]
            });
        }

        if (!file) return res.status(404).json({ error: 'Not Found', message: 'Dataset not found or access denied.' });

        res.json({
            id: file.id,
            filename: file.filename,
            size: file.size,
            mimeType: file.mimeType,
            createdAt: file.createdAt
        });
    } catch (error: any) {
        res.status(500).json({ error: 'Fetch failed', message: error.message });
    }
};

export const apiRunAnalysis = async (req: ApiRequest, res: Response) => {
    const { datasetId } = req.body;
    if (!datasetId) return res.status(400).json({ error: 'Bad Request', message: 'datasetId is required in the request body.' });

    const fileRepo = AppDataSource.getRepository(File);
    try {
        const identifier = datasetId as string;
        let file;

        if (isUUID(identifier)) {
            file = await fileRepo.findOne({ where: { id: identifier, ownerId: req.user?.userId } });
        }

        if (!file) {
            // Try by exact filename
            file = await fileRepo.findOne({ where: { filename: identifier, ownerId: req.user?.userId } });
        }

        if (!file) {
            // Try by filename without extension if the user omitted it
            file = await fileRepo.findOne({
                where: [
                    { filename: identifier + '.csv', ownerId: req.user?.userId, isDeleted: false },
                    { filename: identifier + '.json', ownerId: req.user?.userId, isDeleted: false }
                ]
            });
        }

        if (!file) return res.status(404).json({ error: 'Not Found', message: 'Dataset not found. Please provide a valid UUID or storage filename.' });

        const result = await analyzeFile(file.s3Key || file.filename, file.mimeType);
        res.json({
            datasetId: file.id,
            summary: result.summary,
            insights: result.aiInsights,
            keyFindings: result.keyFindings,
            health: result.dataHealth,
            limitations: result.dataLimitations
        });
    } catch (error: any) {
        res.status(500).json({ error: 'Analysis failed', message: error.message });
    }
};

export const apiCleanDataset = async (req: ApiRequest, res: Response) => {
    res.json({
        message: 'Dataset cleaning job accepted',
        jobId: 'job_' + Date.now(),
        status: 'completed',
        details: 'Simulated cleaning: null rows removed, headers normalized.'
    });
};

export const apiGenerateCharts = async (req: ApiRequest, res: Response) => {
    const { datasetId, type } = req.body;
    if (!datasetId || !type) return res.status(400).json({ error: 'Bad Request', message: 'datasetId and type are required.' });

    res.json({
        type: type,
        status: 'success',
        metadata: {
            colors: ['#6366f1', '#a855f7', '#ec4899'],
            data: [
                { label: 'Segment A', value: 450 },
                { label: 'Segment B', value: 280 },
                { label: 'Segment C', value: 590 }
            ],
            options: { responsive: true }
        }
    });
};

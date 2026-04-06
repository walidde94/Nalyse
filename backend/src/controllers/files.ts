import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { AppDataSource } from '../config/database';
import { File } from '../entities/File';
import { Group } from '../entities/Group';
import { Organization } from '../entities/Organization';
import { User } from '../entities/User';
import { analyzeFile, analyzeRawData } from '../services/analyzer';
import { queueService } from '../services/queue';
import { scrapeUrl } from '../services/scraper';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { parse } from 'csv-parse/sync';

export const uploadFile = async (req: AuthRequest, res: Response) => {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
    const userId = req.user?.userId;

    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const fileRepo = AppDataSource.getRepository(File);
    const userRepo = AppDataSource.getRepository(User);

    try {
        // Ensure user has organization (fetch if needed logic could be here, but let's assume token has it or fetch user)
        let organizationId = req.user?.organizationId;

        if (!organizationId) {
            const user = await userRepo.findOne({ where: { id: userId }, relations: ['organization'] });
            if (!user || !user.organization) {
                return res.status(400).json({ error: 'User does not belong to an organization' });
            }
            organizationId = user.organization.id;
        }

        // If it's an avatar upload, don't save to File table (Datasets)
        if (req.query.type === 'avatar') {
            return res.json({
                message: 'Avatar uploaded',
                file: {
                    filename: req.file.filename,
                    originalName: req.file.originalname,
                    size: req.file.size
                }
            });
        }

        const fileSize = req.file.size;

        // Calculate checksum for duplicate detection
        const fileContent = fs.readFileSync(req.file.path);
        const checksum = crypto.createHash('md5').update(fileContent).digest('hex');

        const result = await AppDataSource.transaction(async (transactionalEntityManager) => {
            const org = await transactionalEntityManager.findOne(Organization, {
                where: { id: organizationId },
                lock: process.env.NODE_ENV === 'test' ? undefined : { mode: 'pessimistic_write' }
            });

            if (!org) throw new Error('Organization not found');

            // Comprehensive Duplicate Check (Name or Content)
            const duplicate = await transactionalEntityManager.findOne(File, {
                where: [
                    { organizationId: org.id, originalName: req.file!.originalname, isDeleted: false },
                    { organizationId: org.id, checksum: checksum, isDeleted: false }
                ]
            });

            if (duplicate) {
                const message = duplicate.originalName === req.file!.originalname
                    ? `A file named "${duplicate.originalName}" already exists in this workspace.`
                    : `This file's content has already been uploaded as "${duplicate.originalName}".`;
                const err = new Error(message);
                (err as any).statusCode = 409;
                throw err;
            }

            let effectiveStorageLimit = Number(org.storageLimit);
            if (org.plan === 'enterprise') {
                effectiveStorageLimit = 1099511627776; // 1TB
            } else if (org.plan === 'pro') {
                effectiveStorageLimit = 10737418240; // 10GB
            } else {
                effectiveStorageLimit = 104857600; // 100MB
            }

            if (Number(org.storageUsed) + fileSize > effectiveStorageLimit) {
                const err = new Error('Storage quota exceeded');
                (err as any).statusCode = 403;
                throw err;
            }

            // Dataset (File) limit check
            const fileCount = await transactionalEntityManager.count(File, {
                where: { organizationId: org.id, isDeleted: false }
            });

            let effectiveLimit = org.fileLimit;
            if (org.plan === 'enterprise') {
                effectiveLimit = 10000;
            } else if (org.plan === 'pro') {
                effectiveLimit = 1000;
            } else {
                effectiveLimit = 5;
            }

            if (fileCount >= effectiveLimit) {
                const err = new Error(`Dataset limit exceeded. Your plan allows up to ${effectiveLimit} datasets.`);
                (err as any).statusCode = 403;
                throw err;
            }

            const newFile = transactionalEntityManager.create(File, {
                filename: req.file!.filename,
                originalName: req.file!.originalname,
                mimeType: req.file!.mimetype,
                size: fileSize,
                s3Key: req.file!.path,
                checksum: checksum,
                ownerId: userId,
                organizationId: organizationId,
                isFavorite: false
            });

            const savedFile = await transactionalEntityManager.save(File, newFile);

            org.storageUsed = Number(org.storageUsed) + fileSize;
            await transactionalEntityManager.save(Organization, org);

            return savedFile;
        });

        // Broadcast new file
        try {
            const { broadcastUpdate } = require('../index');
            broadcastUpdate('file', { action: 'upload', fileId: result.id, userId: userId });
        } catch (e) { }

        res.json({ message: 'File uploaded', file: result });

    } catch (error: any) {
        console.error('File Upload Error:', error);
        const statusCode = error.statusCode || 500;
        res.status(statusCode).json({ error: error.message });
    }
};

export const getFiles = async (req: AuthRequest, res: Response) => {
    const userId = req.user?.userId;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const fileRepo = AppDataSource.getRepository(File);

    try {
        const files = await fileRepo.find({
            where: { ownerId: userId, isDeleted: false },
            order: { createdAt: 'DESC' },
        });

        // Back-fill: if file has no isProcessed but has a completed analysis, fix it
        const { Analysis } = require('../entities/Analysis');
        const analysisRepo = AppDataSource.getRepository(Analysis);
        
        const enriched = [];
        for (const f of files) {
            if (!f.isProcessed) {
                // Quick check if there's a completed analysis we missed persisting
                const cached = await analysisRepo.findOne({
                    where: { fileId: f.id, status: 'completed' },
                    select: ['id', 'completedAt']
                });
                if (cached) {
                    f.isProcessed = true;
                    f.processedAt = cached.completedAt;
                    await fileRepo.save(f);
                }
            }
            enriched.push({
                ...f,
                analyses: undefined
            });
        }

        res.json(enriched);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Database error' });
    }
};

export const analyzeFileHandler = async (req: AuthRequest, res: Response) => {
    const userId = req.user?.userId || 'da625177-9464-4c0a-9abb-5feec66ae0c9';
    const fileId = req.params.id;
    const forceReprocess = req.query.force === 'true';

    const fileRepo = AppDataSource.getRepository(File);
    const { Analysis } = require('../entities/Analysis');
    const analysisRepo = AppDataSource.getRepository(Analysis);

    try {
        console.log(`[Debug] Looking for fileId: "${fileId}"`);
        const file = await fileRepo.findOne({ where: { id: fileId as string, isDeleted: false } });
        console.log(`[Debug] Result:`, file ? `Found ${file.id}` : 'Not found');
        if (!file) return res.status(404).json({ error: 'File not found' });

        // ─── Check for cached analysis (serve even if physical file is gone) ───
        if (!forceReprocess) {
            const cached = await analysisRepo.findOne({
                where: { fileId: file.id, status: 'completed' },
                order: { createdAt: 'DESC' }
            });

            if (cached && cached.results) {
                // If it's a simple query (no NLQ), return immediately
                const query = req.query.q as string;
                if (!query) {
                    console.log(`[Analysis] [CACHE HIT] Returning full results for file ${file.id}`);
                    return res.json({
                        id: file.id,
                        cached: true,
                        cachedAt: cached.completedAt,
                        type: cached.results.type || 'Enterprise Strategic Intelligence',
                        aiInsights: cached.insights || [],
                        summary: cached.results.summary || cached.statistics?.summary || {},
                        dataHealth: cached.results.dataHealth || cached.statistics?.health || {},
                        keyFindings: cached.results.keyFindings || cached.statistics?.findings || [],
                        options: cached.results.options || [],
                        sampleData: cached.results.sampleData || [],
                        executiveReasoning: cached.results.executiveReasoning || null,
                        metrics: cached.results.metrics || [],
                        processingLog: cached.results.processingLog || ['Pipeline state recovered from neural cache.'],
                        processingTimeMs: cached.processingTimeMs || 0
                    });
                }
            }
        }

        // ─── Check if physical file exists before attempting fresh analysis ───
        const filePath = file.s3Key || file.filename;
        const absoluteUploadsDir = process.env.UPLOAD_DIR || path.resolve(process.cwd(), 'uploads');
        let absoluteFilePath = filePath;
        if (!filePath.includes('/') && !filePath.includes('\\')) {
            absoluteFilePath = path.join(absoluteUploadsDir, filePath);
        } else {
            absoluteFilePath = path.resolve(process.cwd(), filePath);
        }

        if (!fs.existsSync(absoluteFilePath)) {
            console.error(`[Analysis] Physical file missing for ${file.id}: ${absoluteFilePath}`);
            return res.status(422).json({
                error: 'FILE_NOT_FOUND',
                message: `The dataset "${file.originalName || file.filename}" needs to be re-uploaded. The physical file is no longer available on the server (this happens on cloud platforms with ephemeral storage). Please go to the Dashboard and upload the file again.`,
                fileId: file.id,
                fileName: file.originalName || file.filename
            });
        }

        // ─── Run fresh analysis ──────────────────────────────────────
        console.log(`[Analysis] Starting ${forceReprocess ? 'forced ' : ''}analysis for file ${file.id} (${file.originalName})`);
        const startTime = Date.now();
        const analysisResult = await analyzeFile(file.s3Key || file.filename, file.mimeType);
        const duration = Date.now() - startTime;
        console.log(`[Analysis] Completed in ${duration}ms for file ${file.id}`);

        if (analysisResult.type === 'Error') {
            console.error(`[Analysis] Engine failed to process ${file.id}:`, analysisResult.dataLimitations);
            return res.status(422).json({
                error: 'ANALYSIS_FAILED',
                message: analysisResult.dataLimitations?.[0] || 'The analysis engine could not process this dataset. It may be empty or corrupted.'
            });
        }

        // ─── Only persist if analysis actually has data ──────────────
        const hasData = (analysisResult.sampleData && analysisResult.sampleData.length > 0) ||
                        (analysisResult.options && analysisResult.options.length > 0);

        if (hasData) {
            try {
                await analysisRepo.delete({ fileId: file.id });

                const analysis = analysisRepo.create({
                    fileId: file.id,
                    createdById: userId,
                    status: 'completed',
                    results: {
                        options: analysisResult.options,
                        sampleData: analysisResult.sampleData,
                        executiveReasoning: analysisResult.executiveReasoning,
                        summary: analysisResult.summary,
                        dataHealth: analysisResult.dataHealth,
                        keyFindings: analysisResult.keyFindings,
                        processingLog: analysisResult.processingLog
                    },
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
                console.log(`[Analysis] Persisted to DB for file ${file.id}`);

                // Mark file as processed directly on the File record
                file.isProcessed = true;
                file.processedAt = new Date();
                await fileRepo.save(file);
                console.log(`[Analysis] Marked file ${file.id} as processed`);

                // Broadcast analysis completion to connected clients
                try {
                    const { broadcastUpdate } = require('../index');
                    broadcastUpdate('file', { action: 'analysis_complete', fileId: file.id, userId: userId, analysis: analysisResult });
                } catch (e) { }
            } catch (dbErr) {
                console.error('[Analysis] Failed to persist analysis result:', dbErr);
            }
        } else {
            console.warn(`[Analysis] Skipped caching empty/error result for file ${file.id}`);
        }

        // Return full analysis result to frontend
        res.json({
            id: file.id,
            ...analysisResult
        });

    } catch (error: any) {
        require('fs').appendFileSync('error_debug.log', `[Analyze Error]: ${error?.stack || error}\n`);
        console.error('Failed to process analysis request:', error);

        // Return clear error for FILE_NOT_FOUND
        if (error.code === 'FILE_NOT_FOUND' || error.message?.includes('FILE_NOT_FOUND')) {
            return res.status(422).json({
                error: 'FILE_NOT_FOUND',
                message: error.message.replace('FILE_NOT_FOUND: ', ''),
            });
        }

        res.status(500).json({ error: error?.message || 'Failed to process analysis job' });
    }
};

export const scrapeUrlHandler = async (req: AuthRequest, res: Response) => {
    const { url } = req.body;
    const userId = req.user?.userId;

    if (!userId) return res.status(401).json({ error: 'Unauthorized' });
    if (!url) return res.status(400).json({ error: 'URL is required' });

    try {
        const scrapeResult = await scrapeUrl(url);

        if (!scrapeResult.data || scrapeResult.data.length === 0) {
            return res.status(400).json({ error: 'No structured data found on this page.' });
        }

        const analysis = analyzeRawData(scrapeResult.data, 'Scraped URL');

        res.json({
            ...analysis,
            scrapeMetadata: {
                title: scrapeResult.title,
                method: scrapeResult.method,
                originalUrl: url
            }
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Scraping failed. Ensure URL is valid.' });
    }
};

export const deleteFileHandler = async (req: AuthRequest, res: Response) => {
    const userId = req.user?.userId;
    const fileId = req.params.id;

    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const fileRepo = AppDataSource.getRepository(File);

    try {
        const fileId = req.params.id as string;
        const file = await fileRepo.findOne({ where: { id: fileId, isDeleted: false } });
        if (!file || file.ownerId !== userId) return res.status(404).json({ error: 'File not found' });

        const fileSize = Number(file.size);
        const orgId = file.organizationId;

        await AppDataSource.transaction(async (transactionalEntityManager) => {
            file.isDeleted = true;
            await transactionalEntityManager.save(File, file);

            const org = await transactionalEntityManager.findOne(Organization, {
                where: { id: orgId },
                lock: process.env.NODE_ENV === 'test' ? undefined : { mode: 'pessimistic_write' }
            });

            if (org) {
                org.storageUsed = Math.max(0, Number(org.storageUsed) - fileSize);
                await transactionalEntityManager.save(Organization, org);
            }
        });

        if (file.s3Key && fs.existsSync(file.s3Key)) {
            try { fs.unlinkSync(file.s3Key); } catch (e) { }
        }

        res.json({ message: 'File deleted successfully' });
    } catch (error: any) {
        res.status(500).json({ error: 'Deletion failed: ' + error.message });
    }
};

export const toggleFavoriteHandler = async (req: AuthRequest, res: Response) => {
    const userId = req.user?.userId;
    const fileId = req.params.id;

    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const fileRepo = AppDataSource.getRepository(File);

    try {
        const fileId = req.params.id as string;
        const file = await fileRepo.findOne({ where: { id: fileId, isDeleted: false } });
        if (!file || file.ownerId !== userId) return res.status(404).json({ error: 'File not found' });

        file.isFavorite = !file.isFavorite;
        await fileRepo.save(file);

        res.json(file);
    } catch (error) {
        res.status(500).json({ error: 'Update failed' });
    }
};

export const transformFileHandler = async (req: AuthRequest, res: Response) => {
    const userId = req.user?.userId;
    const { id } = req.params;
    const { mapping, exclude, newName } = req.body; // mapping: { old: new }, exclude: [col], newName: string

    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const fileRepo = AppDataSource.getRepository(File);

    try {
        const fileId = id as string; // use id from params as string
        const originalFile = await fileRepo.findOne({ where: { id: fileId, isDeleted: false } });
        if (!originalFile || originalFile.ownerId !== userId) return res.status(404).json({ error: 'File not found' });

        if (!originalFile.s3Key || !fs.existsSync(originalFile.s3Key)) {
            return res.status(400).json({ error: 'File content not found on server' });
        }

        const rawContent = fs.readFileSync(originalFile.s3Key);
        let records: any[] = [];

        if (originalFile.mimeType.includes('json') || originalFile.filename.endsWith('.json')) {
            records = JSON.parse(rawContent.toString());
        } else if (originalFile.mimeType.includes('csv') || originalFile.filename.endsWith('.csv')) {
            records = parse(rawContent, { columns: true, skip_empty_lines: true, relax_column_count: true });
        } else {
            return res.status(400).json({ error: 'Unsupported file type for transformation' });
        }

        if (records.length === 0) return res.status(400).json({ error: 'Empty file' });

        // Apply Transformation
        const transformedRecords = records.map((record: any) => {
            const newRecord: any = {};
            Object.keys(record).forEach(key => {
                if (exclude && exclude.includes(key)) return;
                const newKey = (mapping && mapping[key]) ? mapping[key] : key;
                newRecord[newKey] = record[key];
            });
            return newRecord;
        });

        // Generate Output
        let newContent = '';
        const isOriginalCsv = originalFile.mimeType.includes('csv') || originalFile.filename.endsWith('.csv');
        const mimeType = isOriginalCsv ? 'text/csv' : 'application/json';
        const extension = isOriginalCsv ? '.csv' : '.json';

        if (mimeType === 'application/json') {
            newContent = JSON.stringify(transformedRecords, null, 2);
        } else {
            const headers = Object.keys(transformedRecords[0] || {});
            const csvRows: string[] = [headers.join(',')];

            for (const record of transformedRecords) {
                const row = headers.map(h => {
                    const val = record[h] === null || record[h] === undefined ? '' : String(record[h]);
                    return val.includes(',') || val.includes('"') || val.includes('\n') ?
                        `"${val.replace(/"/g, '""')}"` : val;
                }).join(',');
                csvRows.push(row);
            }
            newContent = csvRows.join('\n');
        }

        let baseName = newName || ('Migrated_' + originalFile.filename.replace(/\.[^/.]+$/, ""));
        // Remove extension if present in baseName to avoid double extension
        if (baseName.endsWith(extension)) {
            baseName = baseName.substring(0, baseName.length - extension.length);
        }
        const newFilename = baseName + extension;
        const newPath = path.join(process.env.UPLOAD_DIR || path.join(process.cwd(), 'uploads'), newFilename.replace(/[^a-z0-9.]/gi, '_') + '_' + Date.now());

        fs.writeFileSync(newPath, newContent);

        const newFileEntry = fileRepo.create({
            filename: newFilename,
            originalName: newFilename,
            mimeType: mimeType,
            size: Buffer.byteLength(newContent),
            s3Key: newPath,
            ownerId: userId,
            organizationId: originalFile.organizationId,
            isFavorite: false
        });

        const savedFile = await fileRepo.save(newFileEntry);
        res.json(savedFile);

    } catch (e: any) {
        console.error('Transformation failed error:', e);
        res.status(500).json({ error: e.message || 'Transformation failed' });
    }
};

export const updateFileGroupHandler = async (req: AuthRequest, res: Response) => {
    const userId = req.user?.userId;
    const { id } = req.params;
    const { groupId } = req.body;

    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const fileRepo = AppDataSource.getRepository(File);
    const groupRepo = AppDataSource.getRepository(Group);

    try {
        const file = await fileRepo.findOne({ where: { id: id as string } });
        if (!file || file.ownerId !== userId) return res.status(404).json({ error: 'File not found' });

        if (groupId) {
            const group = await groupRepo.findOne({ where: { id: groupId as string } });
            if (!group || group.ownerId !== userId) {
                return res.status(403).json({ error: 'Access Denied', message: 'You do not have permission to use this group.' });
            }
        }

        file.groupId = groupId || null;
        await fileRepo.save(file);

        res.json(file);
    } catch (error: any) {
        res.status(500).json({ error: 'Failed to update group: ' + error.message });
    }
};

export const previewFileHandler = async (req: AuthRequest, res: Response) => {
    const userId = req.user?.userId;
    const fileId = req.params.id;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const fileRepo = AppDataSource.getRepository(File);

    try {
        const file = await fileRepo.findOne({ where: { id: fileId as string, isDeleted: false } });
        if (!file || file.ownerId !== userId) return res.status(404).json({ error: 'File not found' });

        const path = file.s3Key || file.filename;
        if (!fs.existsSync(path)) return res.status(404).json({ error: 'File content not found' });

        const rawContent = fs.readFileSync(path);
        let previewData: any[] = [];

        if (file.mimeType.includes('json') || file.filename.endsWith('.json')) {
            const allData = JSON.parse(rawContent.toString());
            previewData = Array.isArray(allData) ? allData.slice(0, 15) : [allData];
        } else if (file.mimeType.includes('csv') || file.filename.endsWith('.csv')) {
            const records = parse(rawContent, {
                columns: true,
                skip_empty_lines: true,
                relax_column_count: true,
                trim: true
            });
            previewData = records.slice(0, 15);
        }

        // Infer column types
        const columns = previewData.length > 0 ? Object.keys(previewData[0]).map(key => {
            const sampleValue = previewData.find(r => r[key] !== null && r[key] !== '')?.[key];
            let type = 'string';

            if (sampleValue !== undefined && sampleValue !== null) {
                const valStr = String(sampleValue).trim();
                if (!isNaN(Number(valStr)) && valStr !== '') {
                    type = 'numeric';
                } else if (!isNaN(Date.parse(valStr)) && valStr.length > 5) {
                    type = 'date';
                }
            }

            return { name: key, type };
        }) : [];

        res.json({
            rows: previewData,
            columns,
            metadata: {
                rowCount: previewData.length,
                totalSize: file.size,
                format: file.filename.split('.').pop()?.toUpperCase()
            }
        });
    } catch (error: any) {
        console.error('Preview failed:', error);
        res.status(500).json({ error: 'Failed to generate preview' });
    }
};

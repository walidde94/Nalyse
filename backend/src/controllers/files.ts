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
import { executeWorkspaceAction } from '../services/workspaceService';
import { prisma } from '../config/database';

// ─── Upload ─────────────────────────────────────────────────────────────────

export const uploadFile = async (req: AuthRequest, res: Response) => {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
    const userId = req.user?.userId;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const fileRepo = AppDataSource.getRepository(File);
    const userRepo = AppDataSource.getRepository(User);

    try {
        let organizationId = req.user?.organizationId;
        if (!organizationId) {
            const user = await userRepo.findOne({ where: { id: userId }, relations: ['organization'] });
            if (!user || !user.organization) {
                return res.status(400).json({ error: 'User does not belong to an organization' });
            }
            organizationId = user.organization.id;
        }

        // Avatar upload — don't save to File table
        if (req.query.type === 'avatar') {
            return res.json({
                message: 'Avatar uploaded',
                file: { filename: req.file.filename, originalName: req.file.originalname, size: req.file.size }
            });
        }

        const fileSize = req.file.size;
        const fileContent = fs.readFileSync(req.file.path);
        const checksum = crypto.createHash('md5').update(fileContent).digest('hex');

        const result = await AppDataSource.transaction(async (tx) => {
            const org = await tx.findOne(Organization, {
                where: { id: organizationId },
                lock: process.env.NODE_ENV === 'test' ? undefined : { mode: 'pessimistic_write' }
            });
            if (!org) throw new Error('Organization not found');

            // Duplicate check (name OR content)
            const duplicate = await tx.findOne(File, {
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

            // Storage limit
            const limits: Record<string, number> = { enterprise: 1099511627776, pro: 10737418240 };
            const storageLimit = limits[org.plan] || 104857600;
            if (Number(org.storageUsed) + fileSize > storageLimit) {
                const err = new Error('Storage quota exceeded');
                (err as any).statusCode = 403;
                throw err;
            }

            // File count limit
            const fileCount = await tx.count(File, { where: { organizationId: org.id, isDeleted: false } });
            const fileLimits: Record<string, number> = { enterprise: 10000, pro: 1000 };
            const fileLimit = fileLimits[org.plan] || 5;
            if (fileCount >= fileLimit) {
                const err = new Error(`Dataset limit exceeded. Your plan allows up to ${fileLimit} datasets.`);
                (err as any).statusCode = 403;
                throw err;
            }

            const newFile = tx.create(File, {
                filename: req.file!.filename,
                originalName: req.file!.originalname,
                mimeType: req.file!.mimetype,
                size: fileSize,
                s3Key: req.file!.path,
                checksum,
                ownerId: userId,
                organizationId,
                isFavorite: false,
                isProcessed: false
            });

            const saved = await tx.save(File, newFile);
            org.storageUsed = Number(org.storageUsed) + fileSize;
            await tx.save(Organization, org);
            return saved;
        });

        // Resolve Workspace & Broadcast
        try {
            const workspaceIdHeader = req.headers['x-workspace-id'] as string;
            let targetWorkspaceId = workspaceIdHeader;
            
            if (!targetWorkspaceId && organizationId) {
                const defaultWs = await prisma.workspace.findFirst({ where: { organizationId }});
                if (defaultWs) targetWorkspaceId = defaultWs.id;
            }

            if (targetWorkspaceId) {
                const fileRepo = AppDataSource.getRepository(File);
                await fileRepo.update(result.id, { workspaceId: targetWorkspaceId });

                await executeWorkspaceAction(targetWorkspaceId, userId, 'FILE_UPLOADED', result.id, {
                    filename: result.filename, originalName: result.originalName, size: result.size
                });
            } else {
                const { broadcastUpdate } = require('../index'); 
                broadcastUpdate('file', { action: 'upload', fileId: result.id, userId }); 
            }
        } catch (e) { console.error('Workspace broadcast error', e); }

        res.json({
            message: 'File uploaded',
            file: {
                id: result.id,
                filename: result.filename,
                originalName: result.originalName,
                size: result.size,
                mimeType: result.mimeType,
                createdAt: result.createdAt,
                isProcessed: false,
                isFavorite: false,
                groupId: null
            }
        });

    } catch (error: any) {
        console.error('File Upload Error:', error);
        res.status(error.statusCode || 500).json({ error: error.message });
    }
};

// ─── List Files ─────────────────────────────────────────────────────────────
// Fixed: Single query with LEFT JOIN instead of N+1 queries

export const getFiles = async (req: AuthRequest, res: Response) => {
    const userId = req.user?.userId;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    try {
        // Single query: get all files + whether they have a completed analysis
        const files = await AppDataSource.getRepository(File)
            .createQueryBuilder('file')
            .leftJoin('analyses', 'a', 'a."fileId" = file.id AND a.status = :status', { status: 'completed' })
            .addSelect('CASE WHEN a.id IS NOT NULL THEN true ELSE false END', 'has_analysis')
            .addSelect('a."completedAt"', 'analysis_completed_at')
            .where('file.ownerId = :userId', { userId })
            .andWhere('file.isDeleted = false')
            .orderBy('file.createdAt', 'DESC')
            .getRawAndEntities();

        const enriched = files.entities.map((f, idx) => {
            const raw = files.raw[idx];
            const hasAnalysis = raw?.has_analysis === true || raw?.has_analysis === 't' || raw?.has_analysis === '1' || raw?.has_analysis === 1;

            // If DB says it has analysis but file record doesn't reflect it, fix it (async, non-blocking)
            if (hasAnalysis && !f.isProcessed) {
                f.isProcessed = true;
                f.processedAt = raw?.analysis_completed_at || new Date();
                AppDataSource.getRepository(File).save(f).catch(() => { });
            }

            return {
                id: f.id,
                filename: f.filename,
                originalName: f.originalName,
                size: f.size,
                mimeType: f.mimeType,
                createdAt: f.createdAt,
                updatedAt: f.updatedAt,
                isFavorite: f.isFavorite,
                isArchived: f.isArchived,
                isProcessed: f.isProcessed || hasAnalysis,
                processedAt: f.processedAt || raw?.analysis_completed_at || null,
                groupId: f.groupId,
                checksum: f.checksum
            };
        });

        res.json(enriched);
    } catch (error) {
        console.error('[getFiles] Error:', error);
        // Fallback: simple query without JOIN if the above fails
        try {
            const fileRepo = AppDataSource.getRepository(File);
            const files = await fileRepo.find({
                where: { ownerId: userId, isDeleted: false },
                order: { createdAt: 'DESC' }
            });
            res.json(files.map(f => ({
                id: f.id,
                filename: f.filename,
                originalName: f.originalName,
                size: f.size,
                mimeType: f.mimeType,
                createdAt: f.createdAt,
                updatedAt: f.updatedAt,
                isFavorite: f.isFavorite,
                isArchived: f.isArchived,
                isProcessed: f.isProcessed,
                processedAt: f.processedAt,
                groupId: f.groupId,
                checksum: f.checksum
            })));
        } catch (e2) {
            console.error('[getFiles] Fallback also failed:', e2);
            res.status(500).json({ error: 'Database error' });
        }
    }
};

// ─── Toggle Archive ──────────────────────────────────────────────────────────

export const toggleArchiveHandler = async (req: AuthRequest, res: Response) => {
    const userId = req.user?.userId;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const fileRepo = AppDataSource.getRepository(File);

    try {
        const fileId = req.params.id as string;
        const file = await fileRepo.findOne({ where: { id: fileId, isDeleted: false } });
        if (!file || file.ownerId !== userId) return res.status(404).json({ error: 'File not found' });

        file.isArchived = !file.isArchived;
        await fileRepo.save(file);
        res.json(file);
    } catch (error) {
        res.status(500).json({ error: 'Archive toggle failed' });
    }
};

// ─── Analyze File ───────────────────────────────────────────────────────────
// Refactored: Single source of truth for results. No more split storage.

export const analyzeFileHandler = async (req: AuthRequest, res: Response) => {
    const userId = req.user?.userId;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const fileId = req.params.id;
    const forceReprocess = req.query.force === 'true';

    const fileRepo = AppDataSource.getRepository(File);
    const { Analysis } = require('../entities/Analysis');
    const analysisRepo = AppDataSource.getRepository(Analysis);

    try {
        const file = await fileRepo.findOne({ where: { id: fileId as string, isDeleted: false } });
        if (!file) return res.status(404).json({ error: 'File not found' });

        // ─── Cache Hit ──────────────────────────────────────────────
        if (!forceReprocess) {
            const cached = await analysisRepo.findOne({
                where: { fileId: file.id, status: 'completed' },
                order: { createdAt: 'DESC' }
            });

            if (cached?.results) {
                console.log(`[Analysis] CACHE HIT for ${file.id}`);

                // Ensure file is marked processed
                if (!file.isProcessed) {
                    file.isProcessed = true;
                    file.processedAt = cached.completedAt || new Date();
                    fileRepo.save(file).catch(() => { });
                }

                return res.json({
                    id: file.id,
                    cached: true,
                    cachedAt: cached.completedAt,
                    processingTimeMs: cached.processingTimeMs || 0,
                    // Return EXACTLY what was stored - single source of truth
                    ...cached.results
                });
            }
        }

        // ─── Physical File Check ────────────────────────────────────
        const filePath = file.s3Key || file.filename;
        const uploadsDir = process.env.UPLOAD_DIR || path.resolve(process.cwd(), 'uploads');
        let absolutePath = filePath;
        if (!filePath.includes('/') && !filePath.includes('\\')) {
            absolutePath = path.join(uploadsDir, filePath);
        } else {
            absolutePath = path.resolve(process.cwd(), filePath);
        }

        if (!fs.existsSync(absolutePath)) {
            console.error(`[Analysis] File missing: ${absolutePath}`);
            return res.status(422).json({
                error: 'FILE_NOT_FOUND',
                message: `The dataset "${file.originalName || file.filename}" needs to be re-uploaded. The file is no longer available on the server.`,
                fileId: file.id,
                fileName: file.originalName || file.filename
            });
        }

        // ─── Fresh Analysis ─────────────────────────────────────────
        console.log(`[Analysis] Processing ${file.id} (${file.originalName})`);
        
        try {
            let targetWorkspaceId = file.workspaceId;
            if (!targetWorkspaceId && file.organizationId) {
                const defaultWs = await prisma.workspace.findFirst({ where: { organizationId: file.organizationId }});
                if (defaultWs) targetWorkspaceId = defaultWs.id;
            }
            if (targetWorkspaceId) {
                await executeWorkspaceAction(targetWorkspaceId, userId, 'ANALYSIS_STARTED', file.id, {
                    filename: file.originalName || file.filename
                });
            }
        } catch (e) { console.error('Workspace broadcast error', e); }

        const t0 = Date.now();
        const result = await analyzeFile(file.s3Key || file.filename, file.mimeType);
        const duration = Date.now() - t0;
        console.log(`[Analysis] Done in ${duration}ms for ${file.id}`);

        if (result.type === 'Error') {
            return res.status(422).json({
                error: 'ANALYSIS_FAILED',
                message: result.dataLimitations?.[0] || 'Analysis engine could not process this dataset.'
            });
        }

        // ─── Persist (single source of truth) ───────────────────────
        // Store the COMPLETE result object in `results` column.
        // No more splitting across insights/statistics columns.
        const hasData = (result.sampleData?.length > 0) || (result.options?.length > 0);

        if (hasData) {
            try {
                // Delete old analyses for this file
                await analysisRepo.delete({ fileId: file.id });

                // The complete payload that gets stored AND returned
                const payload = {
                    type: result.type,
                    options: result.options || [],
                    sampleData: result.sampleData || [],
                    summary: result.summary || {},
                    dataHealth: result.dataHealth || {},
                    keyFindings: result.keyFindings || [],
                    aiInsights: result.aiInsights || [],
                    executiveReasoning: result.executiveReasoning || null,
                    metrics: result.metrics || [],
                    processingLog: result.processingLog || [],
                    dataLimitations: result.dataLimitations || [],
                    processingTimeMs: duration
                };

                const analysis = analysisRepo.create({
                    fileId: file.id,
                    createdById: userId,
                    status: 'completed',
                    results: payload,  // Single source of truth
                    insights: null,    // Deprecated — kept for migration safety
                    statistics: null,  // Deprecated — kept for migration safety
                    processingTimeMs: duration,
                    completedAt: new Date()
                });
                await analysisRepo.save(analysis);

                // Mark file as processed
                file.isProcessed = true;
                file.processedAt = new Date();
                await fileRepo.save(file);

                // Broadcast
                try {
                    let targetWorkspaceId = file.workspaceId;
                    if (!targetWorkspaceId && file.organizationId) {
                        const defaultWs = await prisma.workspace.findFirst({ where: { organizationId: file.organizationId }});
                        if (defaultWs) targetWorkspaceId = defaultWs.id;
                    }
                    if (targetWorkspaceId) {
                        await executeWorkspaceAction(targetWorkspaceId, userId, 'ANALYSIS_COMPLETED', file.id, {
                            filename: file.originalName || file.filename,
                            processingTimeMs: duration
                        });
                    } else {
                        const { broadcastUpdate } = require('../index');
                        broadcastUpdate('file', {
                            action: 'analysis_complete',
                            fileId: file.id,
                            userId,
                            isProcessed: true
                        });
                    }
                } catch (e) { console.error('Workspace broadcast error', e); }

                // Return the exact same payload
                return res.json({ id: file.id, cached: false, ...payload });

            } catch (dbErr) {
                console.error('[Analysis] DB persist failed:', dbErr);
                // Still return the result even if DB save failed
                return res.json({ id: file.id, cached: false, ...result, processingTimeMs: duration });
            }
        }

        // Empty result
        console.warn(`[Analysis] Empty result for ${file.id}`);
        res.json({ id: file.id, cached: false, ...result, processingTimeMs: duration });

    } catch (error: any) {
        console.error('Analysis Error:', error);

        if (error.code === 'FILE_NOT_FOUND') {
            return res.status(422).json({
                error: 'FILE_NOT_FOUND',
                message: error.message
            });
        }

        res.status(500).json({ error: error?.message || 'Analysis failed' });
    }
};

// ─── Scrape URL ─────────────────────────────────────────────────────────────

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
            scrapeMetadata: { title: scrapeResult.title, method: scrapeResult.method, originalUrl: url }
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Scraping failed. Ensure URL is valid.' });
    }
};

// ─── Delete File ────────────────────────────────────────────────────────────

export const deleteFileHandler = async (req: AuthRequest, res: Response) => {
    const userId = req.user?.userId;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const fileRepo = AppDataSource.getRepository(File);

    try {
        const fileId = req.params.id as string;
        const file = await fileRepo.findOne({ where: { id: fileId, isDeleted: false } });
        if (!file || file.ownerId !== userId) return res.status(404).json({ error: 'File not found' });

        const fileSize = Number(file.size);
        const orgId = file.organizationId;

        await AppDataSource.transaction(async (tx) => {
            file.isDeleted = true;
            await tx.save(File, file);

            const org = await tx.findOne(Organization, {
                where: { id: orgId },
                lock: process.env.NODE_ENV === 'test' ? undefined : { mode: 'pessimistic_write' }
            });
            if (org) {
                org.storageUsed = Math.max(0, Number(org.storageUsed) - fileSize);
                await tx.save(Organization, org);
            }
        });

        // Clean up physical file
        if (file.s3Key && fs.existsSync(file.s3Key)) {
            try { fs.unlinkSync(file.s3Key); } catch (e) { }
        }

        try {
            let targetWorkspaceId = file.workspaceId;
            if (!targetWorkspaceId && file.organizationId) {
                const defaultWs = await prisma.workspace.findFirst({ where: { organizationId: file.organizationId }});
                if (defaultWs) targetWorkspaceId = defaultWs.id;
            }
            if (targetWorkspaceId) {
                await executeWorkspaceAction(targetWorkspaceId, userId, 'FILE_DELETED', file.id, {
                    filename: file.originalName || file.filename
                });
            }
        } catch (e) { console.error('Workspace broadcast error', e); }

        res.json({ message: 'File deleted successfully' });
    } catch (error: any) {
        res.status(500).json({ error: 'Deletion failed: ' + error.message });
    }
};

// ─── Toggle Favorite ────────────────────────────────────────────────────────

export const toggleFavoriteHandler = async (req: AuthRequest, res: Response) => {
    const userId = req.user?.userId;
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

// ─── Transform File ────────────────────────────────────────────────────────

export const transformFileHandler = async (req: AuthRequest, res: Response) => {
    const userId = req.user?.userId;
    const { id } = req.params;
    const { mapping, exclude, newName } = req.body;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const fileRepo = AppDataSource.getRepository(File);

    try {
        const fileId = id as string;
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

        const transformedRecords = records.map((record: any) => {
            const newRecord: any = {};
            Object.keys(record).forEach(key => {
                if (exclude && exclude.includes(key)) return;
                const newKey = (mapping && mapping[key]) ? mapping[key] : key;
                newRecord[newKey] = record[key];
            });
            return newRecord;
        });

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
                    return val.includes(',') || val.includes('"') || val.includes('\n')
                        ? `"${val.replace(/"/g, '""')}"` : val;
                }).join(',');
                csvRows.push(row);
            }
            newContent = csvRows.join('\n');
        }

        let baseName = newName || ('Migrated_' + originalFile.filename.replace(/\.[^/.]+$/, ""));
        if (baseName.endsWith(extension)) baseName = baseName.substring(0, baseName.length - extension.length);
        const newFilename = baseName + extension;
        const newPath = path.join(process.env.UPLOAD_DIR || path.join(process.cwd(), 'uploads'), newFilename.replace(/[^a-z0-9.]/gi, '_') + '_' + Date.now());

        fs.writeFileSync(newPath, newContent);

        const newFileEntry = fileRepo.create({
            filename: newFilename,
            originalName: newFilename,
            mimeType,
            size: Buffer.byteLength(newContent),
            s3Key: newPath,
            ownerId: userId,
            organizationId: originalFile.organizationId,
            isFavorite: false
        });

        const savedFile = await fileRepo.save(newFileEntry);
        res.json(savedFile);

    } catch (e: any) {
        console.error('Transformation failed:', e);
        res.status(500).json({ error: e.message || 'Transformation failed' });
    }
};

// ─── Update File Group ──────────────────────────────────────────────────────

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

// ─── Preview File ───────────────────────────────────────────────────────────

export const previewFileHandler = async (req: AuthRequest, res: Response) => {
    const userId = req.user?.userId;
    const fileId = req.params.id;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const fileRepo = AppDataSource.getRepository(File);

    try {
        const file = await fileRepo.findOne({ where: { id: fileId as string, isDeleted: false } });
        if (!file || file.ownerId !== userId) return res.status(404).json({ error: 'File not found' });

        const filePath = file.s3Key || file.filename;
        const uploadsDir = process.env.UPLOAD_DIR || path.resolve(process.cwd(), 'uploads');
        let absolutePath = filePath;
        if (!filePath.includes('/') && !filePath.includes('\\')) {
            absolutePath = path.join(uploadsDir, filePath);
        } else {
            absolutePath = path.resolve(process.cwd(), filePath);
        }

        if (!fs.existsSync(absolutePath)) {
            return res.status(422).json({
                error: 'FILE_NOT_FOUND',
                message: `The dataset "${file.originalName || file.filename}" needs to be re-uploaded. It seems to have been removed from server storage.`,
                fileId: file.id
            });
        }

        const rawContent = fs.readFileSync(absolutePath);
        let previewData: any[] = [];

        if (file.mimeType.includes('json') || file.filename.endsWith('.json')) {
            const allData = JSON.parse(rawContent.toString());
            previewData = Array.isArray(allData) ? allData.slice(0, 15) : [allData];
        } else if (file.mimeType.includes('csv') || file.filename.endsWith('.csv')) {
            const records = parse(rawContent, {
                columns: true, skip_empty_lines: true, relax_column_count: true, trim: true
            });
            previewData = records.slice(0, 15);
        }

        const columns = previewData.length > 0 ? Object.keys(previewData[0]).map(key => {
            const sampleValue = previewData.find(r => r[key] !== null && r[key] !== '')?.[key];
            let type = 'string';
            if (sampleValue !== undefined && sampleValue !== null) {
                const valStr = String(sampleValue).trim();
                if (!isNaN(Number(valStr)) && valStr !== '') type = 'numeric';
                else if (!isNaN(Date.parse(valStr)) && valStr.length > 5) type = 'date';
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

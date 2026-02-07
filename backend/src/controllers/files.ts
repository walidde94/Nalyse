import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { AppDataSource } from '../config/database';
import { File } from '../entities/File';
import { Group } from '../entities/Group';
import { Organization } from '../entities/Organization';
import { User } from '../entities/User';
import { upload } from '../middleware/upload';
import { analyzeFile, analyzeRawData } from '../services/analyzer';
import { scrapeUrl } from '../services/scraper';
import fs from 'fs';
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

        const result = await AppDataSource.transaction(async (transactionalEntityManager) => {
            const org = await transactionalEntityManager.findOne(Organization, {
                where: { id: organizationId },
                lock: process.env.NODE_ENV === 'test' ? undefined : { mode: 'pessimistic_write' }
            });

            if (!org) throw new Error('Organization not found');

            if (Number(org.storageUsed) + fileSize > Number(org.storageLimit)) {
                const err = new Error('Storage quota exceeded');
                (err as any).statusCode = 403;
                throw err;
            }

            const newFile = transactionalEntityManager.create(File, {
                filename: req.file!.filename,
                originalName: req.file!.originalname,
                mimeType: req.file!.mimetype,
                size: fileSize,
                s3Key: req.file!.path,
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

    } catch (error) {
        console.error('File Upload Error:', error);
        res.status(500).json({ error: 'Database error: ' + (error as any).message });
    }
};

export const getFiles = async (req: AuthRequest, res: Response) => {
    const userId = req.user?.userId;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const fileRepo = AppDataSource.getRepository(File);

    try {
        const files = await fileRepo.find({
            where: { ownerId: userId, isDeleted: false },
            order: { createdAt: 'DESC' }
        });
        res.json(files);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Database error' });
    }
};

export const analyzeFileHandler = async (req: AuthRequest, res: Response) => {
    const userId = req.user?.userId;
    const fileId = req.params.id; // UUID is a string
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const fileRepo = AppDataSource.getRepository(File);

    try {
        const fileId = req.params.id as string;
        const file = await fileRepo.findOne({ where: { id: fileId, isDeleted: false } });
        if (!file || file.ownerId !== userId) return res.status(404).json({ error: 'File not found' });

        // Use s3Key as path because that's where we stored it
        const result = await analyzeFile(file.s3Key || file.filename, file.mimeType);

        // Broadcast analysis complete (Real-time update)
        try {
            const { broadcastUpdate } = require('../index');
            broadcastUpdate('file', {
                action: 'analysis_complete',
                fileId: file.id,
                userId: userId,
                analysis: result
            });
        } catch (e) { console.error('Broadcast failed:', e); }

        res.json(result);

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Analysis failed' });
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
            console.warn('Unsupported file type for transformation:', originalFile.mimeType);
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
        const newPath = 'uploads/' + newFilename.replace(/[^a-z0-9.]/gi, '_') + '_' + Date.now();

        console.log('Writing transformed file to:', newPath);
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
        console.log('Transformation complete for file:', savedFile.id);
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

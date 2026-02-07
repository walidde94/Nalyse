import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { AppDataSource } from '../config/database';
import { RemoteSource } from '../entities/RemoteSource';
import { SourceService } from '../services/sourceService';
import { analyzeRawData } from '../services/analyzer';

const sourceService = new SourceService();

export const createSource = async (req: AuthRequest, res: Response) => {
    try {
        const repo = AppDataSource.getRepository(RemoteSource);
        const source = repo.create({
            ...req.body,
            ownerId: req.user!.userId
        });
        await repo.save(source);
        res.status(201).json(source);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

export const getSources = async (req: AuthRequest, res: Response) => {
    try {
        const repo = AppDataSource.getRepository(RemoteSource);
        const sources = await repo.find({ where: { ownerId: req.user!.userId } });
        res.json(sources);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

export const analyzeSource = async (req: AuthRequest, res: Response) => {
    try {
        const id = req.params.id as string;
        const repo = AppDataSource.getRepository(RemoteSource);
        const source = await repo.findOne({ where: { id: id, ownerId: req.user!.userId } });

        if (!source) return res.status(404).json({ error: 'Source not found' });

        // 1. Fetch Fresh Data
        const rawData = await sourceService.fetchData(source);

        // 2. Run Analysis
        const result = analyzeRawData(rawData, source.name);

        // Update last synced
        source.lastSyncedAt = new Date();
        await repo.save(source);

        // Notify specific clients
        const { broadcastUpdate } = require('../index');
        broadcastUpdate('source_data', { sourceId: source.id, timestamp: source.lastSyncedAt });

        res.json({
            sourceName: source.name,
            lastSynced: source.lastSyncedAt,
            analysis: result
        });
    } catch (error: any) {
        res.status(500).json({ error: 'Live analysis failed: ' + error.message });
    }
};

export const updateSource = async (req: AuthRequest, res: Response) => {
    try {
        const id = req.params.id as string;
        const repo = AppDataSource.getRepository(RemoteSource);
        const source = await repo.findOne({ where: { id: id, ownerId: req.user!.userId } });

        if (!source) return res.status(404).json({ error: 'Source not found' });

        repo.merge(source, req.body);
        await repo.save(source);
        res.json(source);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

export const deleteSource = async (req: AuthRequest, res: Response) => {
    try {
        const id = req.params.id as string;
        const repo = AppDataSource.getRepository(RemoteSource);
        const source = await repo.findOne({ where: { id: id, ownerId: req.user!.userId } });
        if (source) await repo.remove(source);
        res.json({ message: 'Source disconnected' });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

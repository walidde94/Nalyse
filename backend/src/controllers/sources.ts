import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { prisma } from '../config/database';
import { SourceService } from '../services/sourceService';
import { analyzeRawData } from '../services/analyzer';

const sourceService = new SourceService();

export const createSource = async (req: AuthRequest, res: Response) => {
    try {
        const source = await prisma.remoteSource.create({
            data: {
                ...req.body,
                ownerId: req.user!.userId
            }
        });
        res.status(201).json(source);
    } catch (error: any) {
        console.error('[Sources] Create Error:', error);
        res.status(500).json({ error: error.message });
    }
};

export const getSources = async (req: AuthRequest, res: Response) => {
    try {
        const sources = await prisma.remoteSource.findMany({ 
            where: { ownerId: req.user!.userId } 
        });
        res.json(sources);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

export const analyzeSource = async (req: AuthRequest, res: Response) => {
    try {
        const id = req.params.id as string;
        const source = await prisma.remoteSource.findFirst({ 
            where: { id: id, ownerId: req.user!.userId } 
        });

        if (!source) return res.status(404).json({ error: 'Source not found' });

        // 1. Fetch Fresh Data
        const rawData = await sourceService.fetchData(source);

        // 2. Run Analysis
        const result = analyzeRawData(rawData, source.name);

        // Update last synced
        const updatedSource = await prisma.remoteSource.update({
            where: { id: source.id },
            data: { lastSyncedAt: new Date() }
        });

        // Notify specific clients
        const { broadcastUpdate } = require('../index');
        broadcastUpdate('source_data', { sourceId: updatedSource.id, timestamp: updatedSource.lastSyncedAt });

        res.json({
            sourceName: updatedSource.name,
            lastSynced: updatedSource.lastSyncedAt,
            analysis: result
        });
    } catch (error: any) {
        res.status(500).json({ error: 'Live analysis failed: ' + error.message });
    }
};

export const updateSource = async (req: AuthRequest, res: Response) => {
    try {
        const id = req.params.id as string;
        const source = await prisma.remoteSource.update({
            where: { id, ownerId: req.user!.userId } as any, // Typed as any because ownerId is not in the unique key but we want to enforce it
            data: req.body
        });
        res.json(source);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

export const deleteSource = async (req: AuthRequest, res: Response) => {
    try {
        const id = req.params.id as string;
        const source = await prisma.remoteSource.findFirst({ 
            where: { id: id, ownerId: req.user!.userId } 
        });
        
        if (source) {
            await prisma.remoteSource.delete({ where: { id: source.id } });
        }
        
        res.json({ message: 'Source disconnected' });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

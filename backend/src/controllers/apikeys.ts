import { Response } from 'express';
import { AppDataSource } from '../config/database';
import { ApiKey } from '../entities/ApiKey';
import { AuthRequest } from '../middleware/auth';
import crypto from 'crypto';

export const listApiKeys = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?.userId;
        const apiKeyRepo = AppDataSource.getRepository(ApiKey);
        const keys = await apiKeyRepo.find({ where: { ownerId: userId, isActive: true } });
        res.json(keys);
    } catch (error) {
        console.error('List API keys error:', error);
        res.status(500).json({ error: 'Failed to list keys' });
    }
};

export const createApiKey = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?.userId;
        const { name } = req.body;

        const apiKeyRepo = AppDataSource.getRepository(ApiKey);
        const rawKey = 'sk_live_' + crypto.randomBytes(24).toString('hex');
        const hashedKey = crypto.createHash('sha256').update(rawKey).digest('hex');

        const newApiKey = apiKeyRepo.create({
            key: hashedKey,
            name: name || 'New API Key',
            ownerId: userId!,
            isActive: true,
            requestsPerHour: 1000
        });

        await apiKeyRepo.save(newApiKey);

        // Return raw key only once
        res.status(201).json({
            ...newApiKey,
            key: rawKey,
            message: 'Please copy your key now. It will not be shown again.'
        });
    } catch (error) {
        console.error('Create API key error:', error);
        res.status(500).json({ error: 'Failed to create key' });
    }
};

export const revokeApiKey = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?.userId;
        const { key } = req.params;

        const apiKeyRepo = AppDataSource.getRepository(ApiKey);
        const keyString = key as string;
        const apiKey = await apiKeyRepo.findOne({ where: { key: keyString, ownerId: userId } });

        if (!apiKey) {
            return res.status(404).json({ error: 'Key not found' });
        }

        // Soft delete (deactivate) or hard delete. Let's do hard delete for this implementation.
        await apiKeyRepo.remove(apiKey);

        res.json({ message: 'Key revoked' });
    } catch (error) {
        console.error('Revoke API key error:', error);
        res.status(500).json({ error: 'Failed to revoke key' });
    }
};

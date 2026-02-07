import { Request, Response, NextFunction } from 'express';
import { AppDataSource } from '../config/database';
import { ApiKey } from '../entities/ApiKey';

export interface ApiRequest extends Request {
    apiKey?: ApiKey;
    user?: { userId: string };
}

export const validateExternalKey = async (req: ApiRequest, res: Response, next: NextFunction) => {
    const key = req.headers['x-api-key'] as string;

    if (!key) {
        return res.status(401).json({
            error: 'Authentication failed',
            message: 'Global API key missing. Please provide X-API-KEY header.'
        });
    }

    try {
        const crypto = require('crypto');
        const hashedKey = crypto.createHash('sha256').update(key).digest('hex');
        const apiKeyRepo = AppDataSource.getRepository(ApiKey);
        const keyData = await apiKeyRepo.findOne({
            where: { key: hashedKey, isActive: true },
            relations: ['owner']
        });

        if (!keyData) {
            return res.status(401).json({
                error: 'Authentication failed',
                message: 'Invalid or revoked API key.'
            });
        }

        // Attach owner context to request
        req.apiKey = keyData;
        req.user = { userId: keyData.ownerId };

        // Update last used timestamp (fire and forget for performance)
        apiKeyRepo.update(keyData.id, { lastUsedAt: new Date() }).catch(console.error);

        next();
    } catch (error) {
        res.status(500).json({ error: 'Internal server error during authentication' });
    }
};

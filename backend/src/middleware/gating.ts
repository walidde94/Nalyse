import { Request, Response, NextFunction } from 'express';
import { AppDataSource } from '../config/database';
import { User } from '../entities/User';
import { Organization } from '../entities/Organization';
import { AuthRequest } from './auth';

export const checkStorageLimit = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        if (!req.user || !req.user.userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const userRepo = AppDataSource.getRepository(User);
        const user = await userRepo.findOne({
            where: { id: req.user.userId },
            relations: ['organization']
        });

        if (!user || !user.organization) {
            return res.status(403).json({ error: 'No organization found' });
        }

        const org = user.organization;
        const contentLength = parseInt(req.headers['content-length'] || '0', 10);

        const used = Number(org.storageUsed);
        let limit = Number(org.storageLimit);

        if (org.plan === 'free') {
            limit = 104857600; // Hard cap 100MB for Free contributors
        }

        if (used + contentLength > limit) {
            return res.status(403).json({
                error: 'Storage limit exceeded',
                details: `Your plan limit is ${formatBytes(limit)}. Used: ${formatBytes(used)}.`
            });
        }

        (req as any).organization = org; // Pass org to next handler
        next();
    } catch (error) {
        console.error('Storage check error:', error);
        next(error);
    }
};

export const checkFeatureAccess = (requiredFeature: 'sql_engine' | 'correlation' | 'white_label' | 'multi_dataset' | 'pro_analytics') => {
    return async (req: AuthRequest, res: Response, next: NextFunction) => {
        try {
            if (!req.user || !req.user.userId) {
                return res.status(401).json({ error: 'Unauthorized' });
            }

            const userRepo = AppDataSource.getRepository(User);
            const user = await userRepo.findOne({
                where: { id: req.user.userId },
                relations: ['organization']
            });

            if (!user || !user.organization) {
                return res.status(403).json({ error: 'Organization not found' });
            }

            const plan = user.organization.plan;

            // Simple feature map
            const features: Record<string, string[]> = {
                free: [],
                pro: ['sql_engine', 'correlation', 'pro_analytics'],
                enterprise: ['sql_engine', 'correlation', 'pro_analytics', 'white_label', 'multi_dataset']
            };

            if (!features[plan].includes(requiredFeature)) {
                return res.status(403).json({
                    error: 'Feature not available on your plan',
                    upgradeRequired: true
                });
            }

            next();
        } catch (error) {
            next(error);
        }
    };
};

function formatBytes(bytes: number) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

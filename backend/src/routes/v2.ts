import { Router, Request, Response } from 'express';
import { prisma } from '../config/database';

// Mock middleware for v2 Auth (we would normally reuse standard)
const requireTokenV2 = async (req: Request, res: Response, next: Function) => {
    const key = req.headers['x-api-key'];
    if (!key) {
        return res.status(401).json({
            error: {
                code: 'UNAUTHORIZED',
                message: 'Missing x-api-key header'
            }
        });
    }
    // In complete implementation, we query ApiKey table.
    // For now we assume valid to build the interface.
    // Attach default org
    (req as any).user = { organizationId: 'mock-org' };
    next();
};

const router = Router();

// Middleware to use unified v2 response format
router.use((req, res, next) => {
    const originalJson = res.json;
    res.json = function (data) {
        if (data && data.error) {
            return originalJson.call(this, data); // Keep error structure intact
        }

        // Wrap success response
        const wrapped = {
            data,
            meta: {
                timestamp: new Date().toISOString(),
                version: 'v2'
            }
        };

        // If it's paginated
        if (data && data.items && typeof data.total !== 'undefined') {
            wrapped.data = data.items;
            (wrapped as any).meta.pagination = {
                total: data.total,
                page: data.page,
                limit: data.limit
            };
        }

        return originalJson.call(this, wrapped);
    };
    next();
});

// GET /datasets (Paginated, Filters)
router.get('/datasets', requireTokenV2, async (req: Request, res: Response) => {
    try {
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 50;

        const where: any = { isDeleted: false };

        const [items, total] = await Promise.all([
            prisma.file.findMany({
                where,
                orderBy: { createdAt: 'desc' },
                skip: (page - 1) * limit,
                take: limit
            }),
            prisma.file.count({ where })
        ]);

        // Workaround to bypass the custom res.json wrapper breaking shape if we just pass object
        // by returning raw shape that the wrapper understands.
        (res as any).jsonOriginal = res.json;
        res.json({ items, total, page, limit });
    } catch (e: any) {
        res.status(500).json({
            error: {
                code: 'INTERNAL_ERROR',
                message: e.message
            }
        });
    }
});

// GET /analyses (Paginated, Unified Format)
router.get('/analyses', requireTokenV2, async (req: Request, res: Response) => {
    try {
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 50;

        const [items, total] = await Promise.all([
            prisma.analysis.findMany({
                orderBy: { createdAt: 'desc' },
                skip: (page - 1) * limit,
                take: limit
            }),
            prisma.analysis.count()
        ]);

        res.json({ items, total, page, limit });
    } catch (e: any) {
        res.status(500).json({
            error: {
                code: 'INTERNAL_ERROR',
                message: e.message
            }
        });
    }
});

export default router;

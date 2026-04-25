import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { prisma } from '../config/database';

const router = Router();

/**
 * PATCH /api/presence
 * Update user presence status and custom text
 */
router.patch('/', authenticate, async (req: any, res: any) => {
    try {
        const userId = req.user.userId || req.user.id;
        const { status, customText } = req.body;

        if (!['available', 'busy', 'away', 'offline', 'vacation'].includes(status)) {
            return res.status(400).json({ error: 'Invalid status' });
        }

        const user = await prisma.user.update({
            where: { id: userId },
            data: {
                presenceStatus: status,
                customStatusText: customText === null ? null : (customText || null)
            },
            select: { id: true, presenceStatus: true, customStatusText: true }
        });

        // Broadcast presence update globally
        import('../index').then(app => {
            app.broadcastUpdate('presence', {
                userId,
                status: user.presenceStatus,
                customText: user.customStatusText
            });
        });

        return res.json(user);
    } catch (error) {
        console.error('Error updating presence:', error);
        return res.status(500).json({ error: 'Failed to update presence' });
    }
});

/**
 * GET /api/presence/org
 * Get presence for all users in the user's organization
 */
router.get('/org', authenticate, async (req: any, res: any) => {
    try {
        const userId = req.user.userId || req.user.id;
        const orgId = req.user.organizationId;

        if (!orgId) {
            // For users without an organization, just return their own presence
            const user = await prisma.user.findUnique({
                where: { id: userId },
                select: { id: true, presenceStatus: true, customStatusText: true }
            });
            return res.json([user]);
        }

        const users = await prisma.user.findMany({
            where: { organizationId: orgId, isActive: true },
            select: { id: true, presenceStatus: true, customStatusText: true }
        });

        return res.json(users);
    } catch (error) {
        console.error('Error fetching org presence:', error);
        return res.status(500).json({ error: 'Failed to fetch presence data' });
    }
});

export default router;

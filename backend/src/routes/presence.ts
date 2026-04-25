import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { prisma } from '../config/database';
import { isUserOnline } from '../services/presenceService';

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
 * Get presence for all users in the user's organization (or all active users if no org is set)
 */
router.get('/org', authenticate, async (req: any, res: any) => {
    try {
        const orgId = req.user.organizationId;
        
        const whereClause = orgId 
            ? { organizationId: orgId, isActive: true }
            : { isActive: true };

        const users = await prisma.user.findMany({
            where: whereClause,
            select: { id: true, presenceStatus: true, customStatusText: true }
        });

        // Overlay real-time online status
        const usersWithRealtimeStatus = users.map(u => {
            let status = u.presenceStatus || 'available';
            
            // If DB says offline but user is connected, mark as available
            if (status === 'offline' && isUserOnline(u.id)) {
                status = 'available';
            } 
            // If user is not connected, they are offline (unless they set a persistent status like 'vacation'? No, vacation usually means offline too but with a note)
            else if (!isUserOnline(u.id) && status !== 'vacation') {
                status = 'offline';
            }

            return {
                ...u,
                presenceStatus: status
            };
        });

        return res.json(usersWithRealtimeStatus);
    } catch (error) {
        console.error('Error fetching org presence:', error);
        return res.status(500).json({ error: 'Failed to fetch presence data' });
    }
});

export default router;

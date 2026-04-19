import { Router, Response } from 'express';
import { authenticate } from '../middleware/auth';
import { prisma } from '../config/database';

const router = Router();

// ═══════════════════════════════════════════════════════════════
// NEW REINFORCED GOVERNANCE ROUTES
// ═══════════════════════════════════════════════════════════════

/**
 * GET /api/organization
 * Returns full organization data, including members and pending invites.
 */
router.get('/', authenticate, async (req: any, res: Response) => {
    try {
        const userId = req.user.userId;
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { organizationId: true, role: true }
        });

        if (!user?.organizationId) {
            return res.status(403).json({ error: 'You are not assigned to an organization.' });
        }

        const orgId = user.organizationId;
        const org = await prisma.organization.findUnique({
            where: { id: orgId },
            include: {
                _count: {
                    select: {
                        users: true,
                        workspaces: true,
                        dashboards: true,
                    },
                },
            },
        });

        if (!org) return res.status(404).json({ error: 'Organization not found' });

        // Get live members
        const members = await prisma.user.findMany({
            where: { organizationId: orgId },
            select: {
                id: true, email: true, firstName: true, lastName: true,
                displayName: true, avatarUrl: true, role: true, isActive: true,
                lastLoginAt: true, createdAt: true,
                orgRole: { select: { id: true, name: true } },
            },
            orderBy: { createdAt: 'asc' },
        });

        res.json({
            organization: {
                ...org,
                storageUsed: org.storageUsed?.toString() || '0',
                storageLimit: org.storageLimit?.toString() || '0',
            },
            members,
            currentUserRole: user.role,
        });
    } catch (err) {
        console.error('[Organization] Fetch failed:', err);
        res.status(500).json({ error: 'Failed to retrieve organization data' });
    }
});

/**
 * GET /api/organization/roles
 * Returns all roles defined for this organization.
 */
router.get('/roles', authenticate, async (req: any, res: Response) => {
    try {
        const userId = req.user.userId;
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { organizationId: true }
        });

        if (!user?.organizationId) return res.status(403).json({ error: 'No organization' });

        const roles = await prisma.orgRole.findMany({
            where: { organizationId: user.organizationId },
            include: {
                _count: { select: { users: true } }
            }
        });

        res.json({ roles });
    } catch (err) {
        console.error('[Organization] Roles fetch failed:', err);
        res.status(500).json({ error: 'Failed to retrieve roles' });
    }
});

export default router;

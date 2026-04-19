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
        console.log(`[Org] Fetching for user: ${userId}`);

        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { organizationId: true, role: true }
        });

        if (!user) {
            return res.status(404).json({ error: 'User record not found' });
        }

        if (!user.organizationId) {
            console.warn(`[Org] User ${userId} has no organizationId`);
            return res.status(403).json({ error: 'You are not assigned to an organization.' });
        }

        const orgId = user.organizationId;
        const org = await prisma.organization.findUnique({
            where: { id: orgId },
            select: {
                id: true, name: true, slug: true, plan: true,
                isActive: true, createdAt: true, storageUsed: true, storageLimit: true,
                _count: {
                    select: {
                        users: true,
                        workspaces: true,
                        dashboards: true,
                    },
                },
            }
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

        // Safe conversion for BigInt to avoid serialization issues
        const safeOrg = {
            ...org,
            storageUsed: org.storageUsed?.toString() || '0',
            storageLimit: org.storageLimit?.toString() || '0',
        };

        res.json({
            organization: safeOrg,
            members,
            currentUserRole: user.role,
        });
    } catch (err: any) {
        console.error('[Organization] Fetch failed:', err);
        res.status(500).json({ error: 'Failed to retrieve organization data', details: err.message });
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
    } catch (err: any) {
        console.error('[Organization] Roles fetch failed:', err);
        res.status(500).json({ error: 'Failed to retrieve roles', details: err.message });
    }
});

export default router;

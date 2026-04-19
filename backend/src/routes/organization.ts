import { Router, Response } from 'express';
import { authenticate, AuthRequest } from '../middleware/auth';
import { getOrganization, updateOrganization, inviteMember } from '../controllers/organization';
import { prisma } from '../config/database';

const router = Router();

// ═══════════════════════════════════════════════════════════════
// CORE ORG ENDPOINTS (existing TypeORM controller — untouched)
// ═══════════════════════════════════════════════════════════════
router.get('/', authenticate, getOrganization);
router.put('/', authenticate, updateOrganization);
router.post('/invite', authenticate, inviteMember);

// ═══════════════════════════════════════════════════════════════
// GOVERNANCE ANALYTICS — All read-only, uses Prisma on existing tables
// ═══════════════════════════════════════════════════════════════

/**
 * GET /api/organization/governance
 * One-shot governance dashboard data: members with asset counts,
 * role distribution, storage metrics, activity timeline.
 * No schema changes — queries existing tables only.
 */
router.get('/governance', authenticate, async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?.userId;
        if (!userId) return res.status(401).json({ error: 'Unauthorized' });

        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { organizationId: true, role: true }
        });

        if (!user?.organizationId) {
            return res.status(403).json({ error: 'No organization assigned' });
        }

        const orgId = user.organizationId;

        // Parallel fetch all governance data using existing tables
        const [
            org,
            members,
            workspaces,
            files,
            analyses,
            auditLogs,
            invitations,
            dashboards,
            recentMessages
        ] = await Promise.all([
            // Organization
            prisma.organization.findUnique({
                where: { id: orgId },
                select: {
                    id: true, name: true, slug: true, plan: true,
                    isActive: true, createdAt: true,
                    storageUsed: true, storageLimit: true,
                    userLimit: true, fileLimit: true, maxUsers: true,
                }
            }),

            // Members with their workspace memberships
            prisma.user.findMany({
                where: { organizationId: orgId },
                select: {
                    id: true, email: true, firstName: true, lastName: true,
                    displayName: true, avatarUrl: true, role: true, isActive: true,
                    lastLoginAt: true, createdAt: true, plan: true,
                    _count: {
                        select: {
                            files: true,
                            analyses: true,
                            dashboards: true,
                            workspaceMembers: true,
                            workspaceMessages: true,
                        }
                    }
                },
                orderBy: { createdAt: 'asc' },
            }),

            // Workspaces
            prisma.workspace.findMany({
                where: { organizationId: orgId },
                select: {
                    id: true, name: true, createdAt: true,
                    _count: {
                        select: { members: true, files: true, messages: true }
                    }
                }
            }),

            // Org-wide file stats
            prisma.file.aggregate({
                where: { organizationId: orgId },
                _count: true,
                _sum: { size: true },
            }),

            // Analysis count
            prisma.analysis.count({
                where: { file: { organizationId: orgId } }
            }),

            // Recent audit logs (last 50)
            prisma.auditLog.findMany({
                where: { workspace: { organizationId: orgId } },
                orderBy: { createdAt: 'desc' },
                take: 50,
                select: {
                    id: true, action: true, entityId: true, details: true, createdAt: true,
                    user: { select: { id: true, email: true, firstName: true, lastName: true, displayName: true, avatarUrl: true } },
                    workspace: { select: { id: true, name: true } },
                }
            }),

            // Pending invitations
            prisma.userInvitation.findMany({
                where: { organizationId: orgId, status: 'pending' },
                select: {
                    id: true, email: true, role: true, status: true, createdAt: true, expiresAt: true,
                    inviter: { select: { email: true, firstName: true, lastName: true } }
                }
            }),

            // Dashboard count
            prisma.dashboard.count({
                where: { organizationId: orgId }
            }),

            // Recent workspace messages (last 20, for activity feed)
            prisma.workspaceMessage.findMany({
                where: { workspace: { organizationId: orgId } },
                orderBy: { createdAt: 'desc' },
                take: 20,
                select: {
                    id: true, content: true, createdAt: true,
                    author: { select: { email: true, firstName: true, lastName: true, displayName: true, avatarUrl: true } },
                    workspace: { select: { name: true } },
                }
            }),
        ]);

        if (!org) return res.status(404).json({ error: 'Organization not found' });

        // Compute role distribution from existing User.role field
        const roleDistribution: Record<string, number> = {};
        members.forEach(m => {
            const r = m.role || 'member';
            roleDistribution[r] = (roleDistribution[r] || 0) + 1;
        });

        // Compute activity heatmap (last 30 days)
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        const activityByDay: Record<string, number> = {};
        auditLogs.forEach(log => {
            const day = new Date(log.createdAt).toISOString().split('T')[0];
            activityByDay[day] = (activityByDay[day] || 0) + 1;
        });

        // Members active in last 7 days
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        const activeLastWeek = members.filter(m => m.lastLoginAt && new Date(m.lastLoginAt) > sevenDaysAgo).length;

        res.json({
            organization: {
                ...org,
                storageUsed: org.storageUsed?.toString() || '0',
                storageLimit: org.storageLimit?.toString() || '0',
            },
            members,
            workspaces,
            invitations,
            auditLogs,
            recentMessages,
            stats: {
                totalMembers: members.length,
                activeMembers: members.filter(m => m.isActive).length,
                activeLastWeek,
                totalFiles: files._count || 0,
                totalStorage: files._sum?.size?.toString() || '0',
                totalAnalyses: analyses,
                totalWorkspaces: workspaces.length,
                totalDashboards: dashboards,
                pendingInvitations: invitations.length,
                roleDistribution,
                activityByDay,
            },
            currentUserRole: user.role,
        });
    } catch (err: any) {
        console.error('[Governance] Data fetch failed:', err);
        res.status(500).json({ error: 'Failed to retrieve governance data', details: err.message });
    }
});

export default router;

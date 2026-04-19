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

            // Members with workspace memberships + relations for asset counting
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
                            auditLogs: true,
                        }
                    },
                    // Include workspace memberships to compute shared assets
                    workspaceMembers: {
                        select: {
                            role: true,
                            workspace: {
                                select: {
                                    id: true, name: true,
                                    _count: { select: { files: true, messages: true } }
                                }
                            }
                        }
                    },
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

        // Enrich members with computed status and workspace assets
        const now = Date.now();
        const SEVEN_DAYS = 7 * 24 * 60 * 60 * 1000;
        const THIRTY_DAYS = 30 * 24 * 60 * 60 * 1000;

        const enrichedMembers = members.map(m => {
            // Compute activity status from lastLoginAt instead of stale isActive boolean
            let activityStatus: 'online' | 'active' | 'away' | 'offline' = 'offline';
            if (m.lastLoginAt) {
                const elapsed = now - new Date(m.lastLoginAt).getTime();
                if (elapsed < 15 * 60 * 1000) activityStatus = 'online';       // <15 min
                else if (elapsed < SEVEN_DAYS) activityStatus = 'active';       // <7 days
                else if (elapsed < THIRTY_DAYS) activityStatus = 'away';        // <30 days
                // else: offline
            }

            // Aggregate workspace-level shared assets for this user
            const wsMembers = (m as any).workspaceMembers || [];
            const sharedFiles = wsMembers.reduce((sum: number, wm: any) => sum + (wm.workspace?._count?.files || 0), 0);
            const sharedMessages = wsMembers.reduce((sum: number, wm: any) => sum + (wm.workspace?._count?.messages || 0), 0);
            const workspaceRoles = wsMembers.map((wm: any) => ({ workspaceId: wm.workspace?.id, workspaceName: wm.workspace?.name, role: wm.role }));

            // Strip workspace raw data from response to keep payload lean
            const { workspaceMembers: _ws, ...memberData } = m as any;

            return {
                ...memberData,
                activityStatus,
                assets: {
                    ownedFiles: m._count?.files || 0,
                    analyses: m._count?.analyses || 0,
                    dashboards: m._count?.dashboards || 0,
                    messages: m._count?.workspaceMessages || 0,
                    workspaces: m._count?.workspaceMembers || 0,
                    auditActions: m._count?.auditLogs || 0,
                    sharedFiles,
                    sharedMessages,
                },
                workspaceRoles,
            };
        });

        // Compute role distribution from existing User.role field
        const roleDistribution: Record<string, number> = {};
        enrichedMembers.forEach(m => {
            const r = m.role || 'member';
            roleDistribution[r] = (roleDistribution[r] || 0) + 1;
        });

        // Compute activity heatmap (last 30 days)
        const activityByDay: Record<string, number> = {};
        auditLogs.forEach(log => {
            const day = new Date(log.createdAt).toISOString().split('T')[0];
            activityByDay[day] = (activityByDay[day] || 0) + 1;
        });

        // Members active in last 7 days
        const activeLastWeek = enrichedMembers.filter(m => m.activityStatus === 'online' || m.activityStatus === 'active').length;

        res.json({
            organization: {
                ...org,
                storageUsed: org.storageUsed?.toString() || '0',
                storageLimit: org.storageLimit?.toString() || '0',
            },
            members: enrichedMembers,
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

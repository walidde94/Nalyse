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
            }).catch(async e => {
                console.error('[Org Error]', e.message);
                return await prisma.organization.findUnique({
                    where: { id: orgId },
                    select: {
                        id: true, name: true, slug: true, plan: true,
                        isActive: true, createdAt: true
                    }
                }).catch(() => null);
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
            }).catch(async e => { 
                console.error('[Members Error]', e.message); 
                return await prisma.user.findMany({
                    where: { organizationId: orgId },
                    select: {
                        id: true, email: true, firstName: true, lastName: true,
                        displayName: true, avatarUrl: true, role: true, isActive: true,
                        lastLoginAt: true, createdAt: true, plan: true
                    },
                    orderBy: { createdAt: 'asc' }
                }).catch(() => []);
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
            }).catch(e => { console.error('[Workspaces Error]', e); return []; }),

            // Org-wide file stats
            prisma.file.aggregate({
                where: { organizationId: orgId },
                _count: true,
                _sum: { size: true },
            }).catch(e => { console.error('[Files Error]', e); return { _count: 0, _sum: { size: 0 } }; }),

            // Analysis count
            prisma.analysis.count({
                where: { file: { organizationId: orgId } }
            }).catch(e => { console.error('[Analyses Error]', e); return 0; }),

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
            }).catch(e => { console.error('[Audit Error]', e); return []; }),

            // Pending invitations
            prisma.userInvitation.findMany({
                where: { organizationId: orgId, status: 'pending' },
                select: {
                    id: true, email: true, role: true, status: true, createdAt: true, expiresAt: true,
                    inviter: { select: { email: true, firstName: true, lastName: true } }
                }
            }).catch(e => { console.error('[Invitations Error]', e); return []; }),

            // Dashboard count
            prisma.dashboard.count({
                where: { organizationId: orgId }
            }).catch(e => { console.error('[Dashboard Error]', e); return 0; }),

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
            }).catch(e => { console.error('[Messages Error]', e); return []; }),
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
                    ownedFiles: (m as any)._count?.files || 0,
                    analyses: (m as any)._count?.analyses || 0,
                    dashboards: (m as any)._count?.dashboards || 0,
                    messages: (m as any)._count?.workspaceMessages || 0,
                    workspaces: (m as any)._count?.workspaceMembers || 0,
                    auditActions: (m as any)._count?.auditLogs || 0,
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
                storageUsed: (org as any).storageUsed?.toString() || '0',
                storageLimit: (org as any).storageLimit?.toString() || '0',
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

// ═══════════════════════════════════════════════════════════════
// GOVERNANCE ACTIONS — Writes (admin-only)
// ═══════════════════════════════════════════════════════════════

/**
 * PATCH /api/organization/members/:memberId/role
 * Change a member's organization role. Admin only.
 */
router.patch('/members/:memberId/role', authenticate, async (req: AuthRequest, res: Response) => {
    try {
        const adminId = req.user?.userId;
        const memberId = req.params.memberId as string;
        const { role } = req.body;

        if (!adminId) return res.status(401).json({ error: 'Unauthorized' });
        if (!role || !['admin', 'user', 'member', 'viewer'].includes(role)) {
            return res.status(400).json({ error: 'Invalid role. Must be: admin, user, member, viewer' });
        }

        // Verify admin
        const admin = await prisma.user.findUnique({ where: { id: adminId }, select: { role: true, organizationId: true } });
        if (!admin || admin.role !== 'admin') return res.status(403).json({ error: 'Only admins can change roles' });

        // Verify target is in same org
        const target = await prisma.user.findUnique({ where: { id: memberId }, select: { id: true, organizationId: true, role: true, email: true } });
        if (!target || target.organizationId !== admin.organizationId) {
            return res.status(404).json({ error: 'Member not found in your organization' });
        }

        // Prevent self-demotion
        if (memberId === adminId && role !== 'admin') {
            return res.status(400).json({ error: 'You cannot demote yourself' });
        }

        const previousRole = target.role;
        await prisma.user.update({ where: { id: memberId }, data: { role } });

        console.log(`[Governance] Role changed: ${target.email} from ${previousRole} to ${role} by ${adminId}`);
        res.json({ success: true, memberId, previousRole, newRole: role });
    } catch (err: any) {
        console.error('[Governance] Role change failed:', err);
        res.status(500).json({ error: 'Failed to update role', details: err.message });
    }
});

/**
 * DELETE /api/organization/members/:memberId
 * Remove a member from the organization. Admin only.
 */
router.delete('/members/:memberId', authenticate, async (req: AuthRequest, res: Response) => {
    try {
        const adminId = req.user?.userId;
        const memberId = req.params.memberId as string;

        if (!adminId) return res.status(401).json({ error: 'Unauthorized' });

        const admin = await prisma.user.findUnique({ where: { id: adminId }, select: { role: true, organizationId: true } });
        if (!admin || admin.role !== 'admin') return res.status(403).json({ error: 'Only admins can remove members' });

        if (memberId === adminId) return res.status(400).json({ error: 'You cannot remove yourself' });

        const target = await prisma.user.findUnique({ where: { id: memberId }, select: { id: true, organizationId: true, email: true } });
        if (!target || target.organizationId !== admin.organizationId) {
            return res.status(404).json({ error: 'Member not found in your organization' });
        }

        // Unlink from organization (don't delete the user account)
        await prisma.user.update({ where: { id: memberId }, data: { organizationId: null } });

        console.log(`[Governance] Member removed: ${target.email} by ${adminId}`);
        res.json({ success: true, memberId, removedEmail: target.email });
    } catch (err: any) {
        console.error('[Governance] Member removal failed:', err);
        res.status(500).json({ error: 'Failed to remove member', details: err.message });
    }
});

/**
 * DELETE /api/organization/invitations/:invitationId
 * Revoke a pending invitation. Admin only.
 */
router.delete('/invitations/:invitationId', authenticate, async (req: AuthRequest, res: Response) => {
    try {
        const adminId = req.user?.userId;
        const invitationId = req.params.invitationId as string;

        if (!adminId) return res.status(401).json({ error: 'Unauthorized' });

        const admin = await prisma.user.findUnique({ where: { id: adminId }, select: { role: true, organizationId: true } });
        if (!admin || admin.role !== 'admin') return res.status(403).json({ error: 'Only admins can revoke invitations' });

        const invite = await prisma.userInvitation.findUnique({ where: { id: invitationId }, select: { id: true, organizationId: true, email: true } });
        if (!invite || invite.organizationId !== admin.organizationId) {
            return res.status(404).json({ error: 'Invitation not found' });
        }

        await prisma.userInvitation.update({ where: { id: invitationId }, data: { status: 'revoked' } });

        console.log(`[Governance] Invitation revoked: ${invite.email} by ${adminId}`);
        res.json({ success: true, invitationId, revokedEmail: invite.email });
    } catch (err: any) {
        console.error('[Governance] Invitation revoke failed:', err);
        res.status(500).json({ error: 'Failed to revoke invitation', details: err.message });
    }
});

/**
 * POST /api/organization/invitations/:invitationId/resend
 * Refresh and resend a pending invitation. Admin only.
 */
router.post('/invitations/:invitationId/resend', authenticate, async (req: AuthRequest, res: Response) => {
    try {
        const adminId = req.user?.userId;
        const invitationId = req.params.invitationId as string;

        if (!adminId) return res.status(401).json({ error: 'Unauthorized' });

        const admin = await prisma.user.findUnique({ where: { id: adminId }, select: { role: true, organizationId: true } });
        if (!admin || admin.role !== 'admin' || !admin.organizationId) return res.status(403).json({ error: 'Insufficient permissions' });

        const invite = await prisma.userInvitation.findUnique({
            where: { id: invitationId },
            select: { id: true, organizationId: true, email: true }
        });

        if (!invite || invite.organizationId !== admin.organizationId) {
            return res.status(404).json({ error: 'Invitation not found' });
        }

        // Generate new token and expiry (7 days from now)
        const newToken = require('crypto').randomBytes(32).toString('hex');
        const newExpiry = new Date();
        newExpiry.setDate(newExpiry.getDate() + 7);

        await prisma.userInvitation.update({
            where: { id: invitationId },
            data: {
                token: newToken,
                expiresAt: newExpiry,
                status: 'pending' // Reset if it was revoked/expired
            }
        });

        console.log(`[Governance] Invitation resent: ${invite.email} by ${adminId}`);
        res.json({ success: true, message: 'Invitation resent successfully' });
    } catch (err: any) {
        console.error('[Governance] Invitation resend failed:', err);
        res.status(500).json({ error: 'Failed to resend invitation', details: err.message });
    }
});

/**
 * PUT /api/organization/members/:memberId
 * Update a member's organization-level role. Admin only.
 */
router.put('/members/:memberId', authenticate, async (req: AuthRequest, res: Response) => {
    try {
        const adminId = req.user?.userId;
        const memberId = req.params.memberId as string;
        const { role } = req.body;

        if (!adminId) return res.status(401).json({ error: 'Unauthorized' });
        if (!['admin', 'member', 'guest'].includes(role)) {
            return res.status(400).json({ error: 'Invalid role specified' });
        }

        const admin = await prisma.user.findUnique({ where: { id: adminId }, select: { role: true, organizationId: true, id: true } });
        if (!admin || admin.role !== 'admin' || !admin.organizationId) {
            return res.status(403).json({ error: 'Only admins can modify member roles' });
        }

        const member = await prisma.user.findUnique({ where: { id: memberId }, select: { id: true, organizationId: true, role: true } });
        if (!member || member.organizationId !== admin.organizationId) {
            return res.status(404).json({ error: 'Member not found in organization' });
        }

        // Safety: Cannot demote yourself if you are an admin (prevents lockouts)
        if (memberId === adminId && role !== 'admin') {
            return res.status(400).json({ error: 'Operation rejected: Cannot demote your own administrative role.' });
        }

        await prisma.user.update({
            where: { id: memberId },
            data: { role }
        });

        console.log(`[Governance] Member role updated: ${memberId} -> ${role} by ${adminId}`);
        res.json({ success: true, memberId, newRole: role });
    } catch (err: any) {
        console.error('[Governance] Member update failed:', err);
        res.status(500).json({ error: 'Failed to update member', details: err.message });
    }
});

/**
 * DELETE /api/organization/members/:memberId
 * Remove a member from the organization. Admin only.
 */
router.delete('/members/:memberId', authenticate, async (req: AuthRequest, res: Response) => {
    try {
        const adminId = req.user?.userId;
        const memberId = req.params.memberId as string;

        if (!adminId) return res.status(401).json({ error: 'Unauthorized' });

        const admin = await prisma.user.findUnique({ where: { id: adminId }, select: { role: true, organizationId: true } });
        if (!admin || admin.role !== 'admin' || !admin.organizationId) return res.status(403).json({ error: 'Only admins can remove members' });

        const member = await prisma.user.findUnique({ where: { id: memberId }, select: { id: true, organizationId: true, email: true } });
        if (!member || member.organizationId !== admin.organizationId) {
            return res.status(404).json({ error: 'Member not found in organization' });
        }

        // Safety: Cannot remove yourself
        if (memberId === adminId) {
            return res.status(400).json({ error: 'Operation rejected: Cannot remove yourself from the organization.' });
        }

        // Disassociate user from organization and clear workspace memberships
        await prisma.$transaction([
            prisma.workspaceMember.deleteMany({ where: { userId: memberId } }),
            prisma.user.update({
                where: { id: memberId },
                data: { organizationId: null, role: 'member' } // Reset to a neutral state
            })
        ]);

        console.log(`[Governance] Member removed: ${member.email} by ${adminId}`);
        res.json({ success: true, removedUser: member.email });
    } catch (err: any) {
        console.error('[Governance] Member removal failed:', err);
        res.status(500).json({ error: 'Failed to remove member', details: err.message });
    }
});

/**
 * POST /api/organization/members/:memberId/workspaces
 * Sync a member's workspace memberships. Admin only.
 */
router.post('/members/:memberId/workspaces', authenticate, async (req: AuthRequest, res: Response) => {
    try {
        const adminId = req.user?.userId;
        const memberId = req.params.memberId as string;
        const { workspaceIds } = req.body; // Array of workspace IDs the user should belong to

        if (!adminId) return res.status(401).json({ error: 'Unauthorized' });
        if (!Array.isArray(workspaceIds)) return res.status(400).json({ error: 'workspaceIds must be an array' });

        const admin = await prisma.user.findUnique({ where: { id: adminId }, select: { role: true, organizationId: true } });
        if (!admin || admin.role !== 'admin' || !admin.organizationId) return res.status(403).json({ error: 'Only admins can manage workspace memberships' });

        // Ensure all targeted workspaces belong to the admin's organization
        const orgWorkspaces = await prisma.workspace.findMany({
            where: { organizationId: admin.organizationId },
            select: { id: true }
        });
        const orgWorkspaceIds = orgWorkspaces.map(w => w.id);
        const validIds = workspaceIds.filter(id => orgWorkspaceIds.includes(id));

        // Sync memberships: Remove current and replace with new set
        await prisma.$transaction([
            prisma.workspaceMember.deleteMany({
                where: {
                    userId: memberId,
                    workspaceId: { in: orgWorkspaceIds }
                }
            }),
            prisma.workspaceMember.createMany({
                data: validIds.map(wId => ({
                    userId: memberId,
                    workspaceId: wId as string,
                    role: 'editor' // Default for now
                }))
            })
        ]);

        console.log(`[Governance] Workspace membership sync for ${memberId} by ${adminId}`);
        res.json({ success: true, syncedCount: validIds.length });
    } catch (err: any) {
        console.error('[Governance] Workspace sync failed:', err);
        res.status(500).json({ error: 'Failed to sync workspace memberships', details: err.message });
    }
});

export default router;

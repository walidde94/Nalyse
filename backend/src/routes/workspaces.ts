import { Router } from 'express';
import { prisma } from '../config/database';
import { authenticate } from '../middleware/auth';
import { executeWorkspaceAction } from '../services/workspaceService';

const router = Router();

// Helper: safely convert BigInt fields to strings for JSON serialization
const serializeFile = (f: any) => ({
    ...f,
    size: f.size != null ? f.size.toString() : '0'
});

// GET all workspaces for the authenticated user
router.get('/', authenticate, async (req: any, res: any) => {
    try {
        const userId = req.user.userId || req.user.id;
        const workspaces = await prisma.workspace.findMany({
            where: {
                members: {
                    some: { userId }
                }
            },
            include: {
                organization: { select: { name: true } },
                members: { include: { user: { select: { id: true, email: true, displayName: true } } } }
            }
        });
        res.json(workspaces);
    } catch (error) {
        console.error('Error fetching workspaces:', error);
        res.status(500).json({ error: 'Failed to fetch workspaces' });
    }
});

// Get user's own files that are NOT shared to any workspace (for the share picker modal)
router.get('/my-unshared-files', authenticate, async (req: any, res: any) => {
    try {
        const userId = req.user.userId || req.user.id;

        const files = await prisma.file.findMany({
            where: { ownerId: userId, workspaceId: null, isDeleted: false },
            orderBy: { createdAt: 'desc' },
            select: {
                id: true, filename: true, originalName: true, size: true, mimeType: true,
                createdAt: true, isProcessed: true
            }
        });

        res.json(files.map(serializeFile));
    } catch (error) {
        console.error('Error fetching unshared files:', error);
        res.status(500).json({ error: 'Failed to fetch files' });
    }
});

// GET recent activity (Audit Logs) for a workspace
router.get('/:id/activity', authenticate, async (req: any, res: any) => {
    try {
        const { id: workspaceId } = req.params;
        const userId = req.user.userId || req.user.id;

        // Ensure user is member
        const member = await prisma.workspaceMember.findUnique({
            where: { workspaceId_userId: { workspaceId, userId } }
        });

        if (!member) return res.status(403).json({ error: 'Unauthorized Access' });

        const logs = await prisma.auditLog.findMany({
            where: { workspaceId },
            orderBy: { createdAt: 'desc' },
            take: 50,
            include: { user: { select: { displayName: true, email: true } } }
        });

        res.json(logs);
    } catch (error) {
        console.error('Error fetching activity:', error);
        res.status(500).json({ error: 'Failed to fetch activity' });
    }
});

// CREATE a workspace within an organization
router.post('/', authenticate, async (req: any, res: any) => {
    try {
        const { name, organizationId } = req.body;
        const userId = req.user.userId || req.user.id;

        // Basic check if user is in org
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { organizationId: true }
        });

        if (!user || user.organizationId !== organizationId) {
            return res.status(403).json({ error: 'No permissions in this organization' });
        }

        const workspace = await prisma.workspace.create({
            data: {
                name,
                organizationId,
                members: {
                    create: {
                        userId,
                        role: 'admin'
                    }
                }
            }
        });

        // Write to audit log that workspace was created (no broadcast needed yet as user is alone)
        await executeWorkspaceAction(workspace.id, userId, 'WORKSPACE_CREATED', null, { name });

        res.json(workspace);
    } catch (error) {
        console.error('Error creating workspace:', error);
        res.status(500).json({ error: 'Failed to create workspace' });
    }
});

// Add member to workspace
router.post('/:id/members', authenticate, async (req: any, res: any) => {
    try {
        const { id: workspaceId } = req.params;
        const { targetUserId, role = 'viewer' } = req.body;
        const currentUserId = req.user.userId || req.user.id;

        // Verify currentUser is admin of workspace
        const currentMember = await prisma.workspaceMember.findUnique({
            where: { workspaceId_userId: { workspaceId, userId: currentUserId } }
        });
        if (!currentMember || currentMember.role !== 'admin') {
            return res.status(403).json({ error: 'Only admins can add members' });
        }

        const newMember = await prisma.workspaceMember.create({
            data: {
                workspaceId,
                userId: targetUserId,
                role
            },
            include: { user: { select: { id: true, email: true, displayName: true, avatarUrl: true } } }
        });

        await executeWorkspaceAction(workspaceId, currentUserId, 'MEMBER_ADDED', targetUserId, { role });
        res.status(201).json(newMember);
    } catch (error) {
        console.error('Error adding member:', error);
        res.status(500).json({ error: 'Failed to add member' });
    }
});

// Update member role
router.put('/:id/members/:targetUserId', authenticate, async (req: any, res: any) => {
    try {
        const { id: workspaceId, targetUserId } = req.params;
        const { role } = req.body;
        const currentUserId = req.user.userId || req.user.id;

        const currentMember = await prisma.workspaceMember.findUnique({
            where: { workspaceId_userId: { workspaceId, userId: currentUserId } }
        });
        if (!currentMember || currentMember.role !== 'admin') {
            return res.status(403).json({ error: 'Only admins can change roles' });
        }

        const updated = await prisma.workspaceMember.update({
            where: { workspaceId_userId: { workspaceId, userId: targetUserId } },
            data: { role },
            include: { user: { select: { id: true, email: true, displayName: true, avatarUrl: true } } }
        });

        await executeWorkspaceAction(workspaceId, currentUserId, 'MEMBER_ROLE_UPDATED', targetUserId, { newRole: role });
        res.json(updated);
    } catch (error) {
        console.error('Error updating member role:', error);
        res.status(500).json({ error: 'Failed to update role' });
    }
});

// Remove member from workspace
router.delete('/:id/members/:targetUserId', authenticate, async (req: any, res: any) => {
    try {
        const { id: workspaceId, targetUserId } = req.params;
        const currentUserId = req.user.userId || req.user.id;

        const currentMember = await prisma.workspaceMember.findUnique({
            where: { workspaceId_userId: { workspaceId, userId: currentUserId } }
        });
        if (!currentMember || currentMember.role !== 'admin') {
            return res.status(403).json({ error: 'Only admins can remove members' });
        }

        await prisma.workspaceMember.delete({
            where: { workspaceId_userId: { workspaceId, userId: targetUserId } }
        });

        await executeWorkspaceAction(workspaceId, currentUserId, 'MEMBER_REMOVED', targetUserId, {});
        res.status(204).end();
    } catch (error) {
        console.error('Error removing member:', error);
        res.status(500).json({ error: 'Failed to remove member' });
    }
});

// GET shared files for a workspace
router.get('/:id/files', authenticate, async (req: any, res: any) => {
    try {
        const { id: workspaceId } = req.params;
        const userId = req.user.userId || req.user.id;

        const member = await prisma.workspaceMember.findUnique({
            where: { workspaceId_userId: { workspaceId, userId } }
        });
        if (!member) return res.status(403).json({ error: 'Not a member of this workspace' });

        const files = await prisma.file.findMany({
            where: { workspaceId, isDeleted: false },
            orderBy: { createdAt: 'desc' },
            include: {
                owner: { select: { id: true, email: true, displayName: true, firstName: true, lastName: true, avatarUrl: true } },
                analyses: {
                    where: { status: 'completed' },
                    orderBy: { completedAt: 'desc' },
                    take: 1,
                    select: { id: true, completedAt: true, status: true }
                }
            }
        });

        res.json(files.map(f => ({
            ...serializeFile(f),
            hasAnalysis: f.analyses.length > 0,
            latestAnalysisId: f.analyses[0]?.id || null,
            latestAnalysisDate: f.analyses[0]?.completedAt || null
        })));
    } catch (error) {
        console.error('Error fetching workspace files:', error);
        res.status(500).json({ error: 'Failed to fetch workspace files' });
    }
});

// GET shared analyses for a workspace
router.get('/:id/analyses', authenticate, async (req: any, res: any) => {
    try {
        const { id: workspaceId } = req.params;
        const userId = req.user.userId || req.user.id;

        const member = await prisma.workspaceMember.findUnique({
            where: { workspaceId_userId: { workspaceId, userId } }
        });
        if (!member) return res.status(403).json({ error: 'Not a member of this workspace' });

        // Get analyses for files in this workspace OR analyses directly assigned to workspace
        const analyses = await prisma.analysis.findMany({
            where: {
                OR: [
                    { workspaceId },
                    { file: { workspaceId } }
                ],
                status: 'completed'
            },
            orderBy: { completedAt: 'desc' },
            take: 50,
            include: {
                file: { select: { id: true, originalName: true, filename: true, mimeType: true, size: true } },
                createdBy: { select: { id: true, email: true, displayName: true, firstName: true, lastName: true, avatarUrl: true } }
            }
        });

        res.json(analyses);
    } catch (error) {
        console.error('Error fetching workspace analyses:', error);
        res.status(500).json({ error: 'Failed to fetch workspace analyses' });
    }
});

// GET shared dashboards for a workspace
router.get('/:id/dashboards', authenticate, async (req: any, res: any) => {
    try {
        const { id: workspaceId } = req.params;
        const userId = req.user.userId || req.user.id;

        const member = await prisma.workspaceMember.findUnique({
            where: { workspaceId_userId: { workspaceId, userId } }
        });
        if (!member) return res.status(403).json({ error: 'Not a member of this workspace' });

        const dashboards = await prisma.dashboard.findMany({
            where: { workspaceId },
            orderBy: { updatedAt: 'desc' },
            include: {
                user: { select: { id: true, email: true, displayName: true, firstName: true, lastName: true, avatarUrl: true } }
            }
        });

        res.json(dashboards);
    } catch (error) {
        console.error('Error fetching workspace dashboards:', error);
        res.status(500).json({ error: 'Failed to fetch workspace dashboards' });
    }
});

// Share a file to a workspace (assign workspaceId)
router.post('/:id/share-file', authenticate, async (req: any, res: any) => {
    try {
        const { id: workspaceId } = req.params;
        const { fileId } = req.body;
        const userId = req.user.userId || req.user.id;

        const member = await prisma.workspaceMember.findUnique({
            where: { workspaceId_userId: { workspaceId, userId } }
        });
        if (!member || member.role === 'viewer') {
            return res.status(403).json({ error: 'Viewers cannot share files' });
        }

        // Verify user owns the file
        const file = await prisma.file.findFirst({
            where: { id: fileId, ownerId: userId, isDeleted: false }
        });
        if (!file) return res.status(404).json({ error: 'File not found or not owned by you' });

        const updated = await prisma.file.update({
            where: { id: fileId },
            data: { workspaceId }
        });

        await executeWorkspaceAction(workspaceId, userId, 'FILE_SHARED', fileId, {
            filename: file.originalName || file.filename
        });

        res.json(serializeFile(updated));
    } catch (error) {
        console.error('Error sharing file:', error);
        res.status(500).json({ error: 'Failed to share file' });
    }
});

// Unshare a file from a workspace
router.post('/:id/unshare-file', authenticate, async (req: any, res: any) => {
    try {
        const { id: workspaceId } = req.params;
        const { fileId } = req.body;
        const userId = req.user.userId || req.user.id;

        const member = await prisma.workspaceMember.findUnique({
            where: { workspaceId_userId: { workspaceId, userId } }
        });
        if (!member || member.role === 'viewer') {
            return res.status(403).json({ error: 'Viewers cannot unshare files' });
        }

        const file = await prisma.file.findFirst({
            where: { id: fileId, workspaceId, isDeleted: false }
        });
        if (!file) return res.status(404).json({ error: 'File not found in this workspace' });

        // Only owner or workspace admin can unshare
        if (file.ownerId !== userId && member.role !== 'admin') {
            return res.status(403).json({ error: 'Only file owner or workspace admin can unshare' });
        }

        await prisma.file.update({
            where: { id: fileId },
            data: { workspaceId: null }
        });

        await executeWorkspaceAction(workspaceId, userId, 'FILE_UNSHARED', fileId, {
            filename: file.originalName || file.filename
        });

        res.json({ success: true });
    } catch (error) {
        console.error('Error unsharing file:', error);
        res.status(500).json({ error: 'Failed to unshare file' });
    }
});

// ═══════════════════════════════════════════════════════════════
// WORKSPACE MESSAGES WITH @MENTIONS
// ═══════════════════════════════════════════════════════════════

// GET messages for a workspace
router.get('/:id/messages', authenticate, async (req: any, res: any) => {
    try {
        const { id: workspaceId } = req.params;
        const userId = req.user.userId || req.user.id;
        const cursor = req.query.cursor as string | undefined;
        const limit = Math.min(parseInt(req.query.limit as string) || 50, 100);

        const member = await prisma.workspaceMember.findUnique({
            where: { workspaceId_userId: { workspaceId, userId } }
        });
        if (!member) return res.status(403).json({ error: 'Not a member of this workspace' });

        const messages = await prisma.workspaceMessage.findMany({
            where: { workspaceId },
            orderBy: { createdAt: 'desc' },
            take: limit,
            ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
            include: {
                author: { select: { id: true, email: true, displayName: true, firstName: true, lastName: true, avatarUrl: true } }
            }
        });

        res.json({
            messages: messages.reverse(),
            nextCursor: messages.length === limit ? messages[0]?.id : null
        });
    } catch (error) {
        console.error('Error fetching workspace messages:', error);
        res.status(500).json({ error: 'Failed to fetch messages' });
    }
});

// POST a new message (with @mention parsing)
router.post('/:id/messages', authenticate, async (req: any, res: any) => {
    try {
        const { id: workspaceId } = req.params;
        const { content } = req.body;
        const userId = req.user.userId || req.user.id;

        if (!content?.trim()) return res.status(400).json({ error: 'Message content is required' });

        const member = await prisma.workspaceMember.findUnique({
            where: { workspaceId_userId: { workspaceId, userId } }
        });
        if (!member) return res.status(403).json({ error: 'Not a member of this workspace' });

        // Parse @mentions from the message content
        const mentionPattern = /@\[([^\]]+)\]\(([^)]+)\)/g;
        const mentions: string[] = [];
        let match;
        while ((match = mentionPattern.exec(content)) !== null) {
            mentions.push(match[2]); // userId from the mention syntax
        }

        const message = await prisma.workspaceMessage.create({
            data: {
                workspaceId,
                authorId: userId,
                content: content.trim(),
                mentions
            },
            include: {
                author: { select: { id: true, email: true, displayName: true, firstName: true, lastName: true, avatarUrl: true } }
            }
        });

        // Create notifications for mentioned users
        if (mentions.length > 0) {
            const author = await prisma.user.findUnique({ where: { id: userId }, select: { displayName: true, email: true } });
            const authorName = author?.displayName || author?.email?.split('@')[0] || 'Someone';
            const workspace = await prisma.workspace.findUnique({ where: { id: workspaceId }, select: { name: true } });

            await prisma.notification.createMany({
                data: mentions
                    .filter(mentionedId => mentionedId !== userId) // Don't notify self
                    .map(mentionedId => ({
                        userId: mentionedId,
                        title: `${authorName} mentioned you`,
                        message: `You were mentioned in ${workspace?.name || 'a workspace'}: "${content.slice(0, 80)}${content.length > 80 ? '...' : ''}"`,
                        category: 'mention',
                        priority: 'high',
                        source: 'WORKSPACE',
                        iconType: 'at-sign',
                        color: '#8b5cf6',
                        metadata: { workspaceId, messageId: message.id }
                    }))
            });
        }

        // Log to audit
        await executeWorkspaceAction(workspaceId, userId, 'MESSAGE_SENT', message.id, {
            preview: content.slice(0, 50),
            mentionCount: mentions.length
        });

        res.status(201).json(message);
    } catch (error) {
        console.error('Error sending workspace message:', error);
        res.status(500).json({ error: 'Failed to send message' });
    }
});

// DELETE a message (author or admin only)
router.delete('/:id/messages/:messageId', authenticate, async (req: any, res: any) => {
    try {
        const { id: workspaceId, messageId } = req.params;
        const userId = req.user.userId || req.user.id;

        const member = await prisma.workspaceMember.findUnique({
            where: { workspaceId_userId: { workspaceId, userId } }
        });
        if (!member) return res.status(403).json({ error: 'Not a member of this workspace' });

        const message = await prisma.workspaceMessage.findUnique({ where: { id: messageId } });
        if (!message || message.workspaceId !== workspaceId) {
            return res.status(404).json({ error: 'Message not found' });
        }

        if (message.authorId !== userId && member.role !== 'admin') {
            return res.status(403).json({ error: 'Only the author or admin can delete messages' });
        }

        await prisma.workspaceMessage.delete({ where: { id: messageId } });
        res.status(204).end();
    } catch (error) {
        console.error('Error deleting message:', error);
        res.status(500).json({ error: 'Failed to delete message' });
    }
});

// GET workspace members for @mention autocomplete
router.get('/:id/mentionable-users', authenticate, async (req: any, res: any) => {
    try {
        const { id: workspaceId } = req.params;
        const userId = req.user.userId || req.user.id;
        const q = (req.query.q as string || '').toLowerCase();

        const member = await prisma.workspaceMember.findUnique({
            where: { workspaceId_userId: { workspaceId, userId } }
        });
        if (!member) return res.status(403).json({ error: 'Not a member of this workspace' });

        const members = await prisma.workspaceMember.findMany({
            where: { workspaceId },
            include: { user: { select: { id: true, email: true, displayName: true, firstName: true, lastName: true, avatarUrl: true } } }
        });

        let users = members.map(m => m.user);

        if (q) {
            users = users.filter(u =>
                (u.displayName || '').toLowerCase().includes(q) ||
                (u.firstName || '').toLowerCase().includes(q) ||
                (u.lastName || '').toLowerCase().includes(q) ||
                u.email.toLowerCase().includes(q)
            );
        }

        res.json(users);
    } catch (error) {
        console.error('Error fetching mentionable users:', error);
        res.status(500).json({ error: 'Failed to fetch users' });
    }
});

export default router;

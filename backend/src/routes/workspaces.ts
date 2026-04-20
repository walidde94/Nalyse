import { Router } from 'express';
import { prisma } from '../config/database';
import { authenticate } from '../middleware/auth';
import { executeWorkspaceAction, broadcastMessage } from '../services/workspaceService';
import { AppDataSource } from '../config/database';
import { File } from '../entities/File';
import { AiService } from '../services/aiService';

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
        
        // 1. Get user's org info
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { organizationId: true }
        });

        if (!user || !user.organizationId) {
            return res.json([]); // No org, no workspaces
        }

        // 2. Fetch ALL workspaces for this organization
        const workspaces = await prisma.workspace.findMany({
            where: {
                organizationId: user.organizationId
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
    } catch (error: any) {
        console.error('Error fetching activity:', error);
        res.status(500).json({ 
            error: 'Failed to fetch activity',
            details: error.message 
        });
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

        const files = await AppDataSource.getRepository(File)
            .createQueryBuilder('file')
            .leftJoinAndSelect('file.owner', 'owner')
            .leftJoin('analyses', 'a', 'a."fileId" = file.id AND a.status = :status', { status: 'completed' })
            .addSelect('CASE WHEN a.id IS NOT NULL THEN true ELSE false END', 'has_analysis')
            .addSelect('a."completedAt"', 'analysis_completed_at')
            .where('file.workspaceId = :workspaceId AND file.isDeleted = false', { workspaceId })
            .orderBy('file.createdAt', 'DESC')
            .getRawAndEntities();

        const enriched = files.entities.map(f => {
            const raw = files.raw.find(r => r.file_id === f.id);
            const hasAnalysis = raw?.has_analysis === true || raw?.has_analysis === 't' || raw?.has_analysis === '1' || raw?.has_analysis === 1;
            
            return {
                id: f.id,
                filename: f.filename,
                originalName: f.originalName,
                size: f.size != null ? f.size.toString() : '0',
                mimeType: f.mimeType,
                createdAt: f.createdAt,
                updatedAt: f.updatedAt,
                isFavorite: f.isFavorite,
                isArchived: f.isArchived,
                isProcessed: f.isProcessed || hasAnalysis,
                groupId: f.groupId,
                workspaceId: f.workspaceId,
                checksum: f.checksum,
                owner: f.owner ? { id: f.owner.id, email: f.owner.email, displayName: f.owner.displayName, firstName: f.owner.firstName, lastName: f.owner.lastName, avatarUrl: f.owner.avatarUrl } : null,
                hasAnalysis: hasAnalysis,
                latestAnalysisDate: raw?.analysis_completed_at || null
            };
        });

        res.json(enriched);
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
                file: { workspaceId },
                status: 'completed'
            },
            orderBy: { completedAt: 'desc' },
            take: 50,
            include: {
                file: { select: { id: true, originalName: true, filename: true, mimeType: true, size: true } },
                createdBy: { select: { id: true, email: true, displayName: true, firstName: true, lastName: true, avatarUrl: true } }
            }
        });
        const mappedAnalyses = analyses.map(a => ({
            ...a,
            file: a.file ? {
                ...a.file,
                size: a.file.size != null ? a.file.size.toString() : '0'
            } : null
        }));

        res.json(mappedAnalyses);
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

        // Verify user is in the same organization as the workspace
        const user = await prisma.user.findUnique({ where: { id: userId }, select: { organizationId: true } });
        const workspace = await prisma.workspace.findUnique({ where: { id: workspaceId }, select: { organizationId: true } });

        if (!user || !workspace || user.organizationId !== workspace.organizationId) {
            return res.status(403).json({ error: 'Unauthorized: Not a member of this organization' });
        }

        const messages = await prisma.workspaceMessage.findMany({
            where: { workspaceId },
            orderBy: { createdAt: 'desc' },
            take: limit,
            ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
            include: {
                author: { select: { id: true, email: true, displayName: true, firstName: true, lastName: true, avatarUrl: true } },
                replyTo: { select: { id: true, content: true, author: { select: { displayName: true, email: true } } } }
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
        const { content, replyToId } = req.body;
        const userId = req.user.userId || req.user.id;

        if (!content?.trim()) return res.status(400).json({ error: 'Message content is required' });

        const member = await prisma.workspaceMember.findUnique({
            where: { workspaceId_userId: { workspaceId, userId } }
        });
        if (!member) return res.status(403).json({ error: 'Not a member of this workspace' });

        // Parse @mentions from the message content (only for user notifications)
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
                replyToId: replyToId || null,
                mentions
            },
            include: {
                author: { select: { id: true, email: true, displayName: true, firstName: true, lastName: true, avatarUrl: true } },
                replyTo: { select: { id: true, content: true, author: { select: { displayName: true, email: true } } } }
            }
        });

        // 1. Instantly Broadcast to real-time socket
        broadcastMessage(workspaceId, message);

        // 2. Create notifications for mentioned users (wrapped in try/catch to prevent 500 errors if DB is out of sync)
        if (mentions.length > 0) {
            try {
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
            } catch (notifyErr) {
                console.error('[Non-Fatal Error] Failed to create notifications for mentions:', notifyErr);
            }
        }

        // Log to audit
        await executeWorkspaceAction(workspaceId, userId, 'MESSAGE_SENT', message.id, {
            preview: content.slice(0, 50),
            mentionCount: mentions.length
        });

        res.status(201).json(message);
    } catch (error: any) {
        console.error('Error sending workspace message:', error);
        // require('fs').writeFileSync('./scratch_debug.log', error.stack || error.toString()); // Removed hardcoded local path
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

// Add/Toggle reaction on a message
router.post('/:id/messages/:messageId/react', authenticate, async (req: any, res: any) => {
    try {
        const { id: workspaceId, messageId } = req.params;
        const { emoji } = req.body;
        const userId = req.user.userId || req.user.id;

        if (!emoji) return res.status(400).json({ error: 'Emoji is required' });

        const member = await prisma.workspaceMember.findUnique({
            where: { workspaceId_userId: { workspaceId, userId } }
        });
        if (!member) return res.status(403).json({ error: 'Not a member of this workspace' });

        const message = await prisma.workspaceMessage.findUnique({
            where: { id: messageId }
        });
        if (!message || message.workspaceId !== workspaceId) {
            return res.status(404).json({ error: 'Message not found' });
        }

        let reactions = (message.reactions as any[]) || [];
        const existingEmojiIndex = reactions.findIndex(r => r.emoji === emoji);

        if (existingEmojiIndex > -1) {
            const userIndex = reactions[existingEmojiIndex].userIds.indexOf(userId);
            if (userIndex > -1) {
                // Remove user from this emoji (Toggle off)
                reactions[existingEmojiIndex].userIds.splice(userIndex, 1);
                // If no more users, remove the emoji entry entirely
                if (reactions[existingEmojiIndex].userIds.length === 0) {
                    reactions.splice(existingEmojiIndex, 1);
                }
            } else {
                // Add user to existing emoji
                reactions[existingEmojiIndex].userIds.push(userId);
            }
        } else {
            // New emoji reaction
            reactions.push({ emoji, userIds: [userId] });
        }

        const updated = await prisma.workspaceMessage.update({
            where: { id: messageId },
            data: { reactions },
            include: {
                author: { select: { id: true, email: true, displayName: true, firstName: true, lastName: true, avatarUrl: true } },
                replyTo: { select: { id: true, content: true, author: { select: { displayName: true, email: true } } } }
            }
        });

        // Broadcast updated message to all members to trigger refresh
        broadcastMessage(workspaceId, updated);

        res.json(updated);
    } catch (error) {
        console.error('Error toggling reaction:', error);
        res.status(500).json({ error: 'Failed to toggle reaction' });
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

        // NEW GENERIC LOGIC: Fetch the workspace to get its organizationId
        const workspace = await prisma.workspace.findUnique({
            where: { id: workspaceId },
            select: { organizationId: true }
        });

        if (!workspace) return res.status(404).json({ error: 'Workspace not found' });

        // Fetch ALL users in the same organization
        let users = await prisma.user.findMany({
            where: {
                organizationId: workspace.organizationId,
                isActive: true
            },
            select: { id: true, email: true, displayName: true, firstName: true, lastName: true, avatarUrl: true }
        });

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

// POST an Agent Task
router.post('/:id/agent-task', authenticate, async (req: any, res: any) => {
    try {
        const { id: workspaceId } = req.params;
        const { input } = req.body;
        const userId = req.user.userId || req.user.id;

        if (!input?.trim()) return res.status(400).json({ error: 'Input is required' });

        const member = await prisma.workspaceMember.findUnique({
            where: { workspaceId_userId: { workspaceId, userId } }
        });
        if (!member) return res.status(403).json({ error: 'Not a member of this workspace' });

        // 1. Ensure Agent User exists
        let agentUser = await prisma.user.findUnique({ where: { email: 'agent@nalyse.app' } });
        if (!agentUser) {
            agentUser = await prisma.user.create({
                data: {
                    email: 'agent@nalyse.app',
                    passwordHash: 'system_generated',
                    displayName: 'Nalyse Agent',
                    role: 'system',
                    avatarUrl: 'https://api.dicebear.com/7.x/bottts/svg?seed=nalyse-agent&backgroundColor=8b5cf6'
                }
            });
            // Ensure agent is in the workspace
            await prisma.workspaceMember.create({
                data: { workspaceId, userId: agentUser.id, role: 'editor' }
            });
        } else {
            // Check if agent is already a member
            const agentMember = await prisma.workspaceMember.findUnique({
                where: { workspaceId_userId: { workspaceId, userId: agentUser.id } }
            });
            if (!agentMember) {
                await prisma.workspaceMember.create({
                    data: { workspaceId, userId: agentUser.id, role: 'editor' }
                });
            }
        }

        // 2. Add the User's command message
        const userMessage = await prisma.workspaceMessage.create({
            data: {
                workspaceId,
                authorId: userId,
                content: input.trim(),
            },
            include: {
                author: { select: { id: true, email: true, displayName: true, firstName: true, lastName: true, avatarUrl: true } },
                replyTo: { select: { id: true, content: true, author: { select: { displayName: true, email: true } } } }
            }
        });
        broadcastMessage(workspaceId, userMessage);
        
        res.status(202).json({ success: true, message: 'Agent task started' });

        // 3. Process visual agent response asynchronously
        const fileMatch = input.match(/#\[([^\]]+)\]\(([^)]+)\)/);
        let contentResponse = '';

        if (fileMatch) {
            const fileName = fileMatch[1];
            const fileId = fileMatch[2];
            
            try {
                const aiService = new AiService();
                const file = await prisma.file.findUnique({ where: { id: fileId } });
                contentResponse = await aiService.analyzeContext(`User requested analysis. Command: ${input}`, { fileName, status: file?.status, size: file?.size?.toString() });
            } catch (aiErr) {
               console.error('AI Service Error:', aiErr);
               contentResponse = `I attempted to analyze **${fileName}**, but encountered an error connecting to the neural core. Please try again.`;
            }
        } else {
            contentResponse = `I am the Nalyse Neural Agent. Please mention a file using \`#\` so I can analyze it for you! Examples: \`/analyze #[Sales.csv] find anomalies\``;
        }

        // Wait a bit for "thinking" effect
        setTimeout(async () => {
            try {
                const agentMessage = await prisma.workspaceMessage.create({
                    data: {
                        workspaceId,
                        authorId: agentUser!.id,
                        content: contentResponse,
                        replyToId: userMessage.id
                    },
                    include: {
                        author: { select: { id: true, email: true, displayName: true, firstName: true, lastName: true, avatarUrl: true } },
                        replyTo: { select: { id: true, content: true, author: { select: { displayName: true, email: true } } } }
                    }
                });
                broadcastMessage(workspaceId, agentMessage);
            } catch (error) {
                console.error('Failed to save agent message block:', error);
            }
        }, 1500);

    } catch (error) {
        console.error('Error starting agent task:', error);
        if (!res.headersSent) {
            res.status(500).json({ error: 'Failed to start agent task' });
        }
    }
});

export default router;

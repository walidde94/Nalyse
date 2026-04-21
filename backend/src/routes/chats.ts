import { Router } from 'express';
import { prisma } from '../config/database';
import { authenticate } from '../middleware/auth';
import { broadcastDirectMessage } from '../services/chatService';
import { upload } from '../middleware/upload';
import path from 'path';

const router = Router();

// GET current conversations for the authenticated user
router.get('/', authenticate, async (req: any, res: any) => {
    try {
        const userId = req.user.userId || req.user.id;

        const conversations = await prisma.directConversation.findMany({
            where: {
                participants: {
                    some: { id: userId }
                }
            },
            include: {
                participants: {
                    where: { id: { not: userId } },
                    select: { id: true, email: true, displayName: true, firstName: true, lastName: true, avatarUrl: true }
                },
                messages: {
                    orderBy: { createdAt: 'desc' },
                    take: 1,
                    include: {
                        sender: { select: { id: true, displayName: true } }
                    }
                }
            },
            orderBy: { updatedAt: 'desc' }
        });

        res.json(conversations);
    } catch (error) {
        console.error('Error fetching conversations:', error);
        res.status(500).json({ error: 'Failed to fetch conversations' });
    }
});

// POST to start or get a conversation with another user
router.post('/', authenticate, async (req: any, res: any) => {
    try {
        const { targetUserId } = req.body;
        const userId = req.user.userId || req.user.id;

        if (!targetUserId) return res.status(400).json({ error: 'Target user ID is required' });
        if (targetUserId === userId) return res.status(400).json({ error: 'Cannot chat with yourself' });

        // Check if conversation already exists
        let conversation = await prisma.directConversation.findFirst({
            where: {
                AND: [
                    { participants: { some: { id: userId } } },
                    { participants: { some: { id: targetUserId } } }
                ]
            },
            include: {
                participants: {
                    where: { id: { not: userId } },
                    select: { id: true, email: true, displayName: true, firstName: true, lastName: true, avatarUrl: true }
                },
                messages: {
                    orderBy: { createdAt: 'desc' },
                    take: 1,
                    include: {
                        sender: { select: { id: true, displayName: true } }
                    }
                }
            }
        });

        if (!conversation) {
            conversation = await prisma.directConversation.create({
                data: {
                    participants: {
                        connect: [{ id: userId }, { id: targetUserId }]
                    }
                },
                include: {
                    participants: {
                        where: { id: { not: userId } },
                        select: { id: true, email: true, displayName: true, firstName: true, lastName: true, avatarUrl: true }
                    },
                    messages: {
                        orderBy: { createdAt: 'desc' },
                        take: 1,
                        include: {
                            sender: { select: { id: true, displayName: true } }
                        }
                    }
                }
            });
        }

        res.json(conversation);
    } catch (error) {
        console.error('Error creating/finding conversation:', error);
        res.status(500).json({ error: 'Failed to manage conversation' });
    }
});

// GET messages for a conversation
router.get('/:id/messages', authenticate, async (req: any, res: any) => {
    try {
        const { id: conversationId } = req.params;
        const userId = req.user.userId || req.user.id;
        const cursor = req.query.cursor as string | undefined;
        const limit = Math.min(parseInt(req.query.limit as string) || 50, 100);

        // Verify participation
        const conversation = await prisma.directConversation.findFirst({
            where: {
                id: conversationId,
                participants: { some: { id: userId } }
            }
        });
        if (!conversation) return res.status(403).json({ error: 'Unauthorized Access' });

        const messages = await prisma.directMessage.findMany({
            where: { conversationId },
            orderBy: { createdAt: 'desc' },
            take: limit,
            ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
            include: {
                sender: { select: { id: true, email: true, displayName: true, firstName: true, lastName: true, avatarUrl: true } },
                replyTo: { select: { id: true, content: true, sender: { select: { displayName: true } } } }
            }
        });

        res.json({
            messages: messages.reverse(),
            nextCursor: messages.length === limit ? messages[0]?.id : null
        });
    } catch (error) {
        console.error('Error fetching chat messages:', error);
        res.status(500).json({ error: 'Failed to fetch messages' });
    }
});

// POST a new message
router.post('/:id/messages', authenticate, async (req: any, res: any) => {
    try {
        const { id: conversationId } = req.params;
        const { content, imageUrl } = req.body;
        const userId = req.user.userId || req.user.id;

        if (!content?.trim() && !imageUrl) return res.status(400).json({ error: 'Message content or image is required' });

        // Verify participation
        const conversation = await prisma.directConversation.findFirst({
            where: {
                id: conversationId,
                participants: { some: { id: userId } }
            }
        });
        if (!conversation) return res.status(403).json({ error: 'Unauthorized Access' });

        const message = await prisma.directMessage.create({
            data: {
                conversationId,
                senderId: userId,
                content: content?.trim() || '',
                imageUrl: imageUrl || null,
                replyToId: req.body.replyToId || null
            },
            include: {
                sender: { select: { id: true, email: true, displayName: true, firstName: true, lastName: true, avatarUrl: true } },
                replyTo: { select: { id: true, content: true, sender: { select: { displayName: true } } } }
            }
        });

        // Update conversation updatedAt for sorting
        await prisma.directConversation.update({
            where: { id: conversationId },
            data: { updatedAt: new Date() }
        });

        // Broadcast to socket
        broadcastDirectMessage(conversationId, 'new_message', message);

        // Create notification for other participant(s)
        const chat = await prisma.directConversation.findUnique({
            where: { id: conversationId },
            include: { participants: true }
        });
        const sender = chat?.participants.find(p => p.id === userId);
        const senderName = sender?.displayName || sender?.email?.split('@')[0] || 'Someone';

        const otherParticipants = chat?.participants.filter(p => p.id !== userId) || [];
        if (otherParticipants.length > 0) {
            await prisma.notification.createMany({
                data: otherParticipants.map(p => ({
                    userId: p.id,
                    title: `New message from ${senderName}`,
                    message: content ? (content.length > 60 ? content.slice(0, 60) + '...' : content) : 'Sent an image',
                    category: 'chat',
                    priority: 'medium',
                    source: 'CHAT',
                    iconType: 'message-square',
                    color: '#6366f1',
                    metadata: { conversationId, messageId: message.id }
                }))
            });
        }

        res.status(201).json(message);
    } catch (error) {
        console.error('Error sending message:', error);
        res.status(500).json({ error: 'Failed to send message' });
    }
});

// PATCH to edit a message
router.patch('/messages/:messageId', authenticate, async (req: any, res: any) => {
    try {
        const { messageId } = req.params;
        const { content } = req.body;
        const userId = req.user.userId || req.user.id;

        const message = await prisma.directMessage.findUnique({ where: { id: messageId } });
        if (!message) return res.status(404).json({ error: 'Message not found' });
        if (message.senderId !== userId) return res.status(403).json({ error: 'Unauthorized: You can only edit your own messages' });

        const updated = await prisma.directMessage.update({
            where: { id: messageId },
            data: { content, isEdited: true },
            include: { sender: { select: { id: true, email: true, displayName: true, firstName: true, lastName: true, avatarUrl: true } } }
        });

        broadcastDirectMessage(message.conversationId, 'message_updated', updated);
        res.json(updated);
    } catch (error) {
        console.error('Error editing message:', error);
        res.status(500).json({ error: 'Failed to edit message' });
    }
});

// DELETE to soft delete a message
router.delete('/messages/:messageId', authenticate, async (req: any, res: any) => {
    try {
        const { messageId } = req.params;
        const userId = req.user.userId || req.user.id;

        const message = await prisma.directMessage.findUnique({ where: { id: messageId } });
        if (!message) return res.status(404).json({ error: 'Message not found' });
        if (message.senderId !== userId) return res.status(403).json({ error: 'Unauthorized' });

        const updated = await prisma.directMessage.update({
            where: { id: messageId },
            data: { isDeleted: true, content: 'This message was deleted', imageUrl: null },
            include: { sender: { select: { id: true, email: true, displayName: true, firstName: true, lastName: true, avatarUrl: true } } }
        });

        broadcastDirectMessage(message.conversationId, 'message_deleted', { id: messageId });
        res.json(updated);
    } catch (error) {
        console.error('Error deleting message:', error);
        res.status(500).json({ error: 'Failed to delete message' });
    }
});

// POST to react to a message
router.post('/messages/:messageId/react', authenticate, async (req: any, res: any) => {
    try {
        const { messageId } = req.params;
        const { emoji } = req.body;
        const userId = req.user.userId || req.user.id;

        if (!emoji) return res.status(400).json({ error: 'Emoji is required' });

        const message = await prisma.directMessage.findUnique({ where: { id: messageId } });
        if (!message) return res.status(404).json({ error: 'Message not found' });

        let reactions = (message.reactions as any[]) || [];
        const existingEmojiIndex = reactions.findIndex(r => r.emoji === emoji);

        if (existingEmojiIndex > -1) {
            const userIndex = reactions[existingEmojiIndex].userIds.indexOf(userId);
            if (userIndex > -1) {
                // Remove user from this emoji (Toggle off)
                reactions[existingEmojiIndex].userIds.splice(userIndex, 1);
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

        const updated = await prisma.directMessage.update({
            where: { id: messageId },
            data: { reactions },
            include: { sender: { select: { id: true, email: true, displayName: true, firstName: true, lastName: true, avatarUrl: true } } }
        });

        broadcastDirectMessage(message.conversationId, 'message_updated', updated);
        res.json(updated);
    } catch (error) {
        console.error('Error toggling reaction:', error);
        res.status(500).json({ error: 'Failed to toggle reaction' });
    }
});

// GET users for global discovery search
router.get('/search-users', authenticate, async (req: any, res: any) => {
    try {
        const q = (req.query.q as string || '').toLowerCase();
        const userId = req.user.userId || req.user.id;

        if (!q || q.length < 2) return res.json([]);

        const users = await prisma.user.findMany({
            where: {
                AND: [
                    { id: { not: userId } },
                    { isActive: true },
                    {
                        OR: [
                            { email: { contains: q, mode: 'insensitive' } },
                            { displayName: { contains: q, mode: 'insensitive' } },
                            { firstName: { contains: q, mode: 'insensitive' } },
                            { lastName: { contains: q, mode: 'insensitive' } }
                        ]
                    }
                ]
            },
            select: { id: true, email: true, displayName: true, firstName: true, lastName: true, avatarUrl: true },
            take: 10
        });

        res.json(users);
    } catch (error) {
        console.error('Error searching users:', error);
        res.status(500).json({ error: 'Failed to search users' });
    }
});

// POST to upload chat image
router.post('/upload-image', authenticate, upload.single('image'), async (req: any, res: any) => {
    try {
        if (!req.file) return res.status(400).json({ error: 'No image uploaded' });
        
        // Return URL for the image
        // Assuming static serving of /uploads is set up in app.ts
        const imageUrl = `/uploads/${req.file.filename}`;
        res.json({ imageUrl });
    } catch (error) {
        console.error('Error uploading chat image:', error);
        res.status(500).json({ error: 'Failed to upload image' });
    }
});

export default router;

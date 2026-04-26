import { Router } from 'express';
import { prisma } from '../config/database';
import { authenticate, AuthRequest } from '../middleware/auth';
import { broadcastCommentUpdate } from '../services/commentService';


const router = Router();

const authorSelect = {
    id: true, email: true, firstName: true, lastName: true,
    displayName: true, avatarUrl: true,
};

// GET all comments for an analysis
router.get('/:analysisId', authenticate, async (req: AuthRequest, res) => {
    try {
        const where: any = { analysisId: req.params.analysisId };
        if (req.query.targetType) where.targetType = String(req.query.targetType);
        if (req.query.targetId) where.targetId = String(req.query.targetId);

        const comments = await prisma.analysisComment.findMany({
            where,
            include: {
                author: { select: authorSelect },
                replies: {
                    include: { author: { select: authorSelect } },
                    orderBy: { createdAt: 'asc' as const }
                }
            },
            orderBy: { createdAt: 'desc' as const }
        });
        res.json(comments.filter(c => !c.replyToId));
    } catch (err: any) {
        res.status(500).json({ error: 'Failed to fetch comments' });
    }
});

// POST create comment
router.post('/', authenticate, async (req: AuthRequest, res) => {
    try {
        const { analysisId, content, targetType, targetId, replyToId } = req.body;
        if (!analysisId || !content || !targetType)
            return res.status(400).json({ error: 'analysisId, content, targetType required' });

        const comment = await prisma.analysisComment.create({
            data: {
                analysisId, content, targetType,
                authorId: req.user!.userId,
                targetId: targetId || null,
                replyToId: replyToId || null,
            },
            include: {
                author: { select: authorSelect },
                replies: { include: { author: { select: authorSelect } } }
            }
        });
        res.status(201).json(comment);
        broadcastCommentUpdate(analysisId, 'comment_created', comment);

    } catch (err: any) {
        res.status(500).json({ error: 'Failed to create comment' });
    }
});

// PATCH update comment
router.patch('/:id', authenticate, async (req: AuthRequest, res) => {
    try {
        const { content, isResolved, reactions } = req.body;
        const data: any = {};
        if (content !== undefined) data.content = content;
        if (isResolved !== undefined) data.isResolved = isResolved;
        if (reactions !== undefined) data.reactions = reactions;

        const updated = await prisma.analysisComment.update({
            where: { id: String(req.params.id) }, data,
            include: { author: { select: authorSelect } }
        });
        res.json(updated);
        broadcastCommentUpdate(updated.analysisId, 'comment_updated', updated);

    } catch (err: any) {
        res.status(500).json({ error: 'Failed to update comment' });
    }
});

// DELETE comment
router.delete('/:id', authenticate, async (req: AuthRequest, res) => {
    try {
        const existing = await prisma.analysisComment.findUnique({ where: { id: String(req.params.id) } });
        if (!existing) return res.status(404).json({ error: 'Not found' });
        if (existing.authorId !== req.user!.userId && req.user!.role !== 'admin')
            return res.status(403).json({ error: 'Not authorized' });
        await prisma.analysisComment.delete({ where: { id: String(req.params.id) } });
        broadcastCommentUpdate(existing.analysisId, 'comment_deleted', { id: req.params.id });
        res.json({ success: true });

    } catch (err: any) {
        res.status(500).json({ error: 'Failed to delete comment' });
    }
});

// GET comment counts
router.get('/:analysisId/counts', authenticate, async (req: AuthRequest, res) => {
    try {
        const comments = await prisma.analysisComment.findMany({
            where: { analysisId: String(req.params.analysisId) },
            select: { targetType: true, targetId: true }
        });
        const counts: Record<string, number> = {};
        comments.forEach(c => {
            const key = c.targetId ? `${c.targetType}:${c.targetId}` : c.targetType;
            counts[key] = (counts[key] || 0) + 1;
        });
        res.json(counts);
    } catch (err: any) {
        res.status(500).json({ error: 'Failed to fetch counts' });
    }
});

export default router;

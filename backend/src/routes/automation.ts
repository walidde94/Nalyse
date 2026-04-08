import { Router, Response } from 'express';
import { authenticate, AuthRequest } from '../middleware/auth';
import { requirePermission, Permission } from '../middleware/rbac';
import { prisma } from '../config/database';

const router = Router();

// ==========================================
// SCHEDULES
// ==========================================

router.get('/schedules', authenticate, requirePermission(Permission.READ_ANALYSIS), async (req: AuthRequest, res: Response) => {
    try {
        const schedules = await prisma.schedule.findMany({
            where: { organizationId: req.user!.organizationId },
            include: { targetFile: true }
        });
        res.json(schedules);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to find schedules' });
    }
});

router.post('/schedules', authenticate, requirePermission(Permission.CREATE_ANALYSIS), async (req: AuthRequest, res: Response) => {
    try {
        const { name, cronExpression, targetFileId, config, isActive } = req.body;

        const schedule = await prisma.schedule.create({
            data: {
                name,
                cronExpression,
                targetFileId: targetFileId || null,
                config,
                isActive: isActive ?? true,
                organizationId: req.user!.organizationId!,
                createdByUserId: req.user!.userId!
            }
        });

        res.status(201).json(schedule);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to create schedule' });
    }
});

router.put('/schedules/:id', authenticate, requirePermission(Permission.UPDATE_ANALYSIS), async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const existing = await prisma.schedule.findFirst({ where: { id: req.params.id as string, organizationId: req.user!.organizationId } });

        if (!existing) {
            res.status(404).json({ error: 'Schedule not found' });
            return;
        }

        const schedule = await prisma.schedule.update({
            where: { id: existing.id },
            data: req.body
        });

        res.json(schedule);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to update schedule' });
    }
});

router.delete('/schedules/:id', authenticate, requirePermission(Permission.DELETE_ANALYSIS), async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const existing = await prisma.schedule.findFirst({ where: { id: req.params.id as string, organizationId: req.user!.organizationId } });

        if (!existing) {
            res.status(404).json({ error: 'Schedule not found' });
            return;
        }

        await prisma.schedule.delete({ where: { id: existing.id } });
        res.status(204).send();
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to delete schedule' });
    }
});

// ==========================================
// WEBHOOKS
// ==========================================

router.get('/webhooks', authenticate, requirePermission(Permission.MANAGE_ORG), async (req: AuthRequest, res: Response) => {
    try {
        const webhooks = await prisma.webhook.findMany({ where: { organizationId: req.user!.organizationId } });
        res.json(webhooks);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to fetch webhooks' });
    }
});

router.post('/webhooks', authenticate, requirePermission(Permission.MANAGE_ORG), async (req: AuthRequest, res: Response) => {
    try {
        const { name, url, secret, events, isActive } = req.body;

        const webhook = await prisma.webhook.create({
            data: {
                name,
                url,
                secret,
                events: events || ['analysis.completed'],
                isActive: isActive ?? true,
                organizationId: req.user!.organizationId!,
                createdByUserId: req.user!.userId!
            }
        });

        res.status(201).json(webhook);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to create webhook' });
    }
});

router.delete('/webhooks/:id', authenticate, requirePermission(Permission.MANAGE_ORG), async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const existing = await prisma.webhook.findFirst({ where: { id: req.params.id as string, organizationId: req.user!.organizationId } });

        if (!existing) {
            res.status(404).json({ error: 'Webhook not found' });
            return;
        }

        await prisma.webhook.delete({ where: { id: existing.id } });
        res.status(204).send();
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to delete webhook' });
    }
});



export default router;

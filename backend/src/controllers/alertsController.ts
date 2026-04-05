import { Request, Response } from 'express';
import { prisma } from '../config/database';

// Helper to determine org context from the request
const getOrgId = (req: any) => {
    // We expect the auth middleware to attach user to req
    return req.user?.organizationId;
};

const getUserId = (req: any) => {
    return req.user?.userId;
};

export const createAlertRule = async (req: Request, res: Response) => {
    try {
        const { name, metric, operator, threshold, window, actions } = req.body;
        const orgId = getOrgId(req);
        const userId = getUserId(req);

        if (!orgId || !userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const newRule = await prisma.alertRule.create({
            data: {
                name,
                metric,
                operator,
                threshold: Number(threshold),
                window,
                actions: actions || {},
                isActive: true,
                organizationId: orgId,
                createdByUserId: userId
            }
        });

        res.status(201).json(newRule);
    } catch (error) {
        console.error('Error creating alert rule:', error);
        res.status(500).json({ error: 'Failed to create alert rule' });
    }
};

export const getAlertRules = async (req: Request, res: Response) => {
    try {
        const orgId = getOrgId(req);
        if (!orgId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const rules = await prisma.alertRule.findMany({
            where: { organizationId: orgId },
            orderBy: { createdAt: 'desc' },
        });

        res.json(rules);
    } catch (error) {
        console.error('Error fetching alert rules:', error);
        res.status(500).json({ error: 'Failed to fetch alert rules' });
    }
};

export const toggleAlertRule = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const orgId = getOrgId(req);

        const rule = await prisma.alertRule.findUnique({ where: { id: String(id) } });
        if (!rule || rule.organizationId !== orgId) {
            return res.status(404).json({ error: 'Rule not found' });
        }

        const updated = await prisma.alertRule.update({
            where: { id: rule.id },
            data: { isActive: !rule.isActive }
        });

        res.json(updated);
    } catch (error) {
        console.error('Error toggling alert rule:', error);
        res.status(500).json({ error: 'Failed to toggle alert rule' });
    }
};

export const deleteAlertRule = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const orgId = getOrgId(req);

        const rule = await prisma.alertRule.findUnique({ where: { id: String(id) } });
        if (!rule || rule.organizationId !== orgId) {
            return res.status(404).json({ error: 'Rule not found' });
        }

        await prisma.alertRule.delete({ where: { id: rule.id } });
        res.json({ success: true });
    } catch (error) {
        console.error('Error deleting alert rule:', error);
        res.status(500).json({ error: 'Failed to delete alert rule' });
    }
};

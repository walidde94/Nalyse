import { Router } from 'express';
import { prisma } from '../config/database';
import { authenticate } from '../middleware/auth';
import { executeWorkspaceAction } from '../services/workspaceService';

const router = Router();

// GET all workspaces for the authenticated user
router.get('/', authenticate, async (req: any, res: any) => {
    try {
        const userId = req.user.id;
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

// GET recent activity (Audit Logs) for a workspace
router.get('/:id/activity', authenticate, async (req: any, res: any) => {
    try {
        const { id: workspaceId } = req.params;
        const userId = req.user.id;

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
        const userId = req.user.id;

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

export default router;

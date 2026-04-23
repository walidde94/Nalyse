import { Router } from 'express';
import { authenticate, AuthRequest } from '../middleware/auth';
import { requireSystemAdmin } from '../middleware/rbac';
import { prisma } from '../config/database';
import { Response } from 'express';

const router = Router();

// Apply authentication and system admin check to all routes in this router
router.use(authenticate);
router.use(requireSystemAdmin());

// 1. Platform Overview Dashboard
router.get('/stats', async (req: AuthRequest, res: Response) => {
    try {
        const totalOrganizations = await prisma.organization.count();
        const totalUsers = await prisma.user.count();
        const activeWorkspaces = await prisma.workspace.count();
        const datasetsProcessed = await prisma.file.count();
        const dashboardsCreated = await prisma.dashboard.count();
        const apiUsage = 0; // Placeholder for API usage
        const aiAnalysisJobs = await prisma.analysis.count();
        
        // System Health Mock
        const systemHealthStatus = 'healthy';

        res.json({
            totalOrganizations,
            totalUsers,
            activeWorkspaces,
            datasetsProcessed,
            dashboardsCreated,
            apiUsage,
            aiAnalysisJobs,
            systemHealthStatus,
        });
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch stats' });
    }
});

// 2. Organization Management
router.get('/organizations', async (req: AuthRequest, res: Response) => {
    try {
        const orgs = await prisma.organization.findMany({
            include: {
                _count: {
                    select: { users: true, workspaces: true }
                }
            }
        });
        res.json(orgs);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch organizations' });
    }
});

router.post('/organizations/:id/suspend', async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        const org = await prisma.organization.update({
            where: { id },
            data: { isActive: false }
        });
        res.json(org);
    } catch (error) {
        res.status(500).json({ error: 'Failed to suspend organization' });
    }
});

// 3. Global User Management
router.get('/users', async (req: AuthRequest, res: Response) => {
    try {
        const users = await prisma.user.findMany({
            select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
                role: true,
                isActive: true,
                lastLoginAt: true,
                organization: {
                    select: { name: true }
                }
            }
        });
        res.json(users);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch users' });
    }
});

router.post('/users/:id/role', async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        const { role } = req.body;
        const user = await prisma.user.update({
            where: { id },
            data: { role }
        });
        res.json(user);
    } catch (error) {
        res.status(500).json({ error: 'Failed to update user role' });
    }
});

// 4. Workspace Monitoring
router.get('/workspaces', async (req: AuthRequest, res: Response) => {
    try {
        const workspaces = await prisma.workspace.findMany({
            include: {
                organization: { select: { name: true } },
                _count: { select: { members: true, dashboards: true, files: true } }
            }
        });
        res.json(workspaces);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch workspaces' });
    }
});

// 7. Security & Audit Logs
router.get('/audit-logs', async (req: AuthRequest, res: Response) => {
    try {
        const logs = await prisma.auditLog.findMany({
            orderBy: { createdAt: 'desc' },
            take: 100,
            include: {
                user: { select: { email: true } },
                workspace: { select: { name: true } }
            }
        });
        res.json(logs);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch audit logs' });
    }
});

export default router;

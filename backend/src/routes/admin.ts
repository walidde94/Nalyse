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
        // 1. Fetch organizations without complex includes that might crash the engine
        const orgs = await prisma.organization.findMany({
            orderBy: { createdAt: 'desc' }
        });
        
        // 2. Safely fetch counts for each organization
        // We do this in parallel to maintain performance
        const serializedOrgs = await Promise.all(orgs.map(async (org) => {
            try {
                const userCount = await prisma.user.count({ 
                    where: { organizationId: org.id } 
                });
                const workspaceCount = await prisma.workspace.count({ 
                    where: { organizationId: org.id } 
                });

                return {
                    ...org,
                    storageUsed: org.storageUsed?.toString() || '0',
                    storageLimit: org.storageLimit?.toString() || '104857600',
                    _count: {
                        users: userCount,
                        workspaces: workspaceCount
                    }
                };
            } catch (err: any) {
                console.warn(`[Admin API] Failed to fetch counts for org ${org.id}:`, err.message);
                return {
                    ...org,
                    storageUsed: org.storageUsed?.toString() || '0',
                    storageLimit: org.storageLimit?.toString() || '104857600',
                    _count: { users: 0, workspaces: 0 }
                };
            }
        }));
        
        res.json(serializedOrgs);
    } catch (error: any) {
        console.error('[Admin API] Critical error fetching organizations:', error);
        res.status(500).json({ 
            error: 'Failed to fetch organizations', 
            details: error?.message || String(error),
            stack: process.env.NODE_ENV === 'development' ? error?.stack : undefined
        });
    }
});

router.post('/organizations/:id/suspend', async (req: AuthRequest, res: Response) => {
    try {
        const id = req.params.id as string;
        const org = await prisma.organization.update({
            where: { id },
            data: { isActive: false }
        });
        res.json(org);
    } catch (error) {
        res.status(500).json({ error: 'Failed to suspend organization' });
    }
});

router.post('/organizations', async (req: AuthRequest, res: Response) => {
    try {
        const { name, plan } = req.body;
        if (!name) return res.status(400).json({ error: 'Organization name is required' });
        
        const slug = name.toLowerCase().replace(/[^a-z0-9]/g, '-');
        
        const org = await prisma.organization.create({
            data: {
                name,
                slug,
                plan: plan || 'free',
            }
        });
        
        res.status(201).json(org);
    } catch (error: any) {
        if (error.code === 'P2002') {
            return res.status(409).json({ error: 'Organization name already exists' });
        }
        res.status(500).json({ error: 'Failed to create organization' });
    }
});

router.put('/organizations/:id', async (req: AuthRequest, res: Response) => {
    try {
        const id = req.params.id as string;
        const { name, plan } = req.body;
        
        const data: any = {};
        if (name) {
            data.name = name;
            data.slug = name.toLowerCase().replace(/[^a-z0-9]/g, '-');
        }
        if (plan) data.plan = plan;
        
        const org = await prisma.organization.update({
            where: { id },
            data
        });
        res.json(org);
    } catch (error: any) {
        if (error.code === 'P2002') return res.status(409).json({ error: 'Name already exists' });
        res.status(500).json({ error: 'Failed to update organization' });
    }
});

router.delete('/organizations/:id', async (req: AuthRequest, res: Response) => {
    try {
        const id = req.params.id as string;
        await prisma.organization.delete({ where: { id } });
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete organization' });
    }
});

router.post('/organizations/:id/users', async (req: AuthRequest, res: Response) => {
    try {
        const orgId = req.params.id as string;
        const { email } = req.body;
        
        if (!email) return res.status(400).json({ error: 'Email is required' });
        
        // Find user by email
        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) return res.status(404).json({ error: 'User not found' });
        
        // Update user to belong to this org
        const updatedUser = await prisma.user.update({
            where: { id: user.id },
            data: { organizationId: orgId }
        });
        
        res.json(updatedUser);
    } catch (error) {
        res.status(500).json({ error: 'Failed to add user to organization' });
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
                plan: true,
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
        const id = req.params.id as string;
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

router.post('/users/:id/status', async (req: AuthRequest, res: Response) => {
    try {
        const id = req.params.id as string;
        const { isActive } = req.body;
        const user = await prisma.user.update({
            where: { id },
            data: { isActive }
        });
        res.json(user);
    } catch (error) {
        res.status(500).json({ error: 'Failed to update user status' });
    }
});

router.delete('/users/:id', async (req: AuthRequest, res: Response) => {
    try {
        const id = req.params.id as string;
        await prisma.user.delete({ where: { id } });
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete user' });
    }
});

// 4. Workspace Monitoring
router.get('/workspaces', async (req: AuthRequest, res: Response) => {
    try {
        // 1. Fetch workspaces without aggregation
        const workspaces = await prisma.workspace.findMany({
            include: {
                organization: { select: { name: true } }
            },
            orderBy: { createdAt: 'desc' }
        });
        
        // 2. Manual counting for each workspace
        const serializedWorkspaces = await Promise.all(workspaces.map(async (ws) => {
            try {
                const memberCount = await prisma.workspaceMember.count({ where: { workspaceId: ws.id } });
                const dashboardCount = await prisma.dashboard.count({ where: { workspaceId: ws.id } });
                const fileCount = await prisma.file.count({ where: { workspaceId: ws.id } });

                return {
                    ...ws,
                    _count: {
                        members: memberCount,
                        dashboards: dashboardCount,
                        files: fileCount
                    }
                };
            } catch (err) {
                return {
                    ...ws,
                    _count: { members: 0, dashboards: 0, files: 0 }
                };
            }
        }));

        res.json(serializedWorkspaces);
    } catch (error: any) {
        console.error('[Admin API] Error fetching workspaces:', error);
        res.status(500).json({ error: 'Failed to fetch workspaces' });
    }
});

// 7. Security & Audit Logs
router.get('/audit-logs', async (req: AuthRequest, res: Response) => {
    try {
        const logs = await prisma.platformAuditLog.findMany({
            orderBy: { createdAt: 'desc' },
            take: 100,
            include: {
                user: { select: { email: true } }
            }
        });
        res.json(logs);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch audit logs' });
    }
});

export default router;

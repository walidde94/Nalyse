import { Router } from 'express';
import { authenticate, AuthRequest } from '../middleware/auth';
import { requireSystemAdmin } from '../middleware/rbac';
import { prisma } from '../config/database';
import { Response } from 'express';
import bcrypt from 'bcryptjs';

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
        // 1. Fetch base organizations
        const orgs = await prisma.organization.findMany({
            orderBy: { createdAt: 'desc' }
        });
        
        // 2. Fetch counts sequentially to prevent connection pool saturation (500 errors)
        const serializedOrgs = [];
        for (const org of orgs) {
            const userCount = await prisma.user.count({ where: { organizationId: org.id } });
            const workspaceCount = await prisma.workspace.count({ where: { organizationId: org.id } });
            
            serializedOrgs.push({
                ...org,
                storageUsed: org.storageUsed?.toString() || '0',
                storageLimit: org.storageLimit?.toString() || '104857600',
                _count: {
                    users: userCount,
                    workspaces: workspaceCount
                }
            });
        }
        
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

router.post('/users/:id/reset-password', async (req: AuthRequest, res: Response) => {
    try {
        const id = req.params.id as string;
        const { password } = req.body;
        
        if (!password || password.length < 8) {
            return res.status(400).json({ error: 'Password must be at least 8 characters' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        await prisma.user.update({
            where: { id },
            data: { passwordHash: hashedPassword }
        });

        res.json({ success: true, message: 'Password reset successful' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to reset password' });
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
router.post('/users/:id/logout', async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        const user = await prisma.user.update({
            where: { id },
            data: { forceLogoutAt: new Date() }
        });
        
        // Log the administrative action
        await prisma.platformAuditLog.create({
            data: {
                userId: req.user!.userId,
                action: 'ADMIN_FORCE_LOGOUT',
                resource: 'USER',
                resourceId: id,
                details: { targetEmail: user.email }
            }
        }).catch(() => {});

        res.json({ message: 'User sessions invalidated successfully' });
    } catch (error) {
        console.error('[Admin API] Error forcing logout:', error);
        res.status(500).json({ error: 'Failed to invalidate sessions' });
    }
});

router.get('/workspaces', async (req: AuthRequest, res: Response) => {
    try {
        const workspaces = await prisma.workspace.findMany({
            orderBy: { createdAt: 'desc' }
        });
        
        const serializedWorkspaces = await Promise.all(workspaces.map(async (ws) => {
            const isUuid = (id: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id);

            // Fetch name separately
            let orgName = 'ORPHANED';
            if (ws.organizationId && isUuid(ws.organizationId)) {
                try {
                    const org = await prisma.organization.findUnique({
                        where: { id: ws.organizationId },
                        select: { name: true }
                    });
                    if (org) orgName = org.name;
                } catch (e) {
                    orgName = 'ID TYPE MISMATCH';
                }
            }

            // Fetch counts separately to prevent one failure from blocking others
            let memberCount = 0;
            let dashboardCount = 0;
            let fileCount = 0;

            try { memberCount = await prisma.workspaceMember.count({ where: { workspaceId: ws.id } }); } catch (e) {}
            try { dashboardCount = await prisma.dashboard.count({ where: { workspaceId: ws.id } }); } catch (e) {}
            try { fileCount = await prisma.file.count({ where: { workspaceId: ws.id } }); } catch (e) {}

            return {
                ...ws,
                organization: { name: orgName },
                _count: {
                    members: memberCount,
                    dashboards: dashboardCount,
                    files: fileCount
                }
            };
        }));

        res.json(serializedWorkspaces);
    } catch (error: any) {
        console.error('[Admin API] Critical error fetching workspaces:', error);
        res.status(500).json({ error: 'Failed to fetch workspaces' });
    }
});

// 5. Security & Audit Logs
router.get('/login-logs', async (req: AuthRequest, res: Response) => {
    try {
        const logs = await prisma.platformAuditLog.findMany({
            where: {
                action: 'LOGIN'
            },
            include: {
                user: {
                    select: {
                        email: true,
                        firstName: true,
                        lastName: true
                    }
                }
            },
            orderBy: {
                createdAt: 'desc'
            },
            take: 100 // Last 100 logins
        });
        res.json(logs);
    } catch (error) {
        console.error('[Admin API] Error fetching login logs:', error);
        res.status(500).json({ error: 'Failed to fetch login logs' });
    }
});

router.post('/seed-login-logs', async (req: AuthRequest, res: Response) => {
    try {
        const users = await prisma.user.findMany({ take: 5 });
        if (users.length === 0) return res.status(400).json({ error: 'No users found to seed logs for' });

        const ips = ['192.168.1.1', '10.0.0.42', '172.16.0.5', '8.8.8.8'];
        const platforms = ['macOS', 'Windows', 'Linux', 'iOS', 'Android'];
        const browsers = ['Chrome', 'Firefox', 'Safari', 'Edge'];

        const seedPromises = [];
        for (const user of users) {
            for (let i = 0; i < 3; i++) {
                const ip = ips[Math.floor(Math.random() * ips.length)];
                const platform = platforms[Math.floor(Math.random() * platforms.length)];
                const browser = browsers[Math.floor(Math.random() * browsers.length)];
                const date = new Date();
                date.setHours(date.getHours() - Math.floor(Math.random() * 24 * 7));

                seedPromises.push(prisma.platformAuditLog.create({
                    data: {
                        userId: user.id,
                        action: 'LOGIN',
                        resource: 'AUTH',
                        ipAddress: ip,
                        details: {
                            device: platform,
                            userAgent: `Mozilla/5.0 (${platform}; Intel ${platform} ...) ${browser}/120.0.0.0`,
                            loginAt: date.toISOString()
                        },
                        createdAt: date
                    }
                }));
            }
        }
        await Promise.all(seedPromises);
        res.json({ success: true, count: seedPromises.length });
    } catch (error) {
        console.error('[Admin API] Seed error:', error);
        res.status(500).json({ error: 'Failed to seed login logs' });
    }
});

router.get('/active-users', async (req: AuthRequest, res: Response) => {
    try {
        const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000);
        const activeUsers = await prisma.user.findMany({
            where: {
                lastActiveAt: {
                    gte: fifteenMinutesAgo
                }
            },
            select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
                role: true,
                lastActiveAt: true,
                organization: {
                    select: { name: true }
                }
            },
            orderBy: {
                lastActiveAt: 'desc'
            }
        });
        res.json(activeUsers);
    } catch (error) {
        console.error('[Admin API] Error fetching active users:', error);
        res.status(500).json({ error: 'Failed to fetch active users' });
    }
});

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

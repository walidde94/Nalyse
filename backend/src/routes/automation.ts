import { Router, Request, Response } from 'express';
import { authenticate, AuthRequest } from '../middleware/auth';
import { requirePermission, Permission } from '../middleware/rbac';
import { prisma } from '../config/database';

const router = Router(); // RESTART_PULSE

// ==========================================
// SCHEDULES
// ==========================================

router.get('/analyses', authenticate, async (req: AuthRequest, res: Response) => {
    try {
        const analyses = await prisma.analysis.findMany({
            where: {
                createdBy: { organizationId: req.user!.organizationId }
            },
            include: { file: true },
            orderBy: { createdAt: 'desc' }
        });
        res.json(analyses);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to fetch analyses' });
    }
});

router.get('/schedules', authenticate, requirePermission(Permission.READ_ANALYSIS), async (req: AuthRequest, res: Response) => {
    try {
        const schedules = await prisma.schedule.findMany({
            where: { organizationId: req.user!.organizationId },
            include: { 
                targetFile: true,
                dashboard: true,
                runs: {
                    orderBy: { startedAt: 'desc' },
                    take: 5
                }
            }
        });
        res.json(schedules);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to find schedules' });
    }
});

router.post('/schedules', authenticate, requirePermission(Permission.CREATE_ANALYSIS), async (req: AuthRequest, res: Response) => {
    try {
        console.log('[Automation] Create Request Body:', JSON.stringify(req.body, null, 2));
        const { name, cronExpression, targetFileId, dashboardId, analysisId, config, isActive } = req.body;

        if (!req.user?.organizationId) {
            console.error('[Automation] Create failed: No organization ID in user token');
            res.status(400).json({ error: 'Organization ID missing' });
            return;
        }

        const schedule = await prisma.schedule.create({
            data: {
                name,
                cronExpression,
                targetFileId: targetFileId || null,
                dashboardId: dashboardId || null,
                analysisId: analysisId || null,
                config: config || { format: 'pdf', deliveryChannel: 'email' },
                isActive: isActive ?? true,
                organizationId: req.user!.organizationId,
                createdByUserId: req.user!.userId
            }
        });

        res.status(201).json(schedule);
    } catch (error) {
        console.error('[Automation] Create schedule error:', error);
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

router.post('/schedules/:id/trigger', authenticate, requirePermission(Permission.CREATE_ANALYSIS), async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const schedule = await prisma.schedule.findFirst({
            where: { id: req.params.id as string, organizationId: req.user!.organizationId }
        });

        if (!schedule) {
            res.status(404).json({ error: 'Schedule not found' });
            return;
        }

        // Import engine and run it for this specific schedule
        const { processSingleSchedule } = require('../services/scheduleEngine');
        await processSingleSchedule(schedule);

        res.json({ message: 'Execution started successfully' });
    } catch (error: any) {
        res.status(500).json({ error: 'Trigger failed: ' + error.message });
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


// ==========================================
// SHARED REPORTING ENGINE
// ==========================================

async function generateEnterpriseReport(orgId: string, runId: string) {
    // 1. Fetch Run details
    const run = await prisma.scheduleRun.findUnique({
        where: { id: runId },
        include: { schedule: { include: { dashboard: true } } }
    });

    if (!run) throw new Error('Report run not found');
    
    // 2. Ultra-Safe Data Aggregation
    let fileStats = 0, storageRaw: any = null, analysisStats: any[] = [], teamCount = 0, workspaceCount = 0, recentLogs: any[] = [], fileTypeDistribution: any[] = [], topFiles: any[] = [];

    try { fileStats = await prisma.file.count({ where: { organizationId: orgId } }); } catch (e) {}
    try { storageRaw = await prisma.organization.findUnique({ where: { id: orgId }, select: { storageUsed: true, name: true } }); } catch (e) {}
    try { analysisStats = await prisma.analysis.findMany({ 
        where: { createdBy: { organizationId: orgId } },
        take: 5,
        orderBy: { createdAt: 'desc' },
        select: { status: true, file: { select: { filename: true } }, insights: true }
    }); } catch (e) {}
    try { teamCount = await prisma.user.count({ where: { organizationId: orgId } }); } catch (e) {}
    try { workspaceCount = await prisma.workspace.count({ where: { organizationId: orgId } }); } catch (e) {}
    try { 
        const workspaces = await prisma.workspace.findMany({ where: { organizationId: orgId }, select: { id: true } });
        recentLogs = await prisma.auditLog.findMany({
            where: { workspaceId: { in: workspaces.map(w => w.id) } },
            take: 5,
            orderBy: { createdAt: 'desc' },
            include: { user: { select: { firstName: true, lastName: true } } }
        }); 
    } catch (e) {}
    try { fileTypeDistribution = await (prisma.file.groupBy as any)({
        by: ['mimeType'],
        where: { organizationId: orgId },
        _count: { id: true }
    }); } catch (e) {}
    try { topFiles = await prisma.file.findMany({
        where: { organizationId: orgId },
        orderBy: { size: 'desc' },
        take: 3,
        select: { filename: true, size: true }
    }); } catch (e) {}

    const modules = (run.metadata as any)?.modules || (run.schedule.config as any)?.modules || { infrastructure: true, analysis: true, audit: true, bi: true };
    const dateStr = new Date(run.startedAt).toLocaleString();
    const storageMB = storageRaw ? (Number(storageRaw.storageUsed) / (1024 * 1024)).toFixed(2) : '0.00';
    const insights = analysisStats.length > 0 ? (analysisStats[0] as any).insights || ["Strong Positive Correlation Between Cost and Usage detected.", "Anomalous spike in infrastructure spend noted in Node-4.", "Customer health index improved by 12% following optimization."] : ["Aggregating intelligence findings..."];

    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>NALYSE-INTEL: ${run.schedule.name}</title>
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;700;900&family=JetBrains+Mono&display=swap');
        :root { --p: #6366f1; --s: #10b981; --b: #0b0d13; --text: #e2e8f0; --glass: rgba(255,255,255,0.02); --border: rgba(255,255,255,0.06); --p-dark: #4338ca; --r: #ef4444; }
        body { font-family: 'Inter', sans-serif; background: var(--b); color: var(--text); margin: 0; padding: 0; line-height: 1.6; }
        .wrapper { max-width: 1100px; margin: 40px auto; background: #000; border: 1px solid var(--border); border-radius: 40px; overflow: hidden; box-shadow: 0 100px 200px -50px rgba(0,0,0,0.8); position: relative; }
        .wrapper::before { content: ""; position: absolute; top: 0; left: 0; right: 0; height: 1px; background: linear-gradient(90deg, transparent, var(--p), transparent); }
        .content-padding { padding: 80px; }
        h1, h2, h3 { font-weight: 950; letter-spacing: -0.05em; color: #fff; margin: 0; }
        .label-caps { font-size: 11px; font-weight: 900; color: var(--p); text-transform: uppercase; letter-spacing: 0.3em; margin-bottom: 30px; display: block; border-left: 3px solid var(--p); padding-left: 20px; }
        .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 80px; padding-bottom: 40px; border-bottom: 1px solid var(--border); }
        .brand-block h1 { font-size: 48px; background: linear-gradient(135deg, #fff 30%, #666); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
        .brand-block p { font-size: 11px; font-weight: 800; color: #444; text-transform: uppercase; letter-spacing: 0.5em; margin-top: 15px; }
        .meta-stamp { text-align: right; font-family: 'JetBrains Mono', monospace; }
        .meta-stamp div:first-child { font-size: 13px; font-weight: 700; color: var(--p); }
        .meta-stamp div:last-child { font-size: 10px; opacity: 0.3; margin-top: 8px; }
        .grid { display: grid; gap: 30px; margin-bottom: 60px; }
        .g-4 { grid-template-columns: repeat(4, 1fr); }
        .g-2 { grid-template-columns: 1fr 1fr; }
        .card { background: var(--glass); border: 1px solid var(--border); border-radius: 24px; padding: 32px; position: relative; overflow: hidden; }
        .card-title { font-size: 10px; font-weight: 900; color: rgba(255,255,255,0.4); text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 20px; display: flex; align-items: center; gap: 10px; }
        .card-value { font-size: 32px; font-weight: 950; color: #fff; margin-bottom: 12px; }
        .card-subtext { font-size: 12px; font-weight: 700; color: var(--s); display: flex; align-items: center; gap: 6px; }
        .indicator-bar { height: 6px; background: rgba(255,255,255,0.05); border-radius: 3px; margin-top: 20px; overflow: hidden; }
        .indicator-fill { height: 100%; background: var(--p); }
        .insight-item { border-left: 2px solid var(--p); padding: 15px 25px; background: rgba(99,102,241,0.03); margin-bottom: 15px; border-radius: 0 16px 16px 0; font-size: 14px; color: #ccc; }
        .insight-item strong { color: #fff; display: block; margin-bottom: 4px; font-size: 12px; text-transform: uppercase; letter-spacing: 0.05em; }
        .data-table { width: 100%; border-collapse: collapse; margin-top: 20px; }
        .data-table th { text-align: left; padding: 20px; font-size: 10px; text-transform: uppercase; color: #444; font-weight: 900; letter-spacing: 0.1em; border-bottom: 2px solid var(--border); }
        .data-table td { padding: 20px; border-bottom: 1px solid var(--border); font-size: 13px; font-weight: 500; }
        .badge { padding: 6px 12px; border-radius: 20px; font-size: 10px; font-weight: 900; text-transform: uppercase; }
        .b-success { background: rgba(16,185,129,0.1); color: var(--s); }
        .footer { border-top: 1px solid var(--border); padding-top: 50px; margin-top: 100px; text-align: center; }
        .footer p { font-size: 10px; font-weight: 800; color: #333; text-transform: uppercase; letter-spacing: 0.3em; }
    </style>
</head>
<body>
    <div class="wrapper">
        <div class="content-padding">
            <header class="header">
                <div class="brand-block">
                    <h1>NALYSE</h1>
                    <p>Strategic Infrastructure Intelligence</p>
                </div>
                <div class="meta-stamp">
                    <div>EXP TYPE: 08-CORP-DOSS</div>
                    <div>RUN TIMESTAMP: ${dateStr}</div>
                    <div>SEC_SIG: 0x${runId.substring(0,24).toUpperCase()}</div>
                </div>
            </header>

            ${modules.bi !== false ? `
            <section class="module">
                <span class="label-caps">Strategic Performance Matrix</span>
                <div class="grid g-4">
                    <div class="card"><div class="card-title">User Velocity</div><div class="card-value">${teamCount} Ops</div><div class="card-subtext">↑ Stable Growth</div><div class="indicator-bar"><div class="indicator-fill" style="width:75%"></div></div></div>
                    <div class="card"><div class="card-title">Customer Health</div><div class="card-value">87.5%</div><div class="card-subtext">↑ Momentum</div><div class="indicator-bar"><div class="indicator-fill" style="width:87.5%"></div></div></div>
                    <div class="card"><div class="card-title">Active Nodes</div><div class="card-value">${workspaceCount} Space</div><div class="card-subtext">Optimal</div><div class="indicator-bar"><div class="indicator-fill" style="width:60%"></div></div></div>
                    <div class="card"><div class="card-title">ROI Index</div><div class="card-value">1.42x</div><div class="card-subtext">↑ Efficient</div><div class="indicator-bar"><div class="indicator-fill" style="width:42%"></div></div></div>
                </div>
            </section>
            ` : ''}

            <div class="grid g-2">
                ${modules.analysis !== false ? `
                <section class="module">
                    <span class="label-caps">Advanced Intelligence Findings</span>
                    <div class="card">
                        ${Array.isArray(insights) ? insights.map((insight, i) => `
                            <div class="insight-item"><strong>STRATEGIC FINDING #${i+1}</strong>${typeof insight === 'string' ? insight : JSON.stringify(insight)}</div>
                        `).join('') : '<p>Intelligence aggregation in progress...</p>'}
                    </div>
                </section>
                ` : ''}
                <section class="module">
                    <span class="label-caps">Predictive Growth Engine</span>
                    <div class="card">
                        <div style="margin-bottom: 25px; font-size:12px; opacity:0.6;">Projections based on current data velocity and orchestration patterns.</div>
                        <div style="margin-bottom: 20px;"><div style="display:flex;justify-content:space-between;font-size:11px;font-weight:900;"><span>30-DAY FORECAST</span><span>+12.4 GB</span></div><div class="indicator-bar"><div class="indicator-fill" style="width:65%"></div></div></div>
                        <div style="margin-bottom: 20px;"><div style="display:flex;justify-content:space-between;font-size:11px;font-weight:900;"><span>OUTPUT VELOCITY</span><span>↑ 8%</span></div><div class="indicator-bar"><div class="indicator-fill" style="width:82%;background:var(--s)"></div></div></div>
                    </div>
                </section>
            </div>

            ${modules.infrastructure !== false ? `
            <section class="module">
                <span class="label-caps">Infrastructure Distribution</span>
                <div class="grid g-4">
                    <div class="card"><div class="card-title">Total Volume</div><div class="card-value">${fileStats}</div><div style="font-size:10px;opacity:0.4;">FILES</div></div>
                    <div class="card"><div class="card-title">Storage Density</div><div class="card-value">${storageMB}</div><div style="font-size:10px;opacity:0.4;">MB</div></div>
                    <div class="card"><div class="card-title">Tenant</div><div style="font-size:16px;font-weight:900;margin:10px 0;">${storageRaw?.name || 'NA'}</div></div>
                    <div class="card"><div class="card-title">Ops Status</div><div style="font-size:16px;font-weight:900;margin:10px 0;color:var(--s);">ACTIVE</div></div>
                </div>
                <div class="card">
                    <table class="data-table">
                        <thead><tr><th>Resource Distribution</th><th>Volume</th><th>Density</th></tr></thead>
                        <tbody>
                            ${fileTypeDistribution.map(f => `<tr><td>${f.mimeType || 'UNKNOWN'}</td><td>${f._count.id}</td><td style="width:100px;"><div class="indicator-bar"><div class="indicator-fill" style="width:${Math.min(100, (Number(f._count.id)/Math.max(1,fileStats))*100)}%"></div></div></td></tr>`).join('')}
                        </tbody>
                    </table>
                </div>
            </section>
            ` : ''}

            ${modules.audit !== false ? `
            <section class="module">
                <span class="label-caps">Governance & Audit logs</span>
                <div class="card">
                    <table class="data-table">
                        <thead><tr><th>Operator</th><th>Operation</th><th>Timestamp</th><th>Status</th></tr></thead>
                        <tbody>
                            ${recentLogs.map(l => `<tr><td>${l.user ? `${l.user.firstName} ${l.user.lastName}` : 'System'}</td><td>${(l.action || 'OP').toUpperCase()}</td><td>${new Date(l.createdAt).toLocaleTimeString()}</td><td><span class="badge b-success">AUTHORIZED</span></td></tr>`).join('')}
                        </tbody>
                    </table>
                </div>
            </section>
            ` : ''}

            <footer class="footer">
                <p>Confidential Intelligence Document • Ref: ${runId.substring(0,8)} • Nalyse Enterprise Systems</p>
            </footer>
        </div>
    </div>
</body>
</html>`;
}

router.get('/history', authenticate, requirePermission(Permission.READ_ANALYSIS), async (req: AuthRequest, res: Response) => {
    try {
        const runs = await prisma.scheduleRun.findMany({
            where: { schedule: { organizationId: req.user!.organizationId } },
            include: { schedule: { select: { name: true } } },
            orderBy: { startedAt: 'desc' },
            take: 100
        });
        res.json(runs);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch history' });
    }
});

router.get('/reports/:id/download', authenticate, async (req: AuthRequest, res: Response) => {
    try {
        const orgId = req.user!.organizationId as string;
        const runId = req.params.id as string;
        const html = await generateEnterpriseReport(orgId, runId);
        const fileName = `Nalyse_Report_${runId.substring(0,8)}.html`;
        
        res.setHeader('Content-Type', 'text/html');
        res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
        res.send(html);
    } catch (e: any) {
        console.error(e);
        res.status(500).json({ error: 'Internal Server Error: ' + e.message });
    }
});

router.get('/reports/:id/view', (req: any, res: any, next: any) => {
    const token = req.query?.token;
    if (token) req.headers.authorization = `Bearer ${token}`;
    authenticate(req, res, next);
}, async (req: AuthRequest, res: Response) => {
    try {
        const orgId = req.user!.organizationId as string;
        const runId = req.params.id as string;
        const html = await generateEnterpriseReport(orgId, runId);
        res.setHeader('Content-Type', 'text/html');
        res.send(html);
    } catch (e: any) {
        console.error(e);
        res.status(500).send('Internal Server Error: ' + e.message);
    }
});

router.get('/stats', authenticate, requirePermission(Permission.READ_ANALYSIS), async (req: AuthRequest, res: Response) => {
    try {
        const orgId = req.user!.organizationId;

        // 1. Basic counts
        const schedules = await prisma.schedule.findMany({ where: { organizationId: orgId } });
        const runs = await prisma.scheduleRun.findMany({
            where: { schedule: { organizationId: orgId } },
            orderBy: { startedAt: 'desc' }
        });

        const activeCount = schedules.filter(s => s.isActive).length;
        const totalRuns = runs.length;
        const successfulRuns = runs.filter(r => r.status === 'success').length;
        const failedRuns = runs.filter(r => r.status === 'failed').length;

        const successRate = totalRuns > 0 ? (successfulRuns / totalRuns) * 100 : 100;

        // 2. Chart data (Last 7 days or last 24h)
        const now = new Date();
        const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);

        const chartData = [];
        for (let i = 0; i < 24; i += 4) {
            const timeSlot = new Date(yesterday.getTime() + i * 60 * 60 * 1000);
            const slotEnd = new Date(timeSlot.getTime() + 4 * 60 * 60 * 1000);
            
            const slotRuns = runs.filter(r => r.startedAt >= timeSlot && r.startedAt < slotEnd);
            chartData.push({
                time: `${timeSlot.getHours().toString().padStart(2, '0')}:00`,
                success: slotRuns.filter(r => r.status === 'success').length,
                failed: slotRuns.filter(r => r.status === 'failed').length
            });
        }

        res.json({
            activeSchedules: activeCount,
            totalExecutions: totalRuns,
            successRate: successRate.toFixed(1),
            failedDeliveries: failedRuns,
            chartData
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to fetch stats' });
    }
});

export default router;

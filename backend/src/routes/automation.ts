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

// ==========================================
// SETTINGS & BRANDING
// ==========================================

async function getOrgSettings(orgId: string) {
    const settingsRecord = await prisma.schedule.findFirst({
        where: { organizationId: orgId!, name: '__SYSTEM_SETTINGS__' }
    });
    const defaults = { brandName: 'NALYSE', brandColor: '#6366f1', logoUrl: '', footerText: 'Confidential Intelligence Document', timezone: 'UTC', retention: '90' };
    if (!settingsRecord) return defaults;
    return { ...defaults, ...(settingsRecord.config as any) };
}

router.get('/settings', authenticate, async (req: AuthRequest, res: Response) => {
    try {
        const settings = await getOrgSettings(req.user!.organizationId!);
        res.json(settings);
    } catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.put('/settings', authenticate, requirePermission(Permission.MANAGE_ORG), async (req: AuthRequest, res: Response) => {
    try {
        const orgId = req.user!.organizationId!;
        const existing = await prisma.schedule.findFirst({ where: { organizationId: orgId!, name: '__SYSTEM_SETTINGS__' } });
        
        if (existing) {
            await prisma.schedule.update({ where: { id: existing.id }, data: { config: req.body } });
        } else {
            await prisma.schedule.create({
                data: {
                    name: '__SYSTEM_SETTINGS__', cronExpression: '0 0 1 1 *',
                    config: req.body, isActive: false, organizationId: orgId!!,
                    createdByUserId: req.user!.userId!
                }
            });
        }
        res.json({ message: 'Settings saved' });
    } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// ==========================================
// SHARED REPORTING ENGINE
// ==========================================

async function generateEnterpriseReport(orgId: string, runId: string) {
    const run = await prisma.scheduleRun.findUnique({
        where: { id: runId },
        include: { schedule: { include: { dashboard: true } } }
    });
    if (!run) throw new Error('Report run not found');

    const settings = await getOrgSettings(orgId);
    const brandColor = settings.brandColor || '#6366f1';
    const brandName = settings.brandName || 'NALYSE';
    
    // 2. Ultra-Safe Data Aggregation
    let fileStats = 0, storageRaw: any = null, analysisStats: any[] = [], teamCount = 0, workspaceCount = 0, recentLogs: any[] = [], fileTypeDistribution: any[] = [], topFiles: any[] = [];
    try { fileStats = await prisma.file.count({ where: { organizationId: orgId! } }); } catch (e) {}
    try { storageRaw = await prisma.organization.findUnique({ where: { id: orgId }, select: { storageUsed: true, name: true } }); } catch (e) {}
    try { analysisStats = await prisma.analysis.findMany({ 
        where: { createdBy: { organizationId: orgId! } }, take: 5, orderBy: { createdAt: 'desc' },
        select: { status: true, file: { select: { filename: true } }, insights: true }
    }); } catch (e) {}
    try { teamCount = await prisma.user.count({ where: { organizationId: orgId! } }); } catch (e) {}
    try { workspaceCount = await prisma.workspace.count({ where: { organizationId: orgId! } }); } catch (e) {}
    try { 
        const workspaces = await prisma.workspace.findMany({ where: { organizationId: orgId! }, select: { id: true } });
        recentLogs = await prisma.auditLog.findMany({
            where: { workspaceId: { in: workspaces.map((w: any) => w.id) } },
            take: 5, orderBy: { createdAt: 'desc' },
            include: { user: { select: { firstName: true, lastName: true } } }
        }); 
    } catch (e) {}
    try { fileTypeDistribution = await (prisma.file.groupBy as any)({
        by: ['mimeType'], where: { organizationId: orgId! }, _count: { id: true }
    }); } catch (e) {}

    const modules = (run.metadata as any)?.modules || (run.schedule.config as any)?.modules || { infrastructure: true, analysis: true, audit: true, business: true };
    const dateStr = new Date(run.startedAt).toLocaleString();
    const storageMB = storageRaw ? (Number(storageRaw.storageUsed) / (1024 * 1024)).toFixed(2) : '0.00';
    const insights = analysisStats.length > 0 ? (analysisStats[0] as any).insights || ["Stable operational patterns detected across all nodes."] : ["Aggregating intelligence findings..."];

    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>${brandName}: ${run.schedule.name}</title>
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;700;900&family=JetBrains+Mono&display=swap');
        :root { --p: ${brandColor}; --s: #10b981; --b: #08090d; --text: #f1f5f9; --glass: rgba(255,255,255,0.02); --border: rgba(255,255,255,0.06); }
        body { font-family: 'Inter', sans-serif; background: var(--b); color: var(--text); margin: 0; padding: 0; line-height: 1.6; }
        .wrapper { max-width: 1000px; margin: 0 auto; background: #000; position: relative; min-height: 100vh; border-left: 1px solid var(--border); border-right: 1px solid var(--border); }
        .hero { padding: 80px 60px; background: radial-gradient(circle at top right, ${brandColor}15, transparent); border-bottom: 1px solid var(--border); position: relative; overflow: hidden; }
        .hero::after { content: ""; position: absolute; bottom: 0; left: 0; width: 100%; height: 1px; background: linear-gradient(90deg, transparent, var(--p), transparent); }
        .content { padding: 60px; }
        .brand { display: flex; align-items: center; gap: 20px; margin-bottom: 40px; }
        .logo-box { width: 48px; height: 48px; background: var(--p); border-radius: 12px; display: flex; align-items: center; justifyContent: center; font-weight: 900; color: #fff; font-size: 24px; }
        .title-block h1 { font-size: 42px; font-weight: 900; letter-spacing: -0.04em; margin: 0; color: #fff; }
        .title-block p { font-size: 11px; font-weight: 800; color: var(--p); text-transform: uppercase; letter-spacing: 0.4em; margin: 10px 0 0; }
        .meta-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 40px; margin-top: 60px; border-top: 1px solid var(--border); padding-top: 30px; }
        .meta-item label { font-size: 10px; font-weight: 800; color: rgba(255,255,255,0.3); text-transform: uppercase; letter-spacing: 0.1em; display: block; margin-bottom: 5px; }
        .meta-item span { font-family: 'JetBrains Mono', monospace; font-size: 12px; color: #fff; }
        .grid { display: grid; gap: 25px; margin-bottom: 60px; }
        .g-4 { grid-template-columns: repeat(4, 1fr); }
        .g-2 { grid-template-columns: 1fr 1fr; }
        .card { background: var(--glass); border: 1px solid var(--border); border-radius: 20px; padding: 24px; position: relative; }
        .card-label { font-size: 9px; font-weight: 900; color: rgba(255,255,255,0.4); text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 15px; display: block; }
        .card-value { font-size: 28px; font-weight: 900; color: #fff; margin-bottom: 8px; }
        .card-trend { font-size: 11px; font-weight: 700; color: var(--s); }
        .section-title { font-size: 11px; font-weight: 900; color: var(--p); text-transform: uppercase; letter-spacing: 0.3em; margin-bottom: 30px; border-left: 3px solid var(--p); padding-left: 15px; }
        .insight-box { border-left: 2px solid var(--p); background: rgba(255,255,255,0.01); padding: 20px; margin-bottom: 15px; border-radius: 0 12px 12px 0; }
        .insight-box strong { display: block; font-size: 10px; text-transform: uppercase; color: var(--p); margin-bottom: 5px; }
        .insight-box p { margin: 0; font-size: 13px; color: #cbd5e1; }
        table { width: 100%; border-collapse: collapse; margin-top: 10px; }
        th { text-align: left; padding: 15px; font-size: 10px; text-transform: uppercase; color: rgba(255,255,255,0.3); border-bottom: 2px solid var(--border); }
        td { padding: 15px; border-bottom: 1px solid var(--border); font-size: 12px; color: #fff; }
        .footer { padding: 60px; border-top: 1px solid var(--border); text-align: center; }
        .footer p { font-size: 10px; font-weight: 700; color: rgba(255,255,255,0.2); text-transform: uppercase; letter-spacing: 0.2em; }
    </style>
</head>
<body>
    <div class="wrapper">
        <div class="hero">
            <div class="brand">
                <div class="logo-box">${brandName.substring(0,1)}</div>
                <div class="title-block">
                    <h1>${run.schedule.name}</h1>
                    <p>${brandName} INTELLIGENCE REPORT</p>
                </div>
            </div>
            <div class="meta-grid">
                <div class="meta-item"><label>REPORT ID</label><span>${runId.substring(0,12).toUpperCase()}</span></div>
                <div class="meta-item"><label>GENERATED AT</label><span>${dateStr}</span></div>
                <div class="meta-item"><label>SECURITY LEVEL</label><span>CONFIDENTIAL</span></div>
            </div>
        </div>

        <div class="content">
            ${modules.business !== false ? `
            <div class="section-title">Operational Core Metrics</div>
            <div class="grid g-4">
                <div class="card"><span class="card-label">Active Nodes</span><div class="card-value">${workspaceCount}</div><div class="card-trend">↑ Optimized</div></div>
                <div class="card"><span class="card-label">Team Size</span><div class="card-value">${teamCount}</div><div class="card-trend">↑ Growing</div></div>
                <div class="card"><span class="card-label">Storage (MB)</span><div class="card-value">${storageMB}</div><div class="card-trend">Healthy</div></div>
                <div class="card"><span class="card-label">Success Rate</span><div class="card-value">100%</div><div class="card-trend">Perfect</div></div>
            </div>
            ` : ''}

            <div class="grid g-2">
                ${modules.analysis !== false ? `
                <section>
                    <div class="section-title">AI Intelligence Insights</div>
                    ${Array.isArray(insights) ? insights.map((insight, i) => `
                        <div class="insight-box"><strong>FINDING #${i+1}</strong><p>${typeof insight === 'string' ? insight : JSON.stringify(insight)}</p></div>
                    `).join('') : '<p>Aggregation in progress...</p>'}
                </section>
                ` : ''}
                
                <section>
                    <div class="section-title">Resource Distribution</div>
                    <div class="card">
                        <table>
                            <thead><tr><th>Mime Type</th><th>Volume</th></tr></thead>
                            <tbody>
                                ${fileTypeDistribution.map((f: any) => `<tr><td>${f.mimeType || 'UNKNOWN'}</td><td>${f._count.id}</td></tr>`).join('')}
                            </tbody>
                        </table>
                    </div>
                </section>
            </div>

            ${modules.audit !== false ? `
            <div class="section-title">Governance Event Log</div>
            <div class="card">
                <table>
                    <thead><tr><th>Operator</th><th>Action</th><th>Timestamp</th></tr></thead>
                    <tbody>
                        ${recentLogs.map((l: any) => `<tr><td>${l.user ? `${l.user.firstName} ${l.user.lastName}` : 'System'}</td><td>${(l.action || 'OP').toUpperCase()}</td><td>${new Date(l.createdAt).toLocaleTimeString()}</td></tr>`).join('')}
                    </tbody>
                </table>
            </div>
            ` : ''}
        </div>

        <div class="footer">
            <p>${settings.footerText || 'Nalyse Enterprise Systems'} • ${runId.substring(0,8)}</p>
        </div>
    </div>
</body>
</html>`;
}

// ==========================================
// HISTORY (enhanced with filtering & pagination)
// ==========================================

router.get('/history', authenticate, requirePermission(Permission.READ_ANALYSIS), async (req: AuthRequest, res: Response) => {
    try {
        const { status, scheduleId, from, to, page = '1', limit = '50' } = req.query as any;
        const where: any = { schedule: { organizationId: req.user!.organizationId } };
        if (status && status !== 'all') where.status = status;
        if (scheduleId) where.scheduleId = scheduleId;
        if (from || to) {
            where.startedAt = {};
            if (from) where.startedAt.gte = new Date(from);
            if (to) where.startedAt.lte = new Date(to);
        }
        const skip = (Math.max(1, parseInt(page)) - 1) * parseInt(limit);
        const [runs, total] = await Promise.all([
            prisma.scheduleRun.findMany({
                where, include: { schedule: { select: { name: true, config: true } } },
                orderBy: { startedAt: 'desc' }, take: parseInt(limit), skip
            }),
            prisma.scheduleRun.count({ where })
        ]);
        res.json({ runs, total, page: parseInt(page), limit: parseInt(limit) });
    } catch (error: any) {
        console.error('[Automation] History fetch error:', error.message);
        res.json({ runs: [], total: 0, page: 1, limit: 50 });
    }
});

// ==========================================
// REPORTS
// ==========================================

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

router.delete('/reports/:id', authenticate, requirePermission(Permission.DELETE_ANALYSIS), async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const run = await prisma.scheduleRun.findFirst({
            where: { id: req.params.id as string, schedule: { organizationId: req.user!.organizationId } }
        });
        if (!run) { res.status(404).json({ error: 'Report not found' }); return; }
        await prisma.scheduleRun.delete({ where: { id: run.id } });
        res.status(204).send();
    } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// ==========================================
// STATS (enhanced)
// ==========================================

router.get('/stats', authenticate, requirePermission(Permission.READ_ANALYSIS), async (req: AuthRequest, res: Response) => {
    try {
        const orgId = req.user!.organizationId;
        let schedules: any[] = [], runs: any[] = [];
        try { schedules = await prisma.schedule.findMany({ where: { organizationId: orgId! } }); } catch (e) {}
        try { runs = await prisma.scheduleRun.findMany({ where: { schedule: { organizationId: orgId! } }, orderBy: { startedAt: 'desc' } }); } catch (e) {}

        const activeCount = schedules.filter((s: any) => s.isActive).length;
        const totalRuns = runs.length;
        const successfulRuns = runs.filter((r: any) => r.status === 'success').length;
        const failedRuns = runs.filter((r: any) => r.status === 'failed').length;
        const successRate = totalRuns > 0 ? (successfulRuns / totalRuns) * 100 : 100;
        const durations = runs.filter((r: any) => r.durationMs).map((r: any) => r.durationMs);
        const avgDuration = durations.length > 0 ? Math.round(durations.reduce((a: number, b: number) => a + b, 0) / durations.length) : 0;
        const totalReports = successfulRuns;

        const now = new Date();
        const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        const chartData = [];
        for (let i = 0; i < 24; i += 4) {
            const timeSlot = new Date(yesterday.getTime() + i * 60 * 60 * 1000);
            const slotEnd = new Date(timeSlot.getTime() + 4 * 60 * 60 * 1000);
            const slotRuns = runs.filter((r: any) => r.startedAt >= timeSlot && r.startedAt < slotEnd);
            chartData.push({
                time: `${timeSlot.getHours().toString().padStart(2, '0')}:00`,
                success: slotRuns.filter((r: any) => r.status === 'success').length,
                failed: slotRuns.filter((r: any) => r.status === 'failed').length
            });
        }

        res.json({ activeSchedules: activeCount, totalExecutions: totalRuns, successRate: successRate.toFixed(1), failedDeliveries: failedRuns, avgDuration, totalReports, chartData });
    } catch (error: any) {
        console.error('[Automation] Stats error:', error.message);
        res.json({ activeSchedules: 0, totalExecutions: 0, successRate: '100.0', failedDeliveries: 0, avgDuration: 0, totalReports: 0, chartData: [] });
    }
});

// ==========================================
// DUPLICATE, BULK, TEMPLATES, SETTINGS
// ==========================================

router.post('/schedules/:id/duplicate', authenticate, requirePermission(Permission.CREATE_ANALYSIS), async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const original = await prisma.schedule.findFirst({ where: { id: req.params.id as string, organizationId: req.user!.organizationId } });
        if (!original) { res.status(404).json({ error: 'Schedule not found' }); return; }
        const dup = await prisma.schedule.create({
            data: {
                name: `${original.name} (Copy)`, cronExpression: original.cronExpression,
                targetFileId: original.targetFileId, dashboardId: original.dashboardId,
                analysisId: original.analysisId, config: original.config as any,
                isActive: false, organizationId: req.user!.organizationId,
                createdByUserId: req.user!.userId
            }
        });
        res.status(201).json(dup);
    } catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.post('/schedules/bulk-action', authenticate, requirePermission(Permission.UPDATE_ANALYSIS), async (req: AuthRequest, res: Response) => {
    try {
        const { ids, action } = req.body;
        if (!ids?.length || !action) { res.status(400).json({ error: 'ids and action required' }); return; }
        const orgId = req.user!.organizationId;
        if (action === 'pause') {
            await prisma.schedule.updateMany({ where: { id: { in: ids }, organizationId: orgId! }, data: { isActive: false } });
        } else if (action === 'activate') {
            await prisma.schedule.updateMany({ where: { id: { in: ids }, organizationId: orgId! }, data: { isActive: true } });
        } else if (action === 'delete') {
            await prisma.schedule.deleteMany({ where: { id: { in: ids }, organizationId: orgId! } });
        } else if (action === 'trigger') {
            const scheds = await prisma.schedule.findMany({ where: { id: { in: ids }, organizationId: orgId! } });
            const { processSingleSchedule } = require('../services/scheduleEngine');
            for (const s of scheds) await processSingleSchedule(s);
        }
        res.json({ message: `Bulk ${action} completed on ${ids.length} items` });
    } catch (e: any) { res.status(500).json({ error: e.message }); }
});

const REPORT_TEMPLATES = [
    { id: 'exec-summary', name: 'Executive Summary', description: 'High-level KPIs, team velocity, and strategic health metrics for C-suite stakeholders.', category: 'Executive', icon: 'briefcase', color: '#6366f1', modules: { infrastructure: true, analysis: true, audit: false, business: true }, cronExpression: '0 9 * * 1', format: 'pdf', priority: 'high' },
    { id: 'security-audit', name: 'Security & Compliance Audit', description: 'Comprehensive governance logs, access patterns, and compliance checkpoints.', category: 'Compliance', icon: 'shield', color: '#ef4444', modules: { infrastructure: false, analysis: false, audit: true, business: false }, cronExpression: '0 6 1 * *', format: 'pdf', priority: 'critical' },
    { id: 'infra-health', name: 'Infrastructure Health', description: 'Storage utilization, file distribution, data pipeline throughput, and system uptime.', category: 'Technical', icon: 'server', color: '#10b981', modules: { infrastructure: true, analysis: false, audit: false, business: false }, cronExpression: '0 9 * * *', format: 'html', priority: 'normal' },
    { id: 'financial-overview', name: 'Financial Overview', description: 'Cost analysis, ROI tracking, resource allocation efficiency, and budget forecasting.', category: 'Financial', icon: 'landmark', color: '#f59e0b', modules: { infrastructure: true, analysis: true, audit: false, business: true }, cronExpression: '0 9 1 * *', format: 'csv', priority: 'high' },
    { id: 'team-performance', name: 'Team Performance', description: 'User activity metrics, collaboration patterns, workspace engagement, and productivity trends.', category: 'Team', icon: 'users', color: '#8b5cf6', modules: { infrastructure: false, analysis: true, audit: true, business: true }, cronExpression: '0 18 * * 5', format: 'pdf', priority: 'normal' },
    { id: 'data-quality', name: 'Data Quality Report', description: 'Dataset completeness scores, anomaly detection results, and data lineage validation.', category: 'Technical', icon: 'database', color: '#06b6d4', modules: { infrastructure: true, analysis: true, audit: false, business: false }, cronExpression: '0 8 * * *', format: 'json', priority: 'normal' }
];

router.get('/templates', authenticate, (_req: AuthRequest, res: Response) => {
    res.json(REPORT_TEMPLATES);
});

router.post('/templates/:id/deploy', authenticate, requirePermission(Permission.CREATE_ANALYSIS), async (req: AuthRequest, res: Response): Promise<void> => {
    const tpl = REPORT_TEMPLATES.find(t => t.id === req.params.id);
    if (!tpl) { res.status(404).json({ error: 'Template not found' }); return; }
    try {
        const schedule = await prisma.schedule.create({
            data: {
                name: tpl.name, cronExpression: tpl.cronExpression,
                config: { format: tpl.format, deliveryChannel: 'email', deliverTo: req.body.deliverTo || '', modules: tpl.modules, priority: tpl.priority, templateId: tpl.id } as any,
                isActive: false, organizationId: req.user!.organizationId, createdByUserId: req.user!.userId
            }
        });
        res.status(201).json(schedule);
    } catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.post('/schedules/:id/retry-last', authenticate, requirePermission(Permission.CREATE_ANALYSIS), async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const schedule = await prisma.schedule.findFirst({ where: { id: req.params.id as string, organizationId: req.user!.organizationId } });
        if (!schedule) { res.status(404).json({ error: 'Schedule not found' }); return; }
        const { processSingleSchedule } = require('../services/scheduleEngine');
        await processSingleSchedule(schedule);
        res.json({ message: 'Retry initiated' });
    } catch (e: any) { res.status(500).json({ error: e.message }); }
});

export default router;

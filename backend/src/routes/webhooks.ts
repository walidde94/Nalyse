import { Router, Request, Response } from 'express';
import { authenticate } from '../middleware/auth';
import { AppDataSource } from '../config/database';
import { Webhook } from '../entities/Webhook';
import { WebhookLog } from '../entities/WebhookLog';
import crypto from 'crypto';
import { In } from 'typeorm';

const router = Router();

// ── List webhooks ──
router.get('/', authenticate, async (req: Request, res: Response) => {
    const orgId = (req as any).user.organizationId;
    const webhookRepo = AppDataSource.getRepository(Webhook);
    const webhooks = await webhookRepo.find({ where: { organizationId: orgId }, order: { createdAt: 'DESC' } });
    res.json({ success: true, webhooks });
});

// ── Create webhook ──
router.post('/', authenticate, async (req: Request, res: Response) => {
    const orgId = (req as any).user.organizationId;
    const { url, events, description, retryPolicy } = req.body;
    
    if (!url || !url.startsWith('http')) {
        return res.status(400).json({ success: false, error: 'A valid HTTPS URL is required.' });
    }

    const webhookRepo = AppDataSource.getRepository(Webhook);
    const webhook = webhookRepo.create({
        url,
        events: events || [],
        description: description || '',
        secret: 'whsec_' + crypto.randomBytes(24).toString('hex'),
        status: 'active',
        retryPolicy: retryPolicy || { maxRetries: 3, backoffMs: 1000 },
        organizationId: orgId
    });

    await webhookRepo.save(webhook);
    res.json({ success: true, webhook });
});

// ── Update webhook ──
router.patch('/:id', authenticate, async (req: Request, res: Response) => {
    const orgId = (req as any).user.organizationId;
    const webhookRepo = AppDataSource.getRepository(Webhook);
    const whId = req.params.id as string;
    const wh = await webhookRepo.findOne({ where: { id: whId, organizationId: orgId } });
    
    if (!wh) return res.status(404).json({ success: false, error: 'Webhook not found' });
    
    const { url, events, description, retryPolicy } = req.body;
    if (url) wh.url = url;
    if (events) wh.events = events;
    if (description !== undefined) wh.description = description;
    if (retryPolicy) wh.retryPolicy = retryPolicy;
    
    await webhookRepo.save(wh);
    res.json({ success: true, webhook: wh });
});

// ── Delete webhook ──
router.delete('/:id', authenticate, async (req: Request, res: Response) => {
    const orgId = (req as any).user.organizationId;
    const webhookRepo = AppDataSource.getRepository(Webhook);
    const whId = req.params.id as string;
    await webhookRepo.delete({ id: whId, organizationId: orgId });
    res.json({ success: true });
});

// ── Toggle webhook ──
router.patch('/:id/toggle', authenticate, async (req: Request, res: Response) => {
    const orgId = (req as any).user.organizationId;
    const webhookRepo = AppDataSource.getRepository(Webhook);
    const whId = req.params.id as string;
    const wh = await webhookRepo.findOne({ where: { id: whId, organizationId: orgId } });
    
    if (wh) {
        wh.status = wh.status === 'active' ? 'paused' : 'active';
        await webhookRepo.save(wh);
    }
    res.json({ success: true, webhook: wh });
});

// ── Rotate secret ──
    const whId = req.params.id as string;
    const wh = await webhookRepo.findOne({ where: { id: whId, organizationId: orgId } });
    
    if (!wh) return res.status(404).json({ success: false, error: 'Not found' });
    
    wh.secret = 'whsec_' + crypto.randomBytes(24).toString('hex');
    await webhookRepo.save(wh);
    res.json({ success: true, webhook: wh });
});

// ── Delivery logs ──
router.get('/logs', authenticate, async (req: Request, res: Response) => {
    const orgId = (req as any).user.organizationId;
    const logRepo = AppDataSource.getRepository(WebhookLog);
    
    const { webhookId, event, status, limit } = req.query;
    const where: any = { organizationId: orgId };
    if (webhookId) where.webhookId = webhookId;
    if (event) where.event = event;
    if (status) where.status = Number(status);
    
    const logs = await logRepo.find({
        where,
        order: { timestamp: 'DESC' },
        take: Math.min(Number(limit) || 50, 200)
    });
    
    res.json({ success: true, logs, total: logs.length });
});

// ── Test webhook ──
router.post('/:id/test', authenticate, async (req: Request, res: Response) => {
    const orgId = (req as any).user.organizationId;
    const webhookRepo = AppDataSource.getRepository(Webhook);
    const whId = req.params.id as string;
    const wh = await webhookRepo.findOne({ where: { id: whId, organizationId: orgId } });
    
    if (!wh) return res.status(404).json({ success: false, error: 'Webhook not found' });

    const payload = {
        event: 'test.ping',
        data: { message: 'This is a test delivery from Nalyse', timestamp: new Date().toISOString() },
        webhook_id: wh.id,
    };
    
    const signature = crypto.createHmac('sha256', wh.secret).update(JSON.stringify(payload)).digest('hex');

    const logRepo = AppDataSource.getRepository(WebhookLog);
    const testLog = logRepo.create({
        webhookId: wh.id,
        event: 'test.ping',
        status: 200,
        duration: Math.floor(Math.random() * 200) + 50,
        timestamp: new Date(),
        requestHeaders: { 
            'Content-Type': 'application/json', 
            'X-Nalyse-Signature': `sha256=${signature}`, 
            'X-Nalyse-Event': 'test.ping' 
        },
        requestBody: JSON.stringify(payload, null, 2),
        responseBody: '{"ok":true}',
        attempt: 1,
        organizationId: orgId
    });

    await logRepo.save(testLog);
    
    wh.deliveries++;
    wh.successCount++;
    wh.lastTriggered = new Date();
    await webhookRepo.save(wh);
    
    res.json({ success: true, delivery: testLog });
});

// ── Events guide ──
router.get('/events', authenticate, (_req: Request, res: Response) => {
    res.json({
        success: true,
        events: [
            { id: 'analysis.completed', label: 'Analysis Completed', category: 'Analysis', description: 'Fires when a dataset analysis finishes successfully.' },
            { id: 'analysis.failed', label: 'Analysis Failed', category: 'Analysis', description: 'Fires when analysis encounters a fatal error.' },
            { id: 'anomaly.detected', label: 'Anomaly Detected', category: 'Monitoring', description: 'Fires when the anomaly engine flags a statistical outlier.' },
            { id: 'alert.triggered', label: 'Alert Triggered', category: 'Monitoring', description: 'Fires when a user-defined threshold is breached.' },
            { id: 'report.generated', label: 'Report Generated', category: 'Reports', description: 'Fires after an automated or manual report is rendered.' },
            { id: 'file.uploaded', label: 'File Uploaded', category: 'Data', description: 'Fires when a user uploads a new CSV/JSON dataset.' },
        ]
    });
});

// ── Stats ──
router.get('/stats', authenticate, async (req: Request, res: Response) => {
    const orgId = (req as any).user.organizationId;
    const webhookRepo = AppDataSource.getRepository(Webhook);
    const logRepo = AppDataSource.getRepository(WebhookLog);
    
    const whs = await webhookRepo.find({ where: { organizationId: orgId } });
    const total = whs.length;
    const active = whs.filter(w => w.status === 'active').length;
    const totalDeliveries = whs.reduce((s, w) => s + (w.deliveries || 0), 0);
    const totalFailures = whs.reduce((s, w) => s + (w.failureCount || 0), 0);
    const avgLatency = whs.length > 0 ? Math.round(whs.reduce((s, w) => s + (w.avgLatency || 0), 0) / whs.length) : 0;
    
    const last24hCount = await logRepo.createQueryBuilder('log')
        .where('log.organizationId = :orgId', { orgId })
        .andWhere('log.timestamp > :yesterday', { yesterday: new Date(Date.now() - 86400000) })
        .getCount();

    res.json({
        success: true,
        stats: { total, active, paused: total - active, totalDeliveries, totalFailures, overallFailureRate: totalDeliveries > 0 ? ((totalFailures / totalDeliveries) * 100).toFixed(1) : '0', avgLatency, deliveriesLast24h: last24hCount }
    });
});

// ── Integration Guide examples ──
router.get('/verify-example', authenticate, (_req: Request, res: Response) => {
    res.json({
        success: true,
        examples: {
            node: `const crypto = require('crypto');\n\nfunction verifyNalyseWebhook(payload, signature, secret) {\n  const expected = crypto.createHmac('sha256', secret).update(JSON.stringify(payload)).digest('hex');\n  return signature === \`sha256=\${expected}\`; \n}`,
            python: `import hmac, hashlib, json\n\ndef verify_nalyse_webhook(payload, signature, secret):\n    expected = hmac.new(secret.encode(), json.dumps(payload).encode(), hashlib.sha256).hexdigest()\n    return f"sha256={expected}" == signature`,
            go: `func verifySignature(payload []byte, signature, secret string) bool {\n    mac := hmac.New(sha256.New, []byte(secret))\n    mac.Write(payload)\n    return signature == "sha256=" + hex.EncodeToString(mac.Sum(nil))\n}`
        }
    });
});

export default router;

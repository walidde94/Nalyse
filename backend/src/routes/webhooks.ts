import { Router, Request, Response } from 'express';
import { authenticate } from '../middleware/auth';
import crypto from 'crypto';

const router = Router();

// In-memory webhook store
let webhooks: any[] = [
    {
        id: 'wh-1',
        url: 'https://hooks.slack.com/services/T00/B00/xyz',
        events: ['analysis.completed', 'anomaly.detected'],
        secret: 'whsec_' + crypto.randomBytes(16).toString('hex'),
        status: 'active',
        createdAt: new Date(Date.now() - 86400000 * 3).toISOString(),
        lastTriggered: new Date(Date.now() - 3600000).toISOString(),
        deliveries: 47,
        failureRate: 2.1
    },
    {
        id: 'wh-2',
        url: 'https://api.company.com/webhooks/nalyse',
        events: ['report.generated', 'alert.triggered'],
        secret: 'whsec_' + crypto.randomBytes(16).toString('hex'),
        status: 'active',
        createdAt: new Date(Date.now() - 86400000 * 7).toISOString(),
        lastTriggered: new Date(Date.now() - 7200000).toISOString(),
        deliveries: 128,
        failureRate: 0.8
    }
];

let webhookLogs: any[] = [
    { id: 'wl-1', webhookId: 'wh-1', event: 'analysis.completed', status: 200, duration: 142, timestamp: new Date(Date.now() - 3600000).toISOString() },
    { id: 'wl-2', webhookId: 'wh-2', event: 'report.generated', status: 200, duration: 98, timestamp: new Date(Date.now() - 7200000).toISOString() },
    { id: 'wl-3', webhookId: 'wh-1', event: 'anomaly.detected', status: 500, duration: 5002, timestamp: new Date(Date.now() - 14400000).toISOString() },
    { id: 'wl-4', webhookId: 'wh-2', event: 'alert.triggered', status: 200, duration: 67, timestamp: new Date(Date.now() - 21600000).toISOString() },
];

// List webhooks
router.get('/', authenticate, (req: Request, res: Response) => {
    res.json({ success: true, webhooks });
});

// Create webhook
router.post('/', authenticate, (req: Request, res: Response) => {
    const { url, events } = req.body;
    const webhook = {
        id: `wh-${Date.now()}`,
        url,
        events: events || [],
        secret: 'whsec_' + crypto.randomBytes(16).toString('hex'),
        status: 'active',
        createdAt: new Date().toISOString(),
        lastTriggered: null,
        deliveries: 0,
        failureRate: 0
    };
    webhooks.push(webhook);
    res.json({ success: true, webhook });
});

// Delete webhook
router.delete('/:id', authenticate, (req: Request, res: Response) => {
    webhooks = webhooks.filter(w => w.id !== req.params.id);
    res.json({ success: true });
});

// Toggle webhook
router.patch('/:id/toggle', authenticate, (req: Request, res: Response) => {
    const wh = webhooks.find(w => w.id === req.params.id);
    if (wh) wh.status = wh.status === 'active' ? 'paused' : 'active';
    res.json({ success: true, webhook: wh });
});

// Get delivery logs
router.get('/logs', authenticate, (req: Request, res: Response) => {
    res.json({ success: true, logs: webhookLogs });
});

// Test webhook
router.post('/:id/test', authenticate, (req: Request, res: Response) => {
    const wh = webhooks.find(w => w.id === req.params.id);
    if (!wh) return res.status(404).json({ success: false, error: 'Webhook not found' });

    // Simulate a test delivery
    const testLog = {
        id: `wl-${Date.now()}`,
        webhookId: wh.id,
        event: 'test.ping',
        status: 200,
        duration: Math.floor(Math.random() * 200) + 50,
        timestamp: new Date().toISOString()
    };
    webhookLogs.unshift(testLog);
    res.json({ success: true, delivery: testLog });
});

// Available events
router.get('/events', authenticate, (req: Request, res: Response) => {
    res.json({
        success: true,
        events: [
            { id: 'analysis.completed', label: 'Analysis Completed', category: 'Analysis' },
            { id: 'analysis.failed', label: 'Analysis Failed', category: 'Analysis' },
            { id: 'anomaly.detected', label: 'Anomaly Detected', category: 'Monitoring' },
            { id: 'alert.triggered', label: 'Alert Triggered', category: 'Monitoring' },
            { id: 'report.generated', label: 'Report Generated', category: 'Reports' },
            { id: 'report.scheduled', label: 'Report Scheduled', category: 'Reports' },
            { id: 'user.login', label: 'User Login', category: 'Security' },
            { id: 'user.created', label: 'User Created', category: 'Security' },
            { id: 'file.uploaded', label: 'File Uploaded', category: 'Data' },
            { id: 'connector.synced', label: 'Connector Synced', category: 'Data' },
        ]
    });
});

export default router;

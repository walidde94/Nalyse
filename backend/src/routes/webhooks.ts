import { Router, Request, Response } from 'express';
import { authenticate } from '../middleware/auth';
import crypto from 'crypto';

const router = Router();

// ── Persistent in-memory store (production would use DB) ──
let webhooks: any[] = [
    {
        id: 'wh-1',
        url: 'https://hooks.slack.com/services/T00/B00/xyz',
        events: ['analysis.completed', 'anomaly.detected'],
        secret: 'whsec_' + crypto.randomBytes(16).toString('hex'),
        status: 'active',
        description: 'Slack alerts for analysis pipeline',
        retryPolicy: { maxRetries: 3, backoffMs: 1000 },
        createdAt: new Date(Date.now() - 86400000 * 3).toISOString(),
        lastTriggered: new Date(Date.now() - 3600000).toISOString(),
        deliveries: 47, successCount: 46, failureCount: 1, failureRate: 2.1,
        avgLatency: 142,
    },
    {
        id: 'wh-2',
        url: 'https://api.company.com/webhooks/nalyse',
        events: ['report.generated', 'alert.triggered', 'file.uploaded'],
        secret: 'whsec_' + crypto.randomBytes(16).toString('hex'),
        status: 'active',
        description: 'Internal ERP sync',
        retryPolicy: { maxRetries: 5, backoffMs: 2000 },
        createdAt: new Date(Date.now() - 86400000 * 7).toISOString(),
        lastTriggered: new Date(Date.now() - 7200000).toISOString(),
        deliveries: 128, successCount: 127, failureCount: 1, failureRate: 0.8,
        avgLatency: 98,
    }
];

let webhookLogs: any[] = [
    { id: 'wl-1', webhookId: 'wh-1', event: 'analysis.completed', status: 200, duration: 142, timestamp: new Date(Date.now() - 3600000).toISOString(), requestHeaders: { 'Content-Type': 'application/json', 'X-Nalyse-Signature': 'sha256=abc...' }, requestBody: '{"event":"analysis.completed","data":{"datasetId":"ds-001"}}', responseBody: '{"ok":true}', attempt: 1 },
    { id: 'wl-2', webhookId: 'wh-2', event: 'report.generated', status: 200, duration: 98, timestamp: new Date(Date.now() - 7200000).toISOString(), requestHeaders: { 'Content-Type': 'application/json' }, requestBody: '{"event":"report.generated","data":{"reportId":"rpt-42"}}', responseBody: '{"received":true}', attempt: 1 },
    { id: 'wl-3', webhookId: 'wh-1', event: 'anomaly.detected', status: 500, duration: 5002, timestamp: new Date(Date.now() - 14400000).toISOString(), requestHeaders: {}, requestBody: '{"event":"anomaly.detected"}', responseBody: 'Internal Server Error', attempt: 3 },
    { id: 'wl-4', webhookId: 'wh-2', event: 'alert.triggered', status: 200, duration: 67, timestamp: new Date(Date.now() - 21600000).toISOString(), requestHeaders: {}, requestBody: '{"event":"alert.triggered"}', responseBody: '{"ok":true}', attempt: 1 },
    { id: 'wl-5', webhookId: 'wh-1', event: 'analysis.completed', status: 200, duration: 112, timestamp: new Date(Date.now() - 28800000).toISOString(), requestHeaders: {}, requestBody: '{}', responseBody: '{"ok":true}', attempt: 1 },
    { id: 'wl-6', webhookId: 'wh-2', event: 'file.uploaded', status: 200, duration: 78, timestamp: new Date(Date.now() - 36000000).toISOString(), requestHeaders: {}, requestBody: '{}', responseBody: '{"ok":true}', attempt: 1 },
];

// ── List webhooks ──
router.get('/', authenticate, (_req: Request, res: Response) => {
    res.json({ success: true, webhooks });
});

// ── Create webhook ──
router.post('/', authenticate, (req: Request, res: Response) => {
    const { url, events, description, retryPolicy } = req.body;
    if (!url || !url.startsWith('http')) return res.status(400).json({ success: false, error: 'A valid HTTPS URL is required.' });
    const webhook = {
        id: `wh-${Date.now()}`,
        url,
        events: events || [],
        description: description || '',
        secret: 'whsec_' + crypto.randomBytes(24).toString('hex'),
        status: 'active',
        retryPolicy: retryPolicy || { maxRetries: 3, backoffMs: 1000 },
        createdAt: new Date().toISOString(),
        lastTriggered: null,
        deliveries: 0, successCount: 0, failureCount: 0, failureRate: 0,
        avgLatency: 0,
    };
    webhooks.push(webhook);
    res.json({ success: true, webhook });
});

// ── Update webhook ──
router.patch('/:id', authenticate, (req: Request, res: Response) => {
    const wh = webhooks.find(w => w.id === req.params.id);
    if (!wh) return res.status(404).json({ success: false, error: 'Webhook not found' });
    const { url, events, description, retryPolicy } = req.body;
    if (url) wh.url = url;
    if (events) wh.events = events;
    if (description !== undefined) wh.description = description;
    if (retryPolicy) wh.retryPolicy = retryPolicy;
    res.json({ success: true, webhook: wh });
});

// ── Delete webhook ──
router.delete('/:id', authenticate, (req: Request, res: Response) => {
    webhooks = webhooks.filter(w => w.id !== req.params.id);
    res.json({ success: true });
});

// ── Toggle webhook ──
router.patch('/:id/toggle', authenticate, (req: Request, res: Response) => {
    const wh = webhooks.find(w => w.id === req.params.id);
    if (wh) wh.status = wh.status === 'active' ? 'paused' : 'active';
    res.json({ success: true, webhook: wh });
});

// ── Rotate secret ──
router.post('/:id/rotate-secret', authenticate, (req: Request, res: Response) => {
    const wh = webhooks.find(w => w.id === req.params.id);
    if (!wh) return res.status(404).json({ success: false, error: 'Not found' });
    wh.secret = 'whsec_' + crypto.randomBytes(24).toString('hex');
    res.json({ success: true, webhook: wh });
});

// ── Delivery logs with filtering ──
router.get('/logs', authenticate, (req: Request, res: Response) => {
    let result = [...webhookLogs];
    const { webhookId, event, status, limit } = req.query;
    if (webhookId) result = result.filter(l => l.webhookId === webhookId);
    if (event) result = result.filter(l => l.event === event);
    if (status) result = result.filter(l => String(l.status) === status);
    const max = Math.min(Number(limit) || 50, 200);
    res.json({ success: true, logs: result.slice(0, max), total: result.length });
});

// ── Single log detail ──
router.get('/logs/:id', authenticate, (req: Request, res: Response) => {
    const log = webhookLogs.find(l => l.id === req.params.id);
    if (!log) return res.status(404).json({ success: false, error: 'Log not found' });
    res.json({ success: true, log });
});

// ── Test webhook (simulate delivery) ──
router.post('/:id/test', authenticate, (req: Request, res: Response) => {
    const wh = webhooks.find(w => w.id === req.params.id);
    if (!wh) return res.status(404).json({ success: false, error: 'Webhook not found' });

    const payload = {
        event: 'test.ping',
        data: { message: 'This is a test delivery from Nalyse', timestamp: new Date().toISOString() },
        webhook_id: wh.id,
    };
    const signature = crypto.createHmac('sha256', wh.secret).update(JSON.stringify(payload)).digest('hex');

    const testLog = {
        id: `wl-${Date.now()}`,
        webhookId: wh.id,
        event: 'test.ping',
        status: 200,
        duration: Math.floor(Math.random() * 200) + 50,
        timestamp: new Date().toISOString(),
        requestHeaders: { 'Content-Type': 'application/json', 'X-Nalyse-Signature': `sha256=${signature}`, 'X-Nalyse-Event': 'test.ping' },
        requestBody: JSON.stringify(payload, null, 2),
        responseBody: '{"ok":true}',
        attempt: 1,
    };
    webhookLogs.unshift(testLog);
    wh.deliveries++;
    wh.successCount++;
    wh.lastTriggered = testLog.timestamp;
    res.json({ success: true, delivery: testLog });
});

// ── Available events (categorized) ──
router.get('/events', authenticate, (_req: Request, res: Response) => {
    res.json({
        success: true,
        events: [
            { id: 'analysis.completed', label: 'Analysis Completed', category: 'Analysis', description: 'Fires when a dataset analysis finishes successfully.' },
            { id: 'analysis.failed', label: 'Analysis Failed', category: 'Analysis', description: 'Fires when analysis encounters a fatal error.' },
            { id: 'anomaly.detected', label: 'Anomaly Detected', category: 'Monitoring', description: 'Fires when the anomaly engine flags a statistical outlier.' },
            { id: 'alert.triggered', label: 'Alert Triggered', category: 'Monitoring', description: 'Fires when a user-defined threshold is breached.' },
            { id: 'report.generated', label: 'Report Generated', category: 'Reports', description: 'Fires after an automated or manual report is rendered.' },
            { id: 'report.scheduled', label: 'Report Scheduled', category: 'Reports', description: 'Fires when a new scheduled report job is created.' },
            { id: 'file.uploaded', label: 'File Uploaded', category: 'Data', description: 'Fires when a user uploads a new CSV/JSON dataset.' },
            { id: 'file.deleted', label: 'File Deleted', category: 'Data', description: 'Fires when a dataset is removed from storage.' },
            { id: 'connector.synced', label: 'Connector Synced', category: 'Data', description: 'Fires when a live data connector completes a sync cycle.' },
            { id: 'user.login', label: 'User Login', category: 'Security', description: 'Fires on successful authentication.' },
            { id: 'user.created', label: 'User Created', category: 'Security', description: 'Fires when a new team member is invited and registered.' },
            { id: 'subscription.changed', label: 'Subscription Changed', category: 'Billing', description: 'Fires when the organization plan is upgraded or downgraded.' },
        ]
    });
});

// ── Webhook health / stats overview ──
router.get('/stats', authenticate, (_req: Request, res: Response) => {
    const total = webhooks.length;
    const active = webhooks.filter(w => w.status === 'active').length;
    const totalDeliveries = webhooks.reduce((s, w) => s + w.deliveries, 0);
    const totalFailures = webhooks.reduce((s, w) => s + w.failureCount, 0);
    const avgLatency = webhooks.length > 0 ? Math.round(webhooks.reduce((s, w) => s + w.avgLatency, 0) / webhooks.length) : 0;
    const last24h = webhookLogs.filter(l => Date.now() - new Date(l.timestamp).getTime() < 86400000).length;
    res.json({
        success: true,
        stats: { total, active, paused: total - active, totalDeliveries, totalFailures, overallFailureRate: totalDeliveries > 0 ? ((totalFailures / totalDeliveries) * 100).toFixed(1) : '0', avgLatency, deliveriesLast24h: last24h }
    });
});

// ── Signature verification example endpoint ──
router.get('/verify-example', authenticate, (_req: Request, res: Response) => {
    res.json({
        success: true,
        examples: {
            node: `const crypto = require('crypto');

function verifyNalyseWebhook(payload, signature, secret) {
  const expected = crypto
    .createHmac('sha256', secret)
    .update(JSON.stringify(payload))
    .digest('hex');
  return crypto.timingSafeEqual(
    Buffer.from(\`sha256=\${expected}\`),
    Buffer.from(signature)
  );
}

// In your Express handler:
app.post('/webhooks/nalyse', (req, res) => {
  const sig = req.headers['x-nalyse-signature'];
  if (!verifyNalyseWebhook(req.body, sig, process.env.NALYSE_WEBHOOK_SECRET)) {
    return res.status(401).send('Invalid signature');
  }
  const event = req.headers['x-nalyse-event'];
  console.log('Received event:', event, req.body);
  res.json({ ok: true });
});`,
            python: `import hmac, hashlib, json
from flask import Flask, request, abort

app = Flask(__name__)

def verify_nalyse_webhook(payload, signature, secret):
    expected = hmac.new(
        secret.encode(), json.dumps(payload).encode(), hashlib.sha256
    ).hexdigest()
    return hmac.compare_digest(f"sha256={expected}", signature)

@app.route('/webhooks/nalyse', methods=['POST'])
def handle_webhook():
    sig = request.headers.get('X-Nalyse-Signature', '')
    if not verify_nalyse_webhook(request.json, sig, 'your_secret'):
        abort(401)
    event = request.headers.get('X-Nalyse-Event')
    print(f"Event: {event}", request.json)
    return {"ok": True}`,
            go: `package main

import (
    "crypto/hmac"
    "crypto/sha256"
    "encoding/hex"
    "encoding/json"
    "fmt"
    "io"
    "net/http"
)

func verifySignature(payload []byte, signature, secret string) bool {
    mac := hmac.New(sha256.New, []byte(secret))
    mac.Write(payload)
    expected := "sha256=" + hex.EncodeToString(mac.Sum(nil))
    return hmac.Equal([]byte(expected), []byte(signature))
}

func webhookHandler(w http.ResponseWriter, r *http.Request) {
    body, _ := io.ReadAll(r.Body)
    sig := r.Header.Get("X-Nalyse-Signature")
    if !verifySignature(body, sig, "your_secret") {
        http.Error(w, "Unauthorized", 401)
        return
    }
    fmt.Println("Event:", r.Header.Get("X-Nalyse-Event"))
    w.Write([]byte(\`{"ok":true}\`))
}

func main() {
    http.HandleFunc("/webhooks/nalyse", webhookHandler)
    http.ListenAndServe(":8080", nil)
}`
        }
    });
});

export default router;

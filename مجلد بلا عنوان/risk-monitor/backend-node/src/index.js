const express = require('express');
const cors = require('cors');
const db = require('./db');
const { spawn } = require('child_process');
const path = require('path');
const { authMiddleware } = require('./auth');
const authRoutes = require('./routes/auth');

const app = express();
app.use(cors());
app.use(express.json());

// Serve static scan data (screenshots)
// Files will be accessible at http://localhost:8080/data/scans/...
app.use('/data', express.static(path.join(__dirname, '../../data')));

const PORT = 8080;

// Auth Routes (public)
app.use('/api/v1/auth', authRoutes);

// -- Protected Routes --

// GET /websites
app.get('/api/v1/websites', authMiddleware, async (req, res) => {
    try {
        const result = await db.query(
            'SELECT * FROM websites WHERE user_id = $1 ORDER BY created_at DESC',
            [req.user.userId]
        );
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST /websites
app.post('/api/v1/websites', authMiddleware, async (req, res) => {
    const { url, scan_interval_minutes } = req.body;
    try {
        const result = await db.query(
            'INSERT INTO websites (url, scan_interval_minutes, user_id) VALUES ($1, $2, $3) RETURNING *',
            [url, scan_interval_minutes || 1440, req.user.userId]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// DELETE /websites/:id
app.delete('/api/v1/websites/:id', authMiddleware, async (req, res) => {
    const { id } = req.params;
    try {
        await db.query('DELETE FROM websites WHERE id = $1 AND user_id = $2', [id, req.user.userId]);
        res.json({ message: "Website deleted" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET /websites/:id/latest-scan
app.get('/api/v1/websites/:id/latest-scan', authMiddleware, async (req, res) => {
    const { id } = req.params;
    try {
        // Get latest finished scan
        const scanRes = await db.query(`
            SELECT * FROM scans 
            WHERE website_id = $1 AND finished_at IS NOT NULL 
            ORDER BY finished_at DESC LIMIT 1
        `, [id]);

        if (scanRes.rows.length === 0) {
            return res.status(404).json({ message: "No scans found" });
        }

        const scan = scanRes.rows[0];

        // Get Cookie Check
        const cookieRes = await db.query('SELECT * FROM cookie_banner_checks WHERE scan_id = $1', [scan.id]);
        scan.cookie_check = cookieRes.rows[0] || null;

        // Get URL Check
        const urlRes = await db.query('SELECT * FROM scan_urls WHERE scan_id = $1', [scan.id]);
        scan.url_checks = urlRes.rows;

        res.json(scan);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET /websites/:id/history
app.get('/api/v1/websites/:id/history', authMiddleware, async (req, res) => {
    const { id } = req.params;
    try {
        const result = await db.query(`
            SELECT s.id, s.finished_at, s.overall_status,
            (SELECT COUNT(*) FROM issues i WHERE i.first_seen_scan_id = s.id) as new_issues_count,
            (SELECT COUNT(*) FROM scan_urls u WHERE u.scan_id = s.id AND u.error_type != 'none') as broken_links_count
            FROM scans s
            WHERE s.website_id = $1 AND s.finished_at IS NOT NULL
            ORDER BY s.finished_at DESC
            LIMIT 10
        `, [id]);
        res.json(result.rows.reverse()); // Return oldest to newest for charts
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST /websites/:id/scan (Trigger Scan)
app.post('/api/v1/websites/:id/scan', authMiddleware, async (req, res) => {
    const { id } = req.params;
    try {
        // 1. Create Scan Record
        const scanRes = await db.query(
            'INSERT INTO scans (website_id, started_at, overall_status) VALUES ($1, NOW(), $2) RETURNING id',
            [id, 'ok'] // Start as OK, update later
        );
        const scanId = scanRes.rows[0].id;

        // 2. Trigger Worker (Async)
        runScanWork(scanId, id);

        res.status(202).json({ scan_id: scanId, message: "Scan started" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});

const workerBridge = require('./worker_bridge');
const crawler = require('./crawler');

// Worker Logic
async function runScanWork(scanId, websiteId) {
    console.log(`[Worker] Starting scan ${scanId} for website ${websiteId}`);

    // Fetch URL
    const webRes = await db.query('SELECT url FROM websites WHERE id=$1', [websiteId]);
    if (webRes.rows.length === 0) return;
    const targetUrl = webRes.rows[0].url;

    try {
        // Step 1: Cookie Banner Check (via Playwright)
        try {
            const cookieResult = await workerBridge.checkCookieBanner(targetUrl, scanId);
            const bannerDetected = cookieResult.banner_detected;
            console.log(`[Worker] Cookie Banner Result: ${bannerDetected}`);

            await db.query(`
                INSERT INTO cookie_banner_checks (scan_id, banner_detected, screenshot_path) 
                VALUES ($1, $2, $3)
            `, [scanId, bannerDetected, `data/scans/${scanId}/screenshot.png`]);

        } catch (e) {
            console.error(`[Worker] Cookie check failed: ${e.message}`);
        }

        // Step 2: Deep Audit (NEW - Enterprise Features)
        try {
            console.log("[Worker] Starting Deep Audit...");
            const auditResult = await workerBridge.performDeepAudit(targetUrl, scanId + '_audit');

            // Store audit results in scan record
            await db.query(`
                UPDATE scans 
                SET ssl_info = $1, performance_metrics = $2, security_headers = $3, seo_meta = $4, legal_compliance = $5
                WHERE id = $6
            `, [
                JSON.stringify(auditResult.ssl_info),
                JSON.stringify(auditResult.performance_metrics),
                JSON.stringify(auditResult.security_headers),
                JSON.stringify(auditResult.seo_meta),
                JSON.stringify(auditResult.legal_compliance),
                scanId
            ]);

            console.log("[Worker] Deep Audit Complete");
        } catch (e) {
            console.error(`[Worker] Deep audit failed: ${e.message}`);
        }

        // Step 3: Deep Crawl
        // We run this AFTER cookie check so specific pages are hit
        console.log("[Worker] Starting Deep Crawl...");
        await crawler.crawl(websiteId, scanId, targetUrl, 2);

        // Finish
        await db.query(`
            UPDATE scans 
            SET finished_at = NOW(), overall_status = 'ok' 
            WHERE id = $1
        `, [scanId]);

        console.log(`[Worker] Scan ${scanId} finished`);

    } catch (e) {
        console.error(`[Worker] Scan ${scanId} failed: ${e.message}`);
        await db.query(`UPDATE scans SET overall_status='critical' WHERE id=$1`, [scanId]);
    }
}

app.listen(PORT, () => {
    console.log(`Node Backend running on port ${PORT}`);
});

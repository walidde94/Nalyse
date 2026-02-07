const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

// RPC Interface over Stdin/Stdout
// Input line: JSON { "id": "...", "url": "...", "check": "cookie_banner", "output": "..." }
// Output line: JSON { "id": "...", "success": true, ... }

const readline = require('readline');
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    terminal: false
});

let browser;

async function init() {
    browser = await chromium.launch({ headless: true });
    log("Browser launched");
}

function log(msg) {
    // Stdout is for results, so log to stderr
    console.error(`[Worker] ${msg}`);
}

async function checkCookieBanner(url, outputPath) {
    const page = await browser.newPage();
    try {
        log(`Navigating to ${url}`);

        // 1. Goto Page
        await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });

        // 2. Wait a bit for JS to execute
        await page.waitForTimeout(2000);

        // 3. Take Screenshot
        // Ensure dir exists
        const dir = path.dirname(outputPath);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        await page.screenshot({ path: outputPath, fullPage: false });

        // 4. Detect Banner (Heuristic)
        // Common selectors for cookie banners
        const selectors = [
            '#onetrust-banner-sdk',
            '.cookie-banner',
            '[id*="cookie"]',
            '[class*="cookie"]',
            '[id*="consent"]',
            '[class*="consent"]'
        ];

        let detected = false;
        for (const sel of selectors) {
            if (await page.$(sel)) {
                detected = true;
                break;
            }
        }

        // Check for "Accept" or "Agree" buttons as a secondary heuristic
        if (!detected) {
            const textContent = (await page.content()).toLowerCase();
            // Keywords: English + German (Advanced)
            const privacyKeywords = ['cookie', 'consent', 'privacy', 'datenschutz', 'tracking', 'personalisierung'];
            const actionKeywords = ['accept', 'agree', 'allow', 'stimme zu', 'akzeptieren', 'einverstanden', 'alles erlauben', 'okay', 'verstanden', 'auswahl bestätigen'];

            const hasPrivacy = privacyKeywords.some(k => textContent.includes(k));
            const hasAction = actionKeywords.some(k => textContent.includes(k));

            if (hasPrivacy && hasAction) {
                detected = true;
            }
        }

        return { detected };

    } catch (err) {
        throw err;
    } finally {
        await page.close();
    }
}

async function performDeepAudit(url) {
    const page = await browser.newPage();
    const results = {};

    try {
        log(`Deep audit for ${url}`);

        // Navigate
        const response = await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });

        // 1. SSL/TLS Certificate Info
        const securityDetails = response.securityDetails();
        results.ssl_info = securityDetails ? {
            protocol: securityDetails.protocol(),
            issuer: securityDetails.issuer(),
            validFrom: securityDetails.validFrom(),
            validTo: securityDetails.validTo(),
            subjectName: securityDetails.subjectName(),
            daysUntilExpiry: Math.floor((securityDetails.validTo() - Date.now()) / (1000 * 60 * 60 * 24))
        } : null;

        // 2. Performance Metrics
        const perfMetrics = await page.evaluate(() => {
            const perf = performance.getEntriesByType('navigation')[0];
            const paint = performance.getEntriesByType('paint');
            return {
                ttfb: perf ? perf.responseStart - perf.requestStart : 0,
                domContentLoaded: perf ? perf.domContentLoadedEventEnd - perf.domContentLoadedEventStart : 0,
                loadComplete: perf ? perf.loadEventEnd - perf.loadEventStart : 0,
                fcp: paint.find(p => p.name === 'first-contentful-paint')?.startTime || 0
            };
        });
        results.performance_metrics = perfMetrics;

        // 3. Security Headers
        const headers = response.headers();
        results.security_headers = {
            csp: headers['content-security-policy'] || null,
            xFrameOptions: headers['x-frame-options'] || null,
            hsts: headers['strict-transport-security'] || null,
            xContentType: headers['x-content-type-options'] || null,
            score: calculateSecurityScore(headers)
        };

        // 4. SEO Meta Tags
        const seoData = await page.evaluate(() => {
            return {
                title: document.querySelector('title')?.innerText || null,
                description: document.querySelector('meta[name="description"]')?.content || null,
                ogTitle: document.querySelector('meta[property="og:title"]')?.content || null,
                ogDescription: document.querySelector('meta[property="og:description"]')?.content || null,
                ogImage: document.querySelector('meta[property="og:image"]')?.content || null,
                canonical: document.querySelector('link[rel="canonical"]')?.href || null,
                robots: document.querySelector('meta[name="robots"]')?.content || null
            };
        });
        results.seo_meta = seoData;

        // 5. Legal/Compliance Links
        const legalData = await page.evaluate(() => {
            const links = Array.from(document.querySelectorAll('a'));
            return {
                privacyPolicy: links.some(l => /privacy|datenschutz/i.test(l.innerText)),
                termsOfService: links.some(l => /terms|agb|nutzungsbedingungen/i.test(l.innerText)),
                imprint: links.some(l => /imprint|impressum/i.test(l.innerText)),
                cookiePolicy: links.some(l => /cookie.*policy/i.test(l.innerText))
            };
        });
        results.legal_compliance = legalData;

        // 6. Accessibility Checks
        const a11yData = await page.evaluate(() => {
            const images = Array.from(document.querySelectorAll('img'));
            const buttons = Array.from(document.querySelectorAll('button, a'));
            return {
                imagesWithoutAlt: images.filter(img => !img.alt).length,
                totalImages: images.length,
                buttonsWithoutAriaLabel: buttons.filter(b => !b.getAttribute('aria-label') && !b.innerText.trim()).length,
                hasLangAttribute: !!document.documentElement.lang,
                viewport: document.querySelector('meta[name="viewport"]')?.content || null
            };
        });
        results.accessibility = a11yData;

        return results;

    } catch (err) {
        throw err;
    } finally {
        await page.close();
    }
}

function calculateSecurityScore(headers) {
    let score = 0;
    if (headers['content-security-policy']) score += 25;
    if (headers['x-frame-options']) score += 25;
    if (headers['strict-transport-security']) score += 25;
    if (headers['x-content-type-options']) score += 25;
    return score;
}

rl.on('line', async (line) => {
    if (!line.trim()) return;

    if (!browser) await init();

    let job;
    try {
        job = JSON.parse(line);
    } catch (e) {
        console.error("Invalid JSON input");
        return;
    }

    try {
        let result = {};
        if (job.check_type === 'cookie_banner') {
            const data = await checkCookieBanner(job.url, job.output_path);
            result = {
                job_id: job.job_id,
                success: true,
                data: {
                    banner_detected: data.detected,
                    screenshot_saved: true
                }
            };
        } else if (job.check_type === 'deep_audit') {
            const auditData = await performDeepAudit(job.url);
            result = {
                job_id: job.job_id,
                success: true,
                data: auditData
            };
        } else {
            throw new Error("Unknown check_type");
        }
        console.log(JSON.stringify(result));
    } catch (err) {
        console.log(JSON.stringify({
            job_id: job.job_id,
            success: false,
            error: err.message
        }));
    }
});

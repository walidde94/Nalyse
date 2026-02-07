const axios = require('axios');
const cheerio = require('cheerio');
const db = require('./db');

// Helper for creating issues
async function createIssue(websiteId, scanId, url, type, desc, severe) {
    try {
        await db.query(`
            INSERT INTO issues (website_id, issue_type, entity_identifier, first_seen_scan_id, status, severity)
            VALUES ($1, $2, $3, $4, 'open', $5)
            ON CONFLICT DO NOTHING
        `, [websiteId, type, url + " | " + desc, scanId, severe]);
    } catch (e) { console.error('Issue create failed', e.message); }
}

async function crawl(websiteId, scanId, startUrl, maxDepth = 2) {
    const queue = [{ url: startUrl, depth: 0 }];
    const visited = new Set();

    // Track stats
    let pagesScanned = 0;
    let brokenLinks = 0;

    console.log(`[Crawler] Starting deep scan for ${startUrl} (Depth: ${maxDepth})`);

    while (queue.length > 0) {
        const { url, depth } = queue.shift();

        if (visited.has(url)) continue;
        visited.add(url);

        try {
            console.log(`[Crawler] Visiting ${url}`);
            const res = await axios.get(url, {
                timeout: 5000,
                headers: { 'User-Agent': 'RiskMonitor/1.0' }
            });

            pagesScanned++;

            // Record Success
            await db.query(`
                INSERT INTO scan_urls (scan_id, url, http_status, error_type)
                VALUES ($1, $2, $3, 'none')
            `, [scanId, url, res.status]);

            // Parse Links & SEO
            if (res.headers['content-type'] && res.headers['content-type'].includes('text/html')) {
                const $ = cheerio.load(res.data);

                // --- SEO & QUALITY CHECKS ---
                const title = $('title').text().trim();
                const h1 = $('h1').length;
                const metaDesc = $('meta[name="description"]').attr('content') || $('meta[property="og:description"]').attr('content');

                // Check Title
                if (!title) {
                    await createIssue(websiteId, scanId, url, 'seo_missing_title', 'Missing Page Title', 'medium');
                } else if (title.length < 10) {
                    await createIssue(websiteId, scanId, url, 'seo_short_title', 'Title too short', 'low');
                }

                // Check H1
                if (h1 === 0) {
                    await createIssue(websiteId, scanId, url, 'seo_missing_h1', 'Missing H1 Heading', 'medium');
                } else if (h1 > 1) {
                    await createIssue(websiteId, scanId, url, 'seo_multiple_h1', 'Multiple H1 Headings', 'low');
                }

                // Check Meta Description
                if (!metaDesc) {
                    await createIssue(websiteId, scanId, url, 'seo_missing_meta', 'Missing Meta Description', 'medium');
                }

                // Find all links for recursion
                if (depth < maxDepth) {
                    $('a').each((i, el) => {
                        const href = $(el).attr('href');
                        if (!href) return;

                        try {
                            const absoluteUrl = new URL(href, startUrl).href;
                            // Only follow internal links
                            if (absoluteUrl.startsWith(startUrl) && !visited.has(absoluteUrl)) {
                                queue.push({ url: absoluteUrl, depth: depth + 1 });
                            }
                        } catch (e) { }
                    });
                }
            }

        } catch (e) {
            console.error(`[Crawler] Failed ${url}: ${e.message}`);
            brokenLinks++;

            let status = 0;
            // STRICT MAPPING TO VALID DB ENUMS: none, not_found, server_error, timeout, other, 404, 5xx
            let errorType = 'other';

            if (e.response) {
                status = e.response.status;
                if (status === 404) errorType = 'not_found';
                else if (status >= 500) errorType = 'server_error';
                else errorType = 'other';
            } else if (e.code === 'ECONNABORTED') {
                errorType = 'timeout';
            } else if (e.code === 'ENOTFOUND') {
                errorType = 'other'; // No dns_error enum in DB
            }

            // Record Failure
            try {
                await db.query(`
                    INSERT INTO scan_urls (scan_id, url, http_status, error_type)
                    VALUES ($1, $2, $3, $4)
                `, [scanId, url, status, errorType]);
            } catch (dbErr) {
                console.error(`[Crawler] DB Insert Error: ${dbErr.message}`);
            }

            // Create Issue (Broken Link)
            await createIssue(websiteId, scanId, url, 'url_error', 'Broken Link (HTTP ' + status + ')', 'critical');
        }
    }

    console.log(`[Crawler] Finished. Scanned: ${pagesScanned}, Broken: ${brokenLinks}`);
}

module.exports = { crawl };

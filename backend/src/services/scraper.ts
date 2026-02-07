import axios from 'axios';
import * as cheerio from 'cheerio';

const isPrivateIP = (ip: string) => {
    // Basic private IP range check
    return /^(127\.|10\.|172\.(1[6-9]|2[0-9]|3[01])\.|192\.168\.)/.test(ip);
};

export const scrapeUrl = async (url: string) => {
    try {
        const parsedUrl = new URL(url);
        if (parsedUrl.protocol !== 'http:' && parsedUrl.protocol !== 'https:') {
            throw new Error('Only HTTP and HTTPS protocols are allowed');
        }

        if (isPrivateIP(parsedUrl.hostname) || parsedUrl.hostname === 'localhost') {
            throw new Error('Access to internal network is restricted');
        }
        const { data } = await axios.get(url, {
            headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36' }
        });
        const $ = cheerio.load(data);
        const title = $('title').text().trim();

        let extractedData: any[] = [];
        let extractionMethod = 'unknown';

        // 1. Try extracting standard HTML tables
        $('table').each((i, table) => {
            if (extractedData.length > 0) return; // Only take the first populated table for now
            const headers: string[] = [];
            $(table).find('th').each((j, th) => {
                headers.push($(th).text().trim() || `col_${j}`);
            });

            if (headers.length > 1) {
                $(table).find('tr').each((j, tr) => {
                    const row: any = {};
                    let hasData = false;
                    $(tr).find('td').each((k, td) => {
                        const val = $(td).text().trim();
                        if (headers[k]) row[headers[k]] = val;
                        if (val) hasData = true;
                    });
                    if (hasData && Object.keys(row).length > 0) extractedData.push(row);
                });
                if (extractedData.length > 0) extractionMethod = 'table';
            }
        });

        // 2. Fallback: "AI" Product Card Detection (Heuristic)
        if (extractedData.length === 0) {
            const potentialProducts: any[] = [];
            $('*').each((i, el) => {
                const text = $(el).text();
                // Heuristic: Element contains a currency symbol and digits
                if (/[$€£]\s?\d+/.test(text)) {
                    const priceMatch = text.match(/[$€£]\s?\d+([.,]\d{2})?/);
                    const price = priceMatch ? priceMatch[0] : null;
                    if (price && $(el).children().length < 5) { // Leaf-ish node
                        const title = $(el).parent().find('h1, h2, h3, h4, .title, .name').first().text().trim();
                        // Only add if we haven't seen this exact text before (dedupe)
                        if (title && !potentialProducts.some(p => p.Product === title)) {
                            potentialProducts.push({
                                Product: title || 'Item',
                                Price: price,
                                Context: $(el).text().trim().substring(0, 50)
                            });
                        }
                    }
                }
            });

            if (potentialProducts.length > 0) {
                extractedData = potentialProducts.slice(0, 50);
                extractionMethod = 'product-detection';
            }
        }

        // 3. Last Resort: General Content Extraction (Headings & Lists)
        if (extractedData.length === 0) {
            const contentData: any[] = [];

            // Extract Lists
            $('ul, ol').each((i, list) => {
                if (contentData.length > 20) return;
                $(list).find('li').each((j, li) => {
                    const text = $(li).text().trim();
                    if (text.length > 10 && text.length < 200) {
                        contentData.push({ Type: 'List Item', Content: text });
                    }
                });
            });

            // Extract Headings & Paragraphs
            $('h1, h2, h3').each((i, h) => {
                if (contentData.length > 30) return;
                const title = $(h).text().trim();
                const nextP = $(h).next('p').text().trim();
                if (title) {
                    contentData.push({
                        Type: 'Section',
                        Heading: title,
                        Summary: nextP.substring(0, 150) || 'No description'
                    });
                }
            });

            if (contentData.length > 0) {
                extractedData = contentData;
                extractionMethod = 'general-content';
            }
        }

        return {
            title,
            data: extractedData,
            method: extractionMethod,
            count: extractedData.length
        };

    } catch (error: any) {
        console.error("Scraping error:", error.message);
        if (error.message === 'Only HTTP and HTTPS protocols are allowed' ||
            error.message === 'Access to internal network is restricted') {
            throw error;
        }
        throw new Error("Failed to scrape URL");
    }
};

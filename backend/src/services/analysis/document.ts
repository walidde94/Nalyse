import * as cheerio from 'cheerio';
import { AnalysisResult } from './types';

export const analyzePDF = async (buffer: Buffer): Promise<AnalysisResult> => {
    try {
        const pdf = require('pdf-parse');
        const data = await pdf(buffer);
        const text = data.text.trim();
        const pageCount = data.numpages;

        const words = text.toLowerCase().match(/\b\w{4,}\b/g) || [];
        const freq: Record<string, number> = {};
        words.forEach((w: string) => freq[w] = (freq[w] || 0) + 1);
        const sortedWords = Object.entries(freq).sort((a, b) => b[1] - a[1]).slice(0, 10);

        return {
            type: 'PDF Document',
            summary: {
                rows: 0, columns: 0, columnTypes: {},
                pages: pageCount,
                wordCount: words.length
            },
            options: [{
                id: 'word-freq',
                title: 'Common Keywords',
                description: 'Top recurring words',
                chartType: 'bar',
                data: sortedWords.map(([name, value]) => ({ name, value }))
            }],
            aiInsights: [
                { id: 'pdf-summary', type: 'pattern', description: `📄 **Document Analysis**: PDF with ${pageCount} pages and ~${words.length} words.`, confidence: 1, isVerified: true }
            ],
            keyFindings: [],
            dataLimitations: [],
            processingLog: [],
            sampleData: [],
            dataHealth: { score: 100, issues: [], cleanedRows: 0, columnHealth: [] }
        };
    } catch (e) {
        throw new Error('PDF Parsing failed');
    }
};

export const analyzeHTML = (content: string): AnalysisResult => {
    const $ = cheerio.load(content);
    const tags: Record<string, number> = {};
    $('*').each((_, el) => { const tagName = (el as any).tagName; if (tagName) tags[tagName] = (tags[tagName] || 0) + 1; });
    const chartData = Object.entries(tags).map(([k, v]) => ({ name: k, value: v })).sort((a, b) => b.value - a.value).slice(0, 8);

    return {
        type: 'HTML Document',
        summary: {
            rows: 0, columns: 0, columnTypes: {},
            title: $('title').text(),
            totalTags: Object.values(tags).reduce((a, b) => a + b, 0)
        },
        options: [{ id: 'tags', title: 'HTML Tags', description: 'Tag usage distribution', chartType: 'pie', data: chartData }],
        aiInsights: [{ id: 'html-meta', type: 'pattern', description: `🌐 **Web Page**: "${$('title').text()}"`, confidence: 1, isVerified: true }],
        keyFindings: [],
        dataLimitations: [],
        processingLog: [],
        sampleData: [],
        dataHealth: { score: 100, issues: [], cleanedRows: 0, columnHealth: [] }
    };
};

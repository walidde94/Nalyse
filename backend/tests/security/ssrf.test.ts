import { scrapeUrl } from '../../src/services/scraper';

describe('Security - Scraper SSRF Protection', () => {
    it('should block requests to localhost', async () => {
        await expect(scrapeUrl('http://localhost:3000/api/reports')).rejects.toThrow('Access to internal network is restricted');
    });

    it('should block requests to internal IP 127.0.0.1', async () => {
        await expect(scrapeUrl('http://127.0.0.1:3000')).rejects.toThrow('Access to internal network is restricted');
    });

    it('should block requests to private IP 192.168.1.1', async () => {
        await expect(scrapeUrl('http://192.168.1.1')).rejects.toThrow('Access to internal network is restricted');
    });

    it('should block requests to non-http protocols', async () => {
        await expect(scrapeUrl('file:///etc/passwd')).rejects.toThrow('Only HTTP and HTTPS protocols are allowed');
    });
});

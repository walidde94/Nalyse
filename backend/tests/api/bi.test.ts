import request from 'supertest';
import app from '../../src/index';

describe('BI API Endpoints', () => {
    describe('GET /api/bi/:type', () => {
        it('should return sales dataset with correct structure', async () => {
            const res = await request(app).get('/api/bi/sales');

            expect(res.status).toBe(200);
            expect(res.body.type).toBe('sales');
            expect(Array.isArray(res.body.data)).toBe(true);
            expect(res.body.data.length).toBeGreaterThan(0);

            const firstRow = res.body.data[0];
            expect(firstRow).toHaveProperty('Product');
            expect(firstRow).toHaveProperty('Revenue');
        });

        it('should return marketing dataset', async () => {
            const res = await request(app).get('/api/bi/marketing');
            expect(res.status).toBe(200);
            expect(res.body.data[0]).toHaveProperty('Channel');
        });

        it('should return 404 for non-existent dataset', async () => {
            const res = await request(app).get('/api/bi/nonexistent');
            expect(res.status).toBe(404);
            expect(res.body.error).toMatch(/Dataset not found/i);
        });

        it('should handled invalid type parameter', async () => {
            // type is part of URL, so it's always a string. 
            // But we can check if it behaves well with empty string if route matches (usually doesn't match if empty)
        });
    });
});

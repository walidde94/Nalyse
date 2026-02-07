import request from 'supertest';
import app from '../src/index';

describe('Health Check Endpoint', () => {
    it('should return 200 OK with status and timestamp', async () => {
        const res = await request(app).get('/health');
        expect(res.status).toBe(200);
        expect(res.body).toHaveProperty('status', 'ok');
        expect(res.body).toHaveProperty('timestamp');
    });

    it('should return 404 for unknown routes', async () => {
        const res = await request(app).get('/not-a-route');
        expect(res.status).toBe(404);
        expect(res.body).toHaveProperty('error', 'Route not found');
    });
});

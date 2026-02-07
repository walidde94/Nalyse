import request from 'supertest';
import app from '../src/index';
import { setupTestDB, teardownTestDB } from './setup';
import { AppDataSource } from '../src/config/database';
import { User } from '../src/entities/User';
import { Organization } from '../src/entities/Organization';
import { ApiKey } from '../src/entities/ApiKey';
import { File } from '../src/entities/File';
import path from 'path';
import fs from 'fs';

describe('Enterprise V1 API Strategy', () => {
    let apiKey: string;
    let userId: string;
    let datasetId: string;

    beforeAll(async () => {
        await setupTestDB();

        // Setup Enterprise Context
        const orgRepo = AppDataSource.getRepository(Organization);
        const userRepo = AppDataSource.getRepository(User);
        const apiKeyRepo = AppDataSource.getRepository(ApiKey);

        const org = await orgRepo.save(orgRepo.create({ name: 'Enterprise Corp', plan: 'enterprise' }));
        const user = await userRepo.save(userRepo.create({
            email: 'admin@enterprise.com',
            passwordHash: 'hash',
            organization: org,
            organizationId: org.id
        }));
        userId = user.id;

        const keyObj = await apiKeyRepo.save(apiKeyRepo.create({
            name: 'Prod Key',
            key: 'nal_test_key_12345',
            ownerId: user.id,
            isActive: true
        }));
        apiKey = keyObj.key;
    });

    afterAll(async () => {
        await teardownTestDB();
    });

    it('should reject requests without API Key', async () => {
        const res = await request(app).get('/api/v1/telemetry');
        expect(res.status).toBe(401);
    });

    it('should accept requests with valid API Key', async () => {
        const res = await request(app)
            .get('/api/v1/telemetry')
            .set('X-API-KEY', apiKey);
        expect(res.status).toBe(200);
    });

    it('should upload a dataset via API', async () => {
        // Create a dummy CSV for testing
        const csvPath = path.join(__dirname, 'test_data.csv');
        fs.writeFileSync(csvPath, 'id,value\n1,100\n2,200');

        const res = await request(app)
            .post('/api/v1/datasets')
            .set('X-API-KEY', apiKey)
            .attach('file', csvPath);

        expect(res.status).toBe(201);
        expect(res.body).toHaveProperty('id');
        datasetId = res.body.id;

        fs.unlinkSync(csvPath); // Cleanup
    });

    it('should run analysis on uploaded dataset', async () => {
        const res = await request(app)
            .post('/api/v1/analysis')
            .set('X-API-KEY', apiKey)
            .send({ datasetId });

        expect(res.status).toBe(200);
        expect(res.body).toHaveProperty('summary');
        expect(res.body.datasetId).toBe(datasetId);
    });

    it('should return 404 for non-existent dataset analysis', async () => {
        const res = await request(app)
            .post('/api/v1/analysis')
            .set('X-API-KEY', apiKey)
            .send({ datasetId: '00000000-0000-0000-0000-000000000000' });

        expect(res.status).toBe(404);
    });
});

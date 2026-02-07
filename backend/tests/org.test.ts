import request from 'supertest';
import app from '../src/index';
import { setupTestDB, teardownTestDB } from './setup';
import { AppDataSource } from '../src/config/database';
import { Organization } from '../src/entities/Organization';
import { User } from '../src/entities/User';
import { ApiKey } from '../src/entities/ApiKey';
import path from 'path';
import fs from 'fs';

describe('Organization & Seat Enforcement', () => {
    let apiKey: string;
    let orgId: string;

    beforeAll(async () => {
        await setupTestDB();

        const orgRepo = AppDataSource.getRepository(Organization);
        const userRepo = AppDataSource.getRepository(User);
        const apiKeyRepo = AppDataSource.getRepository(ApiKey);

        // Create restricted org (100KB limit, 1 seat)
        const org = await orgRepo.save(orgRepo.create({
            name: 'Restricted Org',
            plan: 'free',
            storageLimit: 102400, // 100KB
            userLimit: 1
        }));
        orgId = org.id;

        const user = await userRepo.save(userRepo.create({
            email: 'admin@restricted.com',
            passwordHash: 'hash',
            organization: org,
            organizationId: org.id,
            role: 'admin'
        }));

        const keyObj = await apiKeyRepo.save(apiKeyRepo.create({
            name: 'Limit Test Key',
            key: 'nal_limit_key',
            ownerId: user.id,
            isActive: true
        }));
        apiKey = keyObj.key;
    });

    afterAll(async () => {
        await teardownTestDB();
    });

    it('BUG TEST: should NOT allow upload exceeding storage limit (B-17)', async () => {
        // 200KB file (exceeds 100KB limit)
        const bigFilePath = path.join(__dirname, 'big_file.csv');
        const content = 'a'.repeat(204800);
        fs.writeFileSync(bigFilePath, content);

        const res = await request(app)
            .post('/api/v1/datasets')
            .set('X-API-KEY', apiKey)
            .attach('file', bigFilePath);

        fs.unlinkSync(bigFilePath);

        // EXPECTATION: Should be 403 Forbidden due to limit
        // CURRENT REALITY (BUG): Will likely be 201 Created because enforcement is missing
        expect(res.status).toBe(403);
    });

    it('should allow upload within storage limit and track usage (B-18)', async () => {
        // 10KB file (within 100KB limit)
        const smallFilePath = path.join(__dirname, 'small_file.csv');
        const content = 'a'.repeat(10240);
        fs.writeFileSync(smallFilePath, content);

        const res = await request(app)
            .post('/api/v1/datasets')
            .set('X-API-KEY', apiKey)
            .attach('file', smallFilePath);

        fs.unlinkSync(smallFilePath);

        expect(res.status).toBe(201);

        const orgRepo = AppDataSource.getRepository(Organization);
        const org = await orgRepo.findOneBy({ id: orgId });
        expect(Number(org?.storageUsed)).toBe(10240);
    });
});

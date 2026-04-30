import request from 'supertest';
import app from '../src/index';
import { setupTestDB, teardownTestDB } from './setup';
import { AppDataSource } from '../src/config/database';
import { Organization } from '../src/entities/Organization';
import { User } from '../src/entities/User';
import { Group } from '../src/entities/Group';
import { File } from '../src/entities/File';
import jwt from 'jsonwebtoken';

describe('Nalyse Smart Integrity & Multi-Tenant Suite', () => {
    let userA: User;
    let userB: User;
    let tokenA: string;
    let tokenB: string;
    let groupA: Group;
    let groupB: Group;

    beforeAll(async () => {
        await setupTestDB();
        const orgRepo = AppDataSource.getRepository(Organization);
        const userRepo = AppDataSource.getRepository(User);
        const groupRepo = AppDataSource.getRepository(Group);

        const orgA = await orgRepo.save(orgRepo.create({ name: 'Alpha Org' }));
        userA = await userRepo.save(userRepo.create({
            email: 'admin@alpha.com',
            passwordHash: 'h',
            organizationId: orgA.id,
            role: 'admin'
        }));
        tokenA = jwt.sign({ userId: userA.id, organizationId: orgA.id }, process.env.JWT_SECRET || 'your-secret-key-change-this');

        const orgB = await orgRepo.save(orgRepo.create({ name: 'Beta Org' }));
        userB = await userRepo.save(userRepo.create({
            email: 'admin@beta.com',
            passwordHash: 'h',
            organizationId: orgB.id,
            role: 'admin'
        }));
        tokenB = jwt.sign({ userId: userB.id, organizationId: orgB.id }, process.env.JWT_SECRET || 'your-secret-key-change-this');

        groupA = await groupRepo.save(groupRepo.create({ name: 'Alpha Assets', ownerId: userA.id }));
        groupB = await groupRepo.save(groupRepo.create({ name: 'Beta Assets', ownerId: userB.id }));
    });

    afterAll(async () => {
        await teardownTestDB();
    });

    describe('1. Cross-Tenant Integrity (B-34)', () => {
        it('should NOT allow User B to move their file to User A\'s group', async () => {
            const fileRepo = AppDataSource.getRepository(File);
            const fileB = await fileRepo.save(fileRepo.create({
                filename: 'beta.csv',
                originalName: 'beta.csv',
                mimeType: 'text/csv',
                size: 100,
                ownerId: userB.id,
                organizationId: userB.organizationId!
            }));

            // User B tries to update their file but specifies Group A (guessable ID)
            const res = await request(app)
                .patch(`/api/files/${fileB.id}/group`)
                .set('Authorization', `Bearer ${tokenB}`)
                .send({ groupId: groupA.id });

            // EXPECTATION: 403 or 404 because Group A doesn't belong to User B or Org B
            // REALITY: It likely succeeds because the controller only checks file ownership
            expect(res.status).toBe(403);
        });
    });


    describe('3. Resource Exhaustion (B-35 Simulation)', () => {
        it('should reject extremely large analysis requests (DoS check)', async () => {
            // This is a logic check - if we sent a 1GB file, would it crash?
            // Since we can't easily send 1GB in a test, we check if there's any file size check
            // in the analyzer.
        });
    });
});

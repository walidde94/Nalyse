import request from 'supertest';
import app from '../src/index';
import { setupTestDB, teardownTestDB } from './setup';
import { AppDataSource } from '../src/config/database';
import { User } from '../src/entities/User';
import { Organization } from '../src/entities/Organization';

describe('Auth Service & Endpoints', () => {
    beforeAll(async () => {
        await setupTestDB();
    });

    afterAll(async () => {
        await teardownTestDB();
    });

    const testUser = {
        email: 'test@nalyse.io',
        password: 'Password123!',
        firstName: 'Test',
        lastName: 'User',
        organizationName: 'Enterprise Lab'
    };

    let accessToken: string;
    let refreshToken: string;

    it('should register a new user and create an organization', async () => {
        const res = await request(app)
            .post('/api/auth/register')
            .send(testUser);

        expect(res.status).toBe(201);
        expect(res.body.user.email).toBe(testUser.email);
        expect(res.body.organization.name).toBe(testUser.organizationName);

        // Verify in DB (Transaction Check)
        const userRepo = AppDataSource.getRepository(User);
        const user = await userRepo.findOne({
            where: { email: testUser.email },
            relations: ['organization']
        });
        expect(user).toBeDefined();
        expect(user?.organization?.name).toBe(testUser.organizationName);
    });

    it('should fail registration with duplicate email', async () => {
        const res = await request(app)
            .post('/api/auth/register')
            .send(testUser);

        expect(res.status).toBe(400);
        expect(res.body.error).toMatch(/already registered/i);
    });

    it('should login and return tokens', async () => {
        const res = await request(app)
            .post('/api/auth/login')
            .send({
                email: testUser.email,
                password: testUser.password
            });

        expect(res.status).toBe(200);
        expect(res.body).toHaveProperty('accessToken');
        expect(res.body).toHaveProperty('refreshToken');
        accessToken = res.body.accessToken;
        refreshToken = res.body.refreshToken;
    });

    it('should not login with wrong password', async () => {
        const res = await request(app)
            .post('/api/auth/login')
            .send({
                email: testUser.email,
                password: 'WrongPassword'
            });

        expect(res.status).toBe(401);
    });

    it('should fetch protected profile with valid token', async () => {
        const res = await request(app)
            .get('/api/auth/profile')
            .set('Authorization', `Bearer ${accessToken}`);

        expect(res.status).toBe(200);
        expect(res.body.user.email).toBe(testUser.email);
    });

    it('should fail profile fetch with invalid token', async () => {
        const res = await request(app)
            .get('/api/auth/profile')
            .set('Authorization', `Bearer invalid-token`);

        expect(res.status).toBe(401);
    });
});

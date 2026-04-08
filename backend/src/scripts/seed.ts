import 'dotenv/config';
import { prisma } from '../config/database';
import * as bcrypt from 'bcryptjs';

async function seed() {
    console.log('🌱 Starting development seed script...');
    try {
        // 1. Clear existing generic data if any
        // Note: Raw SQL or manual trunctation might be needed if relations are complex.
        await prisma.$executeRawUnsafe(`TRUNCATE TABLE "Organization" CASCADE;`);
        console.log('Cleaned database schemas.');

        // 2. Organization
        const org = await prisma.organization.create({
            data: {
                id: crypto.randomUUID(),
                name: 'Nalyse Development Inc',
                subscriptionTier: 'enterprise',
                subscriptionStartedAt: new Date(),
                updatedAt: new Date(),
            }
        });
        console.log('Created Organization:', org.name);

        // 3. Admin User
        const hashedPassword = await bcrypt.hash('password123', 10);
        const adminUser = await prisma.user.create({
            data: {
                id: crypto.randomUUID(),
                email: 'dev@nalyse.com',
                passwordHash: hashedPassword,
                firstName: 'Developer',
                lastName: 'Local',
                role: 'admin',
                organizationId: org.id,
                updatedAt: new Date(),
            }
        });
        console.log('Created Admin:', adminUser.email, '(password: password123)');

        // 4. Mock File
        const file = await prisma.file.create({
            data: {
                id: crypto.randomUUID(),
                filename: 'q3.csv',
                originalName: 'Q3_Financial_Data.csv',
                mimeType: 'text/csv',
                size: 15430,
                ownerId: adminUser.id,
                organizationId: org.id,
                updatedAt: new Date(),
            }
        });
        console.log('Created Mock Dataset:', file.filename);

        // 5. Mock Analysis
        const analysis = await prisma.analysis.create({
            data: {
                id: crypto.randomUUID(),
                fileId: file.id,
                createdById: adminUser.id,
                status: 'completed',
                results: { metrics: { rowCount: 12050 } },
                insights: { summary: "Highly correlated dataset indicating exponential growth" },
                completedAt: new Date(),
                updatedAt: new Date(),
            }
        });
        console.log('Created Fake Analysis Record.');

        // 6. Mock Exec Report
        const report = await prisma.report.create({
            data: {
                id: crypto.randomUUID(),
                title: 'Q3 Financial Executive Summary',
                config: { type: 'executive_brief', metrics: ['sales', 'growth'] },
                userId: adminUser.id,
                updatedAt: new Date(),
            }
        });
        console.log('Created Pre-Analyzed Report.');

        console.log('✅ Development environment seed completed successfully.');
        process.exit(0);
    } catch (error) {
        console.error('❌ Seeding failed:', error);
        process.exit(1);
    }
}

seed();

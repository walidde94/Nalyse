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
                name: 'Nalyse Development Inc',
                subscriptionTier: 'enterprise',
                subscriptionStartedAt: new Date()
            }
        });
        console.log('Created Organization:', org.name);

        // 3. Admin User
        const hashedPassword = await bcrypt.hash('password123', 10);
        const adminUser = await prisma.user.create({
            data: {
                email: 'dev@nalyse.com',
                passwordHash: hashedPassword,
                firstName: 'Developer',
                lastName: 'Local',
                role: 'admin',
                organizationId: org.id,
            }
        });
        console.log('Created Admin:', adminUser.email, '(password: password123)');

        // 4. Mock File
        const file = await prisma.file.create({
            data: {
                filename: 'q3.csv',
                originalName: 'Q3_Financial_Data.csv',
                mimeType: 'text/csv',
                size: 15430,
                ownerId: adminUser.id,
                organizationId: org.id
            }
        });
        console.log('Created Mock Dataset:', file.filename);

        // 5. Mock Analysis
        const analysis = await prisma.analysis.create({
            data: {
                fileId: file.id,
                createdById: adminUser.id,
                status: 'completed',
                results: { metrics: { rowCount: 12050 } },
                insights: { summary: "Highly correlated dataset indicating exponential growth" },
                completedAt: new Date()
            }
        });
        console.log('Created Fake Analysis Record.');

        // 6. Mock Exec Report
        const report = await prisma.report.create({
            data: {
                title: 'Q3 Financial Executive Summary',
                config: { type: 'executive_brief', metrics: ['sales', 'growth'] },
                userId: adminUser.id
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

import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function seedFailedLogins() {
    console.log('Seeding failed login attempts...');
    
    const failures = [
        { email: 'v@v.com', reason: 'MaxClientsInSessionMode: max clients reached - in Session mode max clients are limited to pool_size', ip: '1.2.3.4' },
        { email: 'admin@nalyse.com', reason: 'Invalid password', ip: '5.6.7.8' },
        { email: 'hacker@malicious.io', reason: 'Too many attempts', ip: '9.10.11.12' }
    ];

    for (const f of failures) {
        const user = await prisma.user.findUnique({ where: { email: f.email } });
        
        await prisma.platformAuditLog.create({
            data: {
                userId: user?.id || '00000000-0000-0000-0000-000000000000',
                action: 'LOGIN_FAILED',
                resource: 'AUTH',
                ipAddress: f.ip,
                details: {
                    email: f.email,
                    reason: f.reason,
                    location: 'Berlin, Germany',
                    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
                    device: 'macOS',
                    attemptedAt: new Date().toISOString(),
                    isSystemError: f.reason.includes('MaxClients')
                }
            }
        });
    }

    console.log('Done!');
    process.exit(0);
}

seedFailedLogins();

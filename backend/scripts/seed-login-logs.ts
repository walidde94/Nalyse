import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany({
    take: 5
  });

  if (users.length === 0) {
    console.log('No users found to seed logs for.');
    return;
  }

  const actions = ['LOGIN'];
  const ips = ['192.168.1.1', '10.0.0.42', '172.16.0.5', '8.8.8.8'];
  const platforms = ['macOS', 'Windows', 'Linux', 'iOS', 'Android'];
  const browsers = ['Chrome', 'Firefox', 'Safari', 'Edge'];

  for (const user of users) {
    for (let i = 0; i < 3; i++) {
      const ip = ips[Math.floor(Math.random() * ips.length)];
      const platform = platforms[Math.floor(Math.random() * platforms.length)];
      const browser = browsers[Math.floor(Math.random() * browsers.length)];
      const date = new Date();
      date.setHours(date.getHours() - Math.floor(Math.random() * 24 * 7)); // Within last 7 days

      await prisma.platformAuditLog.create({
        data: {
          userId: user.id,
          action: 'LOGIN',
          resource: 'AUTH',
          ipAddress: ip,
          details: {
            device: platform,
            userAgent: `Mozilla/5.0 (${platform}; Intel ${platform} ...) ${browser}/120.0.0.0`,
            loginAt: date.toISOString()
          },
          createdAt: date
        }
      });
    }
  }

  console.log('Successfully seeded 15 login logs.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function run() {
  const n = await prisma.notification.findMany({ where: { source: 'CHAT' }, take: 5, orderBy: { createdAt: 'desc' } });
  console.log(n);
}
run().catch(console.error).finally(() => prisma.$disconnect());

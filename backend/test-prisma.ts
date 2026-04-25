import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient({ log: ['query'] });
async function run() {
  try {
    const res = await prisma.scheduleRun.count({
      where: { schedule: { organizationId: '123e4567-e89b-12d3-a456-426614174000' } }
    });
    console.log("Count:", res);
  } catch (e) {
    console.error(e);
  } finally {
    await prisma.$disconnect();
  }
}
run();

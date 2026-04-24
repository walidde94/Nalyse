import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  await prisma.$executeRaw`INSERT INTO organizations (id, name, storage_used, storage_limit) VALUES (gen_random_uuid(), 'Test Null', NULL, NULL)`;
  
  try {
    const orgs = await prisma.organization.findMany();
    console.log("Success! Length:", orgs.length);
  } catch (e) {
    console.error("PRISMA CRASHED:", e);
  }
}
main().catch(console.error).finally(() => prisma.$disconnect());

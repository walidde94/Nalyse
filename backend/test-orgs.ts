import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  const orgs = await prisma.organization.findMany();
  console.log("Found orgs:", orgs.length);
  console.log(orgs);
}
main().catch(console.error).finally(() => prisma.$disconnect());

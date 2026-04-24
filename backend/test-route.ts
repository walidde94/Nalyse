import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  const orgs = await prisma.organization.findMany({
      include: {
          _count: {
              select: { users: true, workspaces: true }
          }
      }
  });
  
  const serializedOrgs = orgs.map(org => ({
      ...org,
      storageUsed: org.storageUsed?.toString() || '0',
      storageLimit: org.storageLimit?.toString() || '104857600',
  }));
  
  try {
      const json = JSON.stringify(serializedOrgs);
      console.log("SUCCESS:", json.substring(0, 100));
  } catch (e) {
      console.error("ERROR:", e);
  }
}
main().catch(console.error).finally(() => prisma.$disconnect());

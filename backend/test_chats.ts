import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function test() {
  const users = await prisma.user.findMany({ select: { id: true, email: true } });
  console.log("Users:", users);
  const convs = await prisma.directConversation.findMany({ include: { participants: true } });
  console.log("Conversations:", JSON.stringify(convs, null, 2));
}

test().catch(console.error).finally(() => prisma.$disconnect());

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const email = 'sysadmin@nalyse.com';
  const password = 'NalyseSecure123!';
  const firstName = 'System';
  const lastName = 'Operator';

  const existingUser = await prisma.user.findUnique({
    where: { email }
  });

  if (existingUser) {
    console.log(`User ${email} already exists. Promoting to SystemAdmin...`);
    await prisma.user.update({
      where: { email },
      data: { role: 'SystemAdmin' }
    });
    console.log(`User ${email} promoted successfully.`);
    return;
  }

  // Get first organization to attach to, or create one
  let org = await prisma.organization.findFirst();
  if (!org) {
    org = await prisma.organization.create({
      data: {
        name: 'Nalyse Headquarters',
        slug: 'nalyse-hq',
        plan: 'enterprise',
        subscriptionTier: 'enterprise',
        isActive: true
      }
    });
  }

  const passwordHash = await bcrypt.hash(password, 12);

  const user = await prisma.user.create({
    data: {
      email,
      passwordHash,
      firstName,
      lastName,
      role: 'SystemAdmin',
      isActive: true,
      emailVerified: true,
      organizationId: org.id
    }
  });

  console.log('--- NEW ADMIN USER CREATED ---');
  console.log(`Email: ${email}`);
  console.log(`Password: ${password}`);
  console.log('------------------------------');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

const prisma = new PrismaClient();

async function main() {
  const email = 'admin@nalyse.com';
  const password = 'NalyseAdmin123!';
  const firstName = 'System';
  const lastName = 'Admin';

  console.log(`Checking if user ${email} exists...`);
  
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

  console.log(`Creating new SystemAdmin: ${email}...`);

  // Create a default organization for the admin
  const orgName = 'Nalyse Operations';
  const org = await prisma.organization.create({
    data: {
      name: orgName,
      slug: 'nalyse-ops',
      plan: 'pro',
      subscriptionTier: 'enterprise',
      isActive: true
    }
  });

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

  // Create a workspace for the admin org
  await prisma.workspace.create({
    data: {
      name: 'Command Center',
      organizationId: org.id,
      members: {
        create: {
          userId: user.id,
          role: 'admin'
        }
      }
    }
  });

  console.log('--- ADMIN USER CREATED ---');
  console.log(`Email: ${email}`);
  console.log(`Password: ${password}`);
  console.log('--------------------------');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

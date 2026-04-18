import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  const email = 'walid.de94@gmail.com';
  // Use a default password or a dummy one
  const passwordHash = await bcrypt.hash('Daraasyr123##', 10);

  // 1. Create Organization
  const org = await prisma.organization.upsert({
    where: { name: 'Nalyse Default' },
    update: {},
    create: {
      name: 'Nalyse Default',
      slug: 'nalyse-default',
      plan: 'pro'
    }
  });

  // 2. Create User
  const user = await prisma.user.upsert({
    where: { email },
    update: { passwordHash },
    create: {
      email,
      passwordHash,
      firstName: 'Walid',
      lastName: 'Admin',
      role: 'admin',
      organizationId: org.id
    }
  });

  console.log(`✅ Seeded user: ${user.email}`);
  console.log(`✅ Seeded org: ${org.name}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

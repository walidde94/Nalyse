import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';
import 'dotenv/config';
const prisma = new PrismaClient();
const secret = process.env.JWT_SECRET || 'fallback_secret';
async function main() {
  const admin = await prisma.user.findFirst({ where: { role: 'SystemAdmin' } });
  if (admin) {
    console.log(jwt.sign({ id: admin.id, role: admin.role, email: admin.email, userId: admin.id }, secret));
  }
}
main().catch(() => {}).finally(() => prisma.$disconnect());

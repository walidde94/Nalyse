import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';
import 'dotenv/config';

const prisma = new PrismaClient();
const secret = process.env.JWT_SECRET || 'fallback_secret';

async function main() {
  const admin = await prisma.user.findFirst({ where: { role: 'SystemAdmin' } });
  if (!admin) {
    console.log("No SystemAdmin found");
    return;
  }
  const token = jwt.sign({ id: admin.id, role: admin.role, email: admin.email }, secret);
  
  const res = await fetch('http://localhost:3000/api/admin/organizations', {
    headers: { Authorization: `Bearer ${token}` }
  });
  
  console.log("Status:", res.status);
  const text = await res.text();
  console.log("Response:", text);
}

main().catch(console.error).finally(() => prisma.$disconnect());

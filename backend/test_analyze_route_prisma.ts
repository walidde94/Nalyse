import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';
import fetch from 'node-fetch'; // Make sure we have fetch if node < 18, but Node 18+ has it.

const secret = '96c7e335a622d0d220bd15251d993a3ca7441355f6aa28efc86fbdbd2e9748fe914908d3eecb69a4e5858de3928ad95f72592a5a56c8c6350b83c958cc39d26c';
const prisma = new PrismaClient();

async function run() {
    const user = await prisma.user.findFirst();
    if (!user) return console.log('No user');

    const file = await prisma.file.findFirst({ orderBy: { createdAt: 'desc' }, where: { ownerId: user.id } });
    if (!file) return console.log('No file');

    const token = jwt.sign({ userId: user.id }, secret, { expiresIn: '1h' });
    console.log(`Triggering analyze for ${file.id} (user: ${user.id})`);
    
    try {
        const res = await fetch(`http://localhost:3000/api/files/${file.id}/analyze`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const text = await res.text();
        console.log(`Status: ${res.status}`);
        console.log(`Response: ${text}`);
    } catch(e) {
        console.log(e);
    }
}
run();

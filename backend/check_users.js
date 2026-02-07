"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
async function main() {
    try {
        const user = await prisma.user.upsert({
            where: { id: 1 },
            update: {},
            create: {
                id: 1,
                email: 'demo@nalyse.com',
                password: '$2a$10$demoPasswordHashPlaceholder', // Placeholder hash
            },
        });
        console.log('Ensured User with ID 1 exists:', user);
    }
    catch (e) {
        console.error('Error ensuring user:', e);
    }
    finally {
        await prisma.$disconnect();
    }
}
main();

import { AppDataSource, initializeDatabase } from '../src/config/database';
import { User } from '../src/entities/User';
import bcrypt from 'bcryptjs';

async function main() {
    await initializeDatabase();
    const userRepository = AppDataSource.getRepository(User);
    
    const email = 'admin@nalyse.com';
    const password = 'nalyse123';
    
    console.log(`Resetting admin password for ${email} using TypeORM...`);
    
    let user = await userRepository.findOneBy({ email });
    
    const passwordHash = await bcrypt.hash(password, 12);
    
    if (user) {
        user.passwordHash = passwordHash;
        user.role = 'SystemAdmin' as any;
        user.isActive = true;
        await userRepository.save(user);
        console.log('User updated successfully.');
    } else {
        console.log('User not found. Creating new one...');
        user = userRepository.create({
            email,
            passwordHash,
            role: 'SystemAdmin' as any,
            isActive: true,
            firstName: 'System',
            lastName: 'Admin'
        });
        await userRepository.save(user);
        console.log('User created successfully.');
    }
    
    console.log('--- NEW ADMIN CREDENTIALS ---');
    console.log(`Email: ${email}`);
    console.log(`Password: ${password}`);
    console.log('-----------------------------');
}

main()
    .catch(console.error)
    .finally(async () => {
        if (AppDataSource.isInitialized) await AppDataSource.destroy();
    });

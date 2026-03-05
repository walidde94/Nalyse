import { AppDataSource } from './src/config/database';
import { User } from './src/entities/User';

async function updateRoles() {
    await AppDataSource.initialize();
    const userRepository = AppDataSource.getRepository(User);

    const users = await userRepository.find();
    for (const user of users) {
        if (user.role === 'user' || user.role === 'viewer') {
            user.role = 'owner';
            await userRepository.save(user);
            console.log(`Updated user ${user.email} to role owner`);
        }
    }

    console.log('Done!');
    process.exit(0);
}

updateRoles().catch(console.error);

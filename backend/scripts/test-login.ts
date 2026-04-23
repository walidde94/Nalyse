import { AuthService } from '../src/services/authService';
import { initializeDatabase, AppDataSource } from '../src/config/database';

async function main() {
    await initializeDatabase();
    const authService = new AuthService();
    
    const email = 'admin@nalyse.com';
    const password = 'nalyse123';
    
    try {
        console.log(`Attempting login for ${email}...`);
        const result = await authService.login(email, password);
        console.log('Login SUCCESS!');
        console.log('User Role:', result.user.role);
    } catch (e: any) {
        console.error('Login FAILED:', e.message);
    }
}

main().finally(async () => {
    if (AppDataSource.isInitialized) await AppDataSource.destroy();
});

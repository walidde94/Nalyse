import { AppDataSource } from './src/config/database';

AppDataSource.initialize().then(async () => {
    const fileRepo = AppDataSource.getRepository('File');
    const files = await fileRepo.find({ relations: ['analyses'] });
    console.log(JSON.stringify(files.slice(0, 3), null, 2));
    process.exit(0);
}).catch(e => { console.error("Error:", e); process.exit(1); });

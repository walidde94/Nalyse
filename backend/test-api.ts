import { AppDataSource } from './src/config/database';
import { File } from './src/entities/File';

AppDataSource.initialize().then(async () => {
    const fileRepo = AppDataSource.getRepository(File);
    const files = await fileRepo.find({
        order: { createdAt: 'DESC' },
        relations: ['analyses'],
        take: 1
    });

    const f = files[0];
    const completedAnalysis = f.analyses?.find((a: any) => a.status === 'completed');
    console.log("File isProcessed?", !!completedAnalysis);
    
    process.exit(0);
}).catch(e => { console.error(e); process.exit(1); });

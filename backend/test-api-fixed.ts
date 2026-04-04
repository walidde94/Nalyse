import { AppDataSource } from './src/config/database';
import { File } from './src/entities/File';
import { Analysis } from './src/entities/Analysis';

AppDataSource.initialize().then(async () => {
    const fileRepo = AppDataSource.getRepository(File);
    
    // Explicitly find the specific file
    const file = await fileRepo.findOne({
        where: { originalName: 'customers.csv' },
        relations: ['analyses'],
        order: { createdAt: 'DESC' }
    });
    
    if (file) {
        console.log("File Found:", file.filename);
        console.log("Analyses array length:", file.analyses?.length);
        if (file.analyses && file.analyses.length > 0) {
            console.log("Analysis 0 status:", file.analyses[0].status);
        } else {
            console.log("NO ANALYSES LOADED BY TYPEORM!!!");
        }
        
        const completedAnalysis = file.analyses?.find((a: any) => a.status === 'completed');
        console.log("isProcessed evaluates to:", !!completedAnalysis);
    } else {
        console.log("File not found");
    }

    process.exit(0);
}).catch(e => { console.error(e); process.exit(1); });

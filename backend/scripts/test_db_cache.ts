import { AppDataSource } from '../src/config/database';
import { Analysis } from '../src/entities/Analysis';

async function test() {
    await AppDataSource.initialize();
    const repo = AppDataSource.getRepository(Analysis);
    const analyses = await repo.find({ order: { createdAt: 'DESC' as any }, take: 1 });
    const analysis = analyses[0];
    if (!analysis) {
        console.log('No analysis found');
        process.exit(0);
    }
    console.log('Results type:', typeof analysis.results);
    console.log('Is Array?', Array.isArray(analysis.results));
    console.log('Has sampleData?', !!analysis.results?.sampleData);
    console.log('SampleData length:', analysis.results?.sampleData?.length);
    console.log('Options length:', analysis.results?.options?.length);
    
    // Check if it's an object or string
    console.log('First 50 chars of results:', String(analysis.results).substring(0, 50));
    process.exit(0);
}

test();

import { analyzeFile } from '../src/services/analysis/engine';
import path from 'path';

async function test() {
    process.env.UPLOAD_DIR = '/Users/admin/Documents/Nalyse/sample_datasets';
    const filePath = '/Users/admin/Documents/Nalyse/sample_datasets/7_massive_enterprise_dataset.json';
    console.log('Analyzing:', filePath);
    try {
        const res = await analyzeFile(filePath, 'application/json');
        console.log('Result type:', res.type);
        console.log('Sample Data length:', res.sampleData?.length);
        console.log('Options length:', res.options?.length);
        
        const hasData = (res.sampleData && res.sampleData.length > 0) ||
                        (res.options && res.options.length > 0);
        console.log('hasData:', hasData);
        if (!hasData) {
            console.log('Data limitations:', res.dataLimitations);
        }
    } catch(e) {
        console.error('Error:', e);
    }
}
test();

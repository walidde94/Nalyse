import * as fs from 'fs';
import * as path from 'path';
import { analyzeFile } from './src/services/analysis/engine';

async function test() {
    try {
        const fileUploads = fs.readdirSync('uploads').filter(f => f.endsWith('.csv'));
        if (fileUploads.length === 0) {
            console.log("No CSV found in uploads");
            return;
        }
        const filePath = fileUploads[fileUploads.length - 1]; // Latest
        console.log(`Testing with ${filePath}`);
        
        const result = await analyzeFile(filePath, 'text/csv');
        console.log("SUCCESS length:", result.sampleData?.length);
    } catch (err) {
        console.error("FAILED:", err);
    }
}
test();

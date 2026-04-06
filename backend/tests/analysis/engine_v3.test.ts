import fs from 'fs';
import path from 'path';
import { analyzeFile, analyzeRawData } from '../../src/services/analysis/engine';

describe('Nalyse V3 Engine - Core Unit & Integration Suite', () => {

    describe('1. Core Logic: analyzeRawData', () => {
        
        it('should handle completely empty datasets gracefully (Score: 0)', () => {
            const res = analyzeRawData([]);
            expect(res.type).toBe('Empty');
            expect(res.dataHealth.score).toBe(0);
            expect(res.summary.rows).toBe(0);
        });

        it('should aggressively clean data, infer types, and generate intelligence', () => {
            const mockData = [
                { id: 'uid-1', revenue: '100.50', category: 'Software', active: 'true', date: '2023-01-01', trash: '' },
                { id: 'uid-2', revenue: '250.00', category: 'Hardware', active: 'false', date: '2023-01-02', trash: null },
                { id: 'uid-3', revenue: ' $300.00 ', category: 'Software', active: 'true', date: '2023-01-03', trash: undefined },
                // Duplicate row to test deduplication
                { id: 'uid-3', revenue: ' $300.00 ', category: 'Software', active: 'true', date: '2023-01-03', trash: undefined },
            ];

            const res = analyzeRawData(mockData);
            
            // 1. Data Cleaning
            expect(res.summary.rows).toBe(3); // Deduplication works
            expect(res.dataHealth.score).toBeGreaterThan(60); // Exact score fluctuates via Entropy
            
            // 2. Type Inference Engine
            expect(res.summary.columnTypes['revenue']).toBe('currency');
            expect(res.summary.columnTypes['category']).toBe('category');
            expect(res.summary.columnTypes['active']).toBe('boolean');
            expect(res.summary.columnTypes['date']).toBe('date');

            // 3. Classifier System (Ignore PKs)
            expect(res.summary.measures).not.toContain('id');
            expect(res.summary.measures).toContain('revenue');
            expect(res.summary.dimensions).toContain('category');

            // 4. Executive Reasoner Output
            expect(res.executiveReasoning).toBeDefined();
             //@ts-ignore
            expect(res.executiveReasoning?.executiveSummary.length).toBeGreaterThan(10);
            expect(res.executiveReasoning?.strategicAdvice.length).toBeGreaterThan(0);
        });
    });

    describe('2. Pipeline Integration: streamCSV (Reservoir Logic)', () => {
        const testCsvPath = path.join(__dirname, 'test_engine.csv');

        beforeAll(() => {
            process.env.UPLOAD_DIR = __dirname; // Bypass traversal lock for tests
            // Create a small test CSV
            fs.writeFileSync(testCsvPath, 'user_id,age,score,department\n1,25,85,Sales\n2,34,92,Engineering\n3,28,78,Sales\n4,41,88,Sales\n');
        });

        afterAll(() => {
            if (fs.existsSync(testCsvPath)) fs.unlinkSync(testCsvPath);
        });

        it('should successfully detect delimiter, stream, and analyze CSVs via analyzeFile', async () => {
            const res = await analyzeFile(testCsvPath, 'text/csv');
            
            // Verify structural success
            expect(res).toBeDefined();
            expect(res.type).toBe('Enterprise Strategic Intelligence');
            expect(res.summary.rows).toBe(4);
            expect(res.summary.columnTypes['department']).toBe('category');
            expect(res.summary.columnTypes['score']).toBe('number');

            // Verify a distribution/pie chart was constructed for department
            expect(res.options.find(opt => opt.chartType === 'pie' || opt.chartType === 'bar')).toBeDefined();
        });
        
        it('should properly reject unauthorized directory traversal attempts gracefully', async () => {
            process.env.UPLOAD_DIR = path.join(__dirname, 'fake_dir');
            const res = await analyzeFile('/etc/passwd', 'text/csv');
            expect(res.type).toBe('Error');
            expect(res.dataLimitations[0]).toContain('Security Error');
        });
    });
});

import { AppDataSource } from './src/config/database';
import { getFiles } from './src/controllers/files';
import express from 'express';
import request from 'supertest';
import authMiddleware from './src/middleware/auth';
const app = express();
app.use(express.json());
app.get('/files', (req: any, res: any, next: any) => { req.user = { userId: "e9cdb07c-3f41-4c12-8e9a-ebbe6c7a40ca" }; next(); }, getFiles);

AppDataSource.initialize().then(async () => {
    const userRepo = AppDataSource.getRepository('User');
    const author = await userRepo.findOne({ select: ['id'], order: { createdAt: 'DESC' } });
    if (!author) return console.log("NO USERS");
    
    app.get('/files2', (req: any, res: any, next: any) => { req.user = { userId: author.id }; next(); }, getFiles);
    
    const response = await request(app).get('/files2');
    const targetFile = response.body.find((f: any) => f.originalName === 'customers.csv');
    console.log("Returned from getFiles:", targetFile?.filename, "isProcessed:", targetFile?.isProcessed);
    process.exit(0);
});

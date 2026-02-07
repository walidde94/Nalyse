import { Request, Response } from 'express';
import { AppDataSource } from '../config/database';
import { Report } from '../entities/Report';
import { v4 as uuidv4 } from 'uuid';

const reportRepo = AppDataSource.getRepository(Report);

// Save Analysis as Report
export const saveReport = async (req: Request, res: Response) => {
    try {
        const { title, config } = req.body;
        const userId = (req as any).user?.userId;

        if (!userId) return res.status(401).json({ error: 'Unauthorized' });

        const report = reportRepo.create({
            title: title || 'Untitled Analysis',
            config: JSON.stringify(config),
            userId: userId, // Assuming userId is string in db now
        });

        await reportRepo.save(report);

        res.json(report);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to save report' });
    }
};

// Generate Share Link
export const shareReport = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const userId = (req as any).user?.userId;

        if (!userId) return res.status(401).json({ error: 'Unauthorized' });

        // 1. Fetch first to check ownership
        const report = await reportRepo.findOne({ where: { id: id as string } });

        // Note: report.userId is a string (UUID), and userId from JWT is likely string
        if (!report || report.userId !== userId) {
            return res.status(404).json({ error: 'Report not found' });
        }

        const token = uuidv4();
        report.isPublic = true;
        report.shareToken = token;

        await reportRepo.save(report);

        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
        res.json({ link: `${frontendUrl}/share/${token}` });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to generate share link' });
    }
};

// Get Public Report
export const getPublicReport = async (req: Request, res: Response) => {
    try {
        const { token } = req.params;

        if (!token) {
            return res.status(400).json({ error: 'Share token is required' });
        }

        const report = await reportRepo.findOne({
            where: { shareToken: token as string },
        });

        if (!report || !report.isPublic) {
            return res.status(404).json({ error: 'Report not found or not public' });
        }

        res.json(JSON.parse(report.config));
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to retrieve report' });
    }
};

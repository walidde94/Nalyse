import { Request, Response } from 'express';
import { PulseService } from '../services/pulseService';

const pulseService = new PulseService();

export const getPulse = async (req: Request, res: Response) => {
    try {
        // @ts-ignore
        const userId = req.user.userId;
        const metrics = await pulseService.getWorkspacePulse(userId);
        res.json(metrics);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

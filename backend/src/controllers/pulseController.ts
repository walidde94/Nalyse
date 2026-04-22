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

export const getObservabilityMetrics = async (req: Request, res: Response) => {
    try {
        const timestamp = new Date().toISOString();
        
        // Mock data generation for nalyse-db and nalyse-backend
        const metrics = {
            timestamp,
            services: {
                'nalyse-db': {
                    cpu: Math.random() * 0.1, // 0 to 0.1 vCPU
                    memory: 100 + Math.random() * 50, // 100 to 150 MB
                    networkEgress: Math.random() * 0.5, // 0 to 0.5 MB
                    diskUsage: 25.4 + Math.random() * 0.1 // ~25.4 GB
                },
                'nalyse-backend': {
                    cpu: Math.random() * 0.2 + 0.05, // 0.05 to 0.25 vCPU
                    memory: 200 + Math.random() * 100, // 200 to 300 MB
                    networkEgress: Math.random() * 5, // 0 to 5 MB
                    diskUsage: 2.1 + Math.random() * 0.01 // ~2.1 GB
                }
            }
        };
        
        res.json(metrics);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

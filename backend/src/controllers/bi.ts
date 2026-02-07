import { Request, Response } from 'express';
import { getBiData } from '../services/biService';

export const getBiDataset = async (req: Request, res: Response) => {
    try {
        const { type } = req.params;

        if (!type || typeof type !== 'string') {
            return res.status(400).json({ error: 'Invalid use case type' });
        }

        const data = await getBiData(type);

        if (!data || data.length === 0) {
            return res.status(404).json({ error: 'Dataset not found for this use case' });
        }

        res.json({
            type,
            data,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('Error fetching BI data:', error);
        res.status(500).json({ error: 'Failed to fetch BI data' });
    }
};

import { Request, Response } from 'express';
import { AgentService } from '../services/agentService';

const agentService = new AgentService();

export const startAgent = async (req: Request, res: Response): Promise<void> => {
    try {
        const { goal, role } = req.body;
        // @ts-ignore - User attached by auth middleware
        const userId = req.user.userId;

        const agent = await agentService.startAgent(userId, goal, role);
        res.status(201).json(agent);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

export const getAgentStatus = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        // @ts-ignore
        const userId = req.user.userId;

        const status = await agentService.getAgentStatus(String(id), userId);
        res.json(status);
    } catch (error: any) {
        res.status(404).json({ error: error.message });
    }
};

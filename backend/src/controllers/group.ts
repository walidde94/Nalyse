import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { GroupService } from '../services/groupService';

const groupService = new GroupService();

export const createGroup = async (req: AuthRequest, res: Response) => {
    try {
        const { name, description } = req.body;
        const userId = req.user!.userId;
        const group = await groupService.createGroup(name, description, userId);
        res.status(201).json(group);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

export const getGroups = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user!.userId;
        const groups = await groupService.getGroups(userId);
        res.json(groups);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

export const getGroup = async (req: AuthRequest, res: Response) => {
    try {
        const id = req.params.id as string;
        const userId = req.user!.userId;
        const group = await groupService.getGroupById(id, userId);
        res.json(group);
    } catch (error: any) {
        res.status(404).json({ error: error.message });
    }
};

export const updateGroup = async (req: AuthRequest, res: Response) => {
    try {
        const id = req.params.id as string;
        const { name, description } = req.body;
        const userId = req.user!.userId;
        const group = await groupService.updateGroup(id, name, description, userId);
        res.json(group);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

export const deleteGroup = async (req: AuthRequest, res: Response) => {
    try {
        const id = req.params.id as string;
        const userId = req.user!.userId;
        await groupService.deleteGroup(id, userId);
        res.json({ message: 'Group deleted successfully' });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

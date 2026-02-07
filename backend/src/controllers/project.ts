import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { ProjectService } from '../services/projectService';

const projectService = new ProjectService();

export const createProject = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user!.userId;
        const project = await projectService.createProject({ ...req.body, ownerId: userId });
        res.status(201).json(project);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

export const getProjects = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user!.userId;
        const projects = await projectService.getProjects(userId);
        res.json(projects);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

export const updateProjectStatus = async (req: AuthRequest, res: Response) => {
    try {
        const id = req.params.id as string;
        const { status } = req.body;
        const userId = req.user!.userId;
        const project = await projectService.updateProjectStatus(id, status, userId);
        res.json(project);
    } catch (error: any) {
        if (error.message.includes('not found')) {
            return res.status(404).json({ error: 'Project not found' });
        }
        res.status(500).json({ error: error.message });
    }
};

export const deleteProject = async (req: AuthRequest, res: Response) => {
    try {
        const id = req.params.id as string;
        const userId = req.user!.userId;
        await projectService.deleteProject(id, userId);
        res.json({ message: 'Project deleted' });
    } catch (error: any) {
        if (error.message.includes('not found')) {
            return res.status(404).json({ error: 'Project not found' });
        }
        res.status(500).json({ error: error.message });
    }
};

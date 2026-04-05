import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { AppDataSource } from '../config/database';
import { Dashboard } from '../entities/Dashboard';

const dashboardRepo = AppDataSource.getRepository(Dashboard);

export const getDashboards = async (req: AuthRequest, res: Response) => {
    const userId = req.user?.userId;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    try {
        const dashboards = await dashboardRepo.find({
            where: { userId },
            order: { updatedAt: 'DESC' }
        });
        res.json(dashboards);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to fetch dashboards' });
    }
};

export const createDashboard = async (req: AuthRequest, res: Response) => {
    const userId = req.user?.userId;
    const organizationId = req.user?.organizationId;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const { name, panels, gridLayout } = req.body;

    try {
        const dashboard = dashboardRepo.create({
            name: name || 'Default Dashboard',
            panels: panels || [],
            gridLayout: gridLayout || [],
            userId,
            organizationId
        });

        await dashboardRepo.save(dashboard);
        
        // Broadcast Update
        try {
            const { broadcastUpdate } = require('../index');
            broadcastUpdate('dashboard', { action: 'create', dashboardId: dashboard.id, userId });
        } catch (e) { }

        res.json(dashboard);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to create dashboard' });
    }
};

export const updateDashboard = async (req: AuthRequest, res: Response) => {
    const userId = req.user?.userId;
    const { id } = req.params;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const { name, panels, gridLayout } = req.body;

    try {
        const dashboard = await dashboardRepo.findOne({ where: { id: id as string, userId } });
        if (!dashboard) return res.status(404).json({ error: 'Dashboard not found' });

        if (name !== undefined) dashboard.name = name;
        if (panels !== undefined) dashboard.panels = panels;
        if (gridLayout !== undefined) dashboard.gridLayout = gridLayout;

        await dashboardRepo.save(dashboard);

        // Broadcast Update
        try {
            const { broadcastUpdate } = require('../index');
            broadcastUpdate('dashboard', { action: 'update', dashboardId: dashboard.id, userId });
        } catch (e) { }

        res.json(dashboard);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to update dashboard' });
    }
};

export const deleteDashboard = async (req: AuthRequest, res: Response) => {
    const userId = req.user?.userId;
    const { id } = req.params;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    try {
        const result = await dashboardRepo.delete({ id: id as string, userId });
        if (result.affected === 0) return res.status(404).json({ error: 'Dashboard not found' });

        // Broadcast Update
        try {
            const { broadcastUpdate } = require('../index');
            broadcastUpdate('dashboard', { action: 'delete', dashboardId: id, userId });
        } catch (e) { }

        res.json({ message: 'Dashboard deleted' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to delete dashboard' });
    }
};

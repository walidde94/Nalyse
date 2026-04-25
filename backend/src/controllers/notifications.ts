import { Request, Response } from 'express';
import * as notifService from '../services/notificationService';

/**
 * GET /api/notifications
 * Query: ?category=critical&unreadOnly=true&limit=50&offset=0
 */
export async function getNotifications(req: Request, res: Response) {
    try {
        const userId = (req as any).user?.userId || (req as any).user?.id;
        if (!userId) return res.status(401).json({ error: 'Unauthorized' });

        const { category, unreadOnly, limit, offset } = req.query;
        const result = await notifService.getUserNotifications(userId, {
            category: category as any,
            unreadOnly: unreadOnly === 'true',
            limit: parseInt(limit as string) || 50,
            offset: parseInt(offset as string) || 0,
        });

        return res.json(result);
    } catch (error) {
        console.error('Error fetching notifications:', error);
        return res.status(500).json({ error: 'Failed to fetch notifications' });
    }
}

/**
 * GET /api/notifications/unread-counts
 */
export async function getUnreadCounts(req: Request, res: Response) {
    try {
        const userId = (req as any).user?.userId || (req as any).user?.id;
        if (!userId) return res.status(401).json({ error: 'Unauthorized' });

        const counts = await notifService.getUnreadCounts(userId);
        return res.json(counts);
    } catch (error) {
        console.error('Error fetching unread counts:', error);
        return res.status(500).json({ error: 'Failed to fetch unread counts' });
    }
}

/**
 * PATCH /api/notifications/:id/read
 */
export async function markRead(req: Request, res: Response) {
    try {
        const userId = (req as any).user?.userId || (req as any).user?.id;
        if (!userId) return res.status(401).json({ error: 'Unauthorized' });

        await notifService.markAsRead(req.params.id as string, userId);
        return res.json({ success: true });
    } catch (error) {
        console.error('Error marking notification read:', error);
        return res.status(500).json({ error: 'Failed to mark as read' });
    }
}

/**
 * PATCH /api/notifications/read-all
 */
export async function markAllRead(req: Request, res: Response) {
    try {
        const userId = (req as any).user?.userId || (req as any).user?.id;
        if (!userId) return res.status(401).json({ error: 'Unauthorized' });

        await notifService.markAllAsRead(userId);
        return res.json({ success: true });
    } catch (error) {
        console.error('Error marking all read:', error);
        return res.status(500).json({ error: 'Failed to mark all as read' });
    }
}

/**
 * PATCH /api/notifications/:id/pin
 */
export async function togglePin(req: Request, res: Response) {
    try {
        const userId = (req as any).user?.userId || (req as any).user?.id;
        if (!userId) return res.status(401).json({ error: 'Unauthorized' });

        const notif = await notifService.togglePin(req.params.id as string, userId);
        if (!notif) return res.status(404).json({ error: 'Notification not found' });
        return res.json(notif);
    } catch (error) {
        console.error('Error toggling pin:', error);
        return res.status(500).json({ error: 'Failed to toggle pin' });
    }
}

/**
 * DELETE /api/notifications/:id
 */
export async function deleteNotification(req: Request, res: Response) {
    try {
        const userId = (req as any).user?.userId || (req as any).user?.id;
        if (!userId) return res.status(401).json({ error: 'Unauthorized' });

        await notifService.deleteNotification(req.params.id as string, userId);
        return res.json({ success: true });
    } catch (error) {
        console.error('Error deleting notification:', error);
        return res.status(500).json({ error: 'Failed to delete notification' });
    }
}

/**
 * DELETE /api/notifications
 */
export async function deleteAllNotifications(req: Request, res: Response) {
    try {
        const userId = (req as any).user?.userId || (req as any).user?.id;
        if (!userId) return res.status(401).json({ error: 'Unauthorized' });

        await notifService.deleteAllNotifications(userId);
        return res.json({ success: true });
    } catch (error) {
        console.error('Error deleting all notifications:', error);
        return res.status(500).json({ error: 'Failed to delete all notifications' });
    }
}

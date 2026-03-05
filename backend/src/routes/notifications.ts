import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import {
    getNotifications,
    getUnreadCounts,
    markRead,
    markAllRead,
    togglePin,
    deleteNotification,
    deleteAllNotifications,
} from '../controllers/notifications';

const router = Router();

router.get('/', authenticate, getNotifications);
router.get('/unread-counts', authenticate, getUnreadCounts);
router.patch('/read-all', authenticate, markAllRead);
router.patch('/:id/read', authenticate, markRead);
router.patch('/:id/pin', authenticate, togglePin);
router.delete('/:id', authenticate, deleteNotification);
router.delete('/', authenticate, deleteAllNotifications);

export default router;

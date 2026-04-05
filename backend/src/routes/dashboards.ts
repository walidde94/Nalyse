import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import {
    getDashboards,
    createDashboard,
    updateDashboard,
    deleteDashboard
} from '../controllers/dashboards';

const router = Router();

router.get('/', authenticate, getDashboards);
router.post('/', authenticate, createDashboard);
router.put('/:id', authenticate, updateDashboard);
router.delete('/:id', authenticate, deleteDashboard);

export default router;

import { Router } from 'express';
import { 
    createAlertRule, 
    getAlertRules, 
    toggleAlertRule, 
    deleteAlertRule 
} from '../controllers/alertsController';
import { authenticate } from '../middleware/auth';

const router = Router();

// Ensure all alert routes are protected
router.use(authenticate);

router.get('/', getAlertRules);
router.post('/', createAlertRule);
router.put('/:id/toggle', toggleAlertRule);
router.delete('/:id', deleteAlertRule);

export default router;

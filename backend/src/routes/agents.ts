import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import * as agentController from '../controllers/agentController';

const router = Router();

router.post('/start', authenticate, agentController.startAgent);
router.get('/:id', authenticate, agentController.getAgentStatus);

export default router;

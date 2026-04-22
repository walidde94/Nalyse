import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import * as pulseController from '../controllers/pulseController';

const router = Router();

router.get('/', authenticate, pulseController.getPulse);
router.get('/observability', authenticate, pulseController.getObservabilityMetrics);

export default router;

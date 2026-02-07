import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import * as pulseController from '../controllers/pulseController';

const router = Router();

router.get('/', authenticate, pulseController.getPulse);

export default router;

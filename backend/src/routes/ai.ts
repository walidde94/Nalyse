import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { handleNlqQuery, generateSynthesis } from '../controllers/aiController';

const router = Router();

router.use(authenticate as any);

router.post('/nlq', handleNlqQuery);
router.post('/synthesis', generateSynthesis);

export default router;

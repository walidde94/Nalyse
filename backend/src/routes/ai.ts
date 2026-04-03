import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { handleNlqQuery, generateSynthesis, handleRootCauseAnalysis, handleForecast } from '../controllers/aiController';

const router = Router();

router.use(authenticate as any);

router.post('/nlq', handleNlqQuery);
router.post('/synthesis', generateSynthesis);
router.post('/rca', handleRootCauseAnalysis);
router.post('/forecast', handleForecast);

export default router;

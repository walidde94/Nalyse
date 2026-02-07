import { Router } from 'express';
import { getBiDataset } from '../controllers/bi';
import {
    forecastController,
    abTestController,
    regressionController,
    cohortController,
    funnelController
} from '../controllers/advancedAnalytics';

const router = Router();

router.get('/:type', getBiDataset);

// Advanced Analytics Routes
router.post('/forecast', forecastController);
router.post('/ab-test', abTestController);
router.post('/regression', regressionController);
router.post('/cohort', cohortController);
router.post('/funnel', funnelController);

export default router;

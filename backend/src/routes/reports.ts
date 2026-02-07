import { Router } from 'express';
import { saveReport, shareReport, getPublicReport } from '../controllers/reports';
import { authenticate } from '../middleware/auth';

const router = Router();

// Save Analysis (Authenticated)
router.post('/', authenticate, saveReport);

// Generate Share Link (Authenticated)
router.post('/:id/share', authenticate, shareReport);

// Access Public Report (Public)
router.get('/public/:token', getPublicReport);

export default router;

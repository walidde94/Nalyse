import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { createSource, getSources, analyzeSource, deleteSource, updateSource } from '../controllers/sources';

const router = Router();

router.use(authenticate);

router.post('/', createSource);
router.get('/', getSources);
router.put('/:id', updateSource);
router.get('/:id/analyze', analyzeSource);
router.delete('/:id', deleteSource);

export default router;

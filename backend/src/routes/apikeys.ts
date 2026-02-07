import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { listApiKeys, createApiKey, revokeApiKey } from '../controllers/apikeys';

const router = Router();

router.get('/', authenticate, listApiKeys);
router.post('/', authenticate, createApiKey);
router.delete('/:key', authenticate, revokeApiKey);

export default router;

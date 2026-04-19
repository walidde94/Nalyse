import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { getOrganization, updateOrganization, inviteMember } from '../controllers/organization';

const router = Router();


router.get('/', authenticate, getOrganization);
router.put('/', authenticate, updateOrganization);
router.post('/invite', authenticate, inviteMember);

export default router;

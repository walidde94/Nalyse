import { Router } from 'express';
import {
    sendWorkspaceInvitation,
    acceptInvitation,
    declineInvitation,
    listInvitations,
    revokeInvitation
} from '../controllers/invitations';
import { authenticate } from '../middleware/auth';

const router = Router();

// Authenticated routes
router.post('/', authenticate, sendWorkspaceInvitation);
router.get('/', authenticate, listInvitations);
router.delete('/:id', authenticate, revokeInvitation);

// Token-based routes (accept/decline can be done by anyone with the token)
router.post('/:token/accept', authenticate, acceptInvitation);
router.post('/:token/decline', declineInvitation);

export default router;

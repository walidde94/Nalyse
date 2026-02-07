import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { createGroup, getGroups, getGroup, updateGroup, deleteGroup } from '../controllers/group';

const router = Router();

router.use(authenticate);

router.post('/', createGroup);
router.get('/', getGroups);
router.get('/:id', getGroup);
router.patch('/:id', updateGroup);
router.delete('/:id', deleteGroup);

export default router;

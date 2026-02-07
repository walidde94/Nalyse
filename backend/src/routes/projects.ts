import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { createProject, getProjects, updateProjectStatus, deleteProject } from '../controllers/project';

const router = Router();

router.use(authenticate);

router.post('/', createProject);
router.get('/', getProjects);
router.patch('/:id/status', updateProjectStatus);
router.delete('/:id', deleteProject);

export default router;

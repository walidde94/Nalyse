import { Router } from 'express';
import { authenticate } from '../../middleware/auth';
import {
    listConfigs, listPresets, getConfig,
    createConfig, updateConfig, deleteConfig,
    saveAsPreset, applyConfig
} from './analysis.controller';

const router = Router();

// All routes require authentication
router.use(authenticate);

router.get('/', listConfigs);
router.get('/presets', listPresets);
router.get('/:id', getConfig);
router.post('/', createConfig);
router.put('/:id', updateConfig);
router.delete('/:id', deleteConfig);

router.post('/:id/save-preset', saveAsPreset);
router.post('/:id/apply', applyConfig);

export default router;

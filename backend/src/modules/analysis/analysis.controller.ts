import { Request, Response } from 'express';
import { AuthRequest } from '../../middleware/auth';
import { analysisConfigService } from './analysis.service';
import { CreateAnalysisConfigDTO, UpdateAnalysisConfigDTO } from './analysis.types';

/**
 * GET /api/analysis-config
 * List all configurations for the authenticated user (+ built-in presets).
 */
export const listConfigs = async (req: AuthRequest, res: Response) => {
    try {
        const configs = await analysisConfigService.findAllForUser(req.user!.userId);
        res.json({ configs });
    } catch (err: any) {
        res.status(500).json({ error: err.message || 'Failed to fetch configurations' });
    }
};

/**
 * GET /api/analysis-config/presets
 * List only presets (built-in + user-saved).
 */
export const listPresets = async (req: AuthRequest, res: Response) => {
    try {
        const presets = await analysisConfigService.findPresets(req.user!.userId);
        res.json({ presets });
    } catch (err: any) {
        res.status(500).json({ error: err.message || 'Failed to fetch presets' });
    }
};

/**
 * GET /api/analysis-config/:id
 * Get a single configuration.
 */
export const getConfig = async (req: AuthRequest, res: Response) => {
    try {
        const config = await analysisConfigService.findById(req.params.id as string, req.user!.userId);
        if (!config) return res.status(404).json({ error: 'Configuration not found' });
        res.json({ config });
    } catch (err: any) {
        res.status(500).json({ error: err.message || 'Failed to fetch configuration' });
    }
};

/**
 * POST /api/analysis-config
 * Create a new configuration.
 */
export const createConfig = async (req: AuthRequest, res: Response) => {
    try {
        const dto: CreateAnalysisConfigDTO = req.body;
        if (!dto.name || !dto.mode) {
            return res.status(400).json({ error: 'Name and mode are required.' });
        }

        const { config, validation } = await analysisConfigService.create(req.user!.userId, dto);

        if (!validation.valid) {
            return res.status(422).json({ error: 'Validation failed', validation });
        }

        res.status(201).json({ config, validation });
    } catch (err: any) {
        res.status(500).json({ error: err.message || 'Failed to create configuration' });
    }
};

/**
 * PUT /api/analysis-config/:id
 * Update a configuration.
 */
export const updateConfig = async (req: AuthRequest, res: Response) => {
    try {
        const dto: UpdateAnalysisConfigDTO = req.body;
        const { config, validation } = await analysisConfigService.update(req.params.id as string, req.user!.userId, dto);

        if (!validation.valid) {
            return res.status(422).json({ error: 'Validation failed', validation });
        }

        res.json({ config, validation });
    } catch (err: any) {
        if (err.message === 'Configuration not found') {
            return res.status(404).json({ error: err.message });
        }
        if (err.message === 'Built-in presets cannot be modified') {
            return res.status(403).json({ error: err.message });
        }
        res.status(500).json({ error: err.message || 'Failed to update configuration' });
    }
};

/**
 * DELETE /api/analysis-config/:id
 * Delete a configuration.
 */
export const deleteConfig = async (req: AuthRequest, res: Response) => {
    try {
        await analysisConfigService.delete(req.params.id as string, req.user!.userId);
        res.json({ success: true });
    } catch (err: any) {
        if (err.message === 'Configuration not found') {
            return res.status(404).json({ error: err.message });
        }
        if (err.message === 'Built-in presets cannot be deleted') {
            return res.status(403).json({ error: err.message });
        }
        res.status(500).json({ error: err.message || 'Failed to delete configuration' });
    }
};

/**
 * POST /api/analysis-config/:id/save-preset
 * Clone a configuration as a reusable preset.
 */
export const saveAsPreset = async (req: AuthRequest, res: Response) => {
    try {
        const { name } = req.body;
        const preset = await analysisConfigService.saveAsPreset(req.params.id as string, req.user!.userId, name);
        res.status(201).json({ preset });
    } catch (err: any) {
        if (err.message.includes('not found')) {
            return res.status(404).json({ error: err.message });
        }
        res.status(500).json({ error: err.message || 'Failed to save preset' });
    }
};

/**
 * POST /api/analysis-config/:id/apply
 * Apply a configuration to a dataset via the ML engine.
 */
export const applyConfig = async (req: AuthRequest, res: Response) => {
    try {
        const { datasetId } = req.body;
        if (!datasetId) {
            return res.status(400).json({ error: 'datasetId is required.' });
        }

        const result = await analysisConfigService.applyToDataset(req.params.id as string, datasetId, req.user!.userId);
        res.json({ result });
    } catch (err: any) {
        if (err.message === 'Configuration not found') {
            return res.status(404).json({ error: err.message });
        }
        res.status(500).json({ error: err.message || 'Failed to apply configuration' });
    }
};

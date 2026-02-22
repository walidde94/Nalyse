import { Router } from 'express';
import { validateExternalKey } from '../middleware/apiKeyAuth';
import { upload } from '../middleware/upload';
import {
    apiUploadDataset,
    apiRunAnalysis,
    apiCleanDataset,
    apiGenerateCharts,
    apiGetDataset
} from '../controllers/v1/apiController';
import { getTelemetry, pushTelemetry } from '../controllers/v1/telemetryController';

import { openApiSpec } from '../config/openapi';

import { checkFeatureAccess } from '../middleware/gating';
import { apiLogger } from '../middleware/apiLogger';

const router = Router();

// Docs
router.get('/openapi.json', (req, res) => res.json(openApiSpec));

// Performance & Audit Logging
router.use(apiLogger);

// Global middleware for v1
router.use(validateExternalKey);

/**
 * @api {get} /v1/telemetry Get Telemetry Data (Internal Test)
 */
router.get('/telemetry', getTelemetry);

/**
 * @api {post} /v1/telemetry Push Telemetry Row (Internal Test)
 */
router.post('/telemetry', pushTelemetry);

/**
 * @api {post} /v1/datasets Upload Dataset
 */
router.post('/datasets', upload.single('file'), apiUploadDataset);

/**
 * @api {get} /v1/datasets/:id Get Dataset Meta
 */
router.get('/datasets/:id', apiGetDataset);

/**
 * @api {post} /v1/datasets/:id/clean Clean/Preprocess Dataset
 */
router.post('/datasets/:id/clean', apiCleanDataset);

/**
 * @api {post} /v1/analysis Run Statistical Analysis
 */
router.post('/analysis', checkFeatureAccess('pro_analytics'), apiRunAnalysis);

/**
 * @api {post} /v1/charts Generate Chart Metadata
 */
router.post('/charts', checkFeatureAccess('pro_analytics'), apiGenerateCharts);

export default router;

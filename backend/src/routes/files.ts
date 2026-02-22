import { Router } from 'express';
import { upload } from '../middleware/upload';
import { authenticate } from '../middleware/auth';
import { uploadFile, getFiles, analyzeFileHandler, scrapeUrlHandler, deleteFileHandler, toggleFavoriteHandler, transformFileHandler, updateFileGroupHandler, previewFileHandler } from '../controllers/files';
import { uploadMultipleFilesHandler, analyzeMultipleDatasetsHandler } from '../controllers/multiDataset';

import { checkStorageLimit, checkFeatureAccess } from '../middleware/gating';

const router = Router();

router.post('/upload', authenticate, checkStorageLimit, upload.single('file'), uploadFile);
router.post('/upload-multiple', authenticate, checkFeatureAccess('multi_dataset'), checkStorageLimit, upload.array('files', 20), uploadMultipleFilesHandler);
router.post('/analyze-multiple', authenticate, checkFeatureAccess('multi_dataset'), analyzeMultipleDatasetsHandler);
router.get('/', authenticate, getFiles);
router.get('/:id/analyze', authenticate, analyzeFileHandler);
router.get('/:id/preview', authenticate, previewFileHandler);
router.post('/:id/transform', authenticate, transformFileHandler);
router.delete('/:id', authenticate, deleteFileHandler);
router.patch('/:id/favorite', authenticate, toggleFavoriteHandler);
router.patch('/:id/group', authenticate, updateFileGroupHandler);
router.post('/scrape', authenticate, scrapeUrlHandler);

export default router;

import { Router } from 'express';
import { upload } from '../middleware/upload';
import { authenticate } from '../middleware/auth';
import { uploadFile, getFiles, analyzeFileHandler, scrapeUrlHandler, deleteFileHandler, toggleFavoriteHandler, transformFileHandler, updateFileGroupHandler } from '../controllers/files';
import { uploadMultipleFilesHandler, analyzeMultipleDatasetsHandler } from '../controllers/multiDataset';

const router = Router();

router.post('/upload', authenticate, upload.single('file'), uploadFile);
router.post('/upload-multiple', authenticate, upload.array('files', 20), uploadMultipleFilesHandler);
router.post('/analyze-multiple', authenticate, analyzeMultipleDatasetsHandler);
router.get('/', authenticate, getFiles);
router.get('/:id/analyze', authenticate, analyzeFileHandler);
router.post('/:id/transform', authenticate, transformFileHandler);
router.delete('/:id', authenticate, deleteFileHandler);
router.patch('/:id/favorite', authenticate, toggleFavoriteHandler);
router.patch('/:id/group', authenticate, updateFileGroupHandler);
router.post('/scrape', authenticate, scrapeUrlHandler);

export default router;

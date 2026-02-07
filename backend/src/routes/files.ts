import { Router } from 'express';
import { upload } from '../middleware/upload';
import { authenticate } from '../middleware/auth';
import { uploadFile, getFiles, analyzeFileHandler, scrapeUrlHandler, deleteFileHandler, toggleFavoriteHandler, transformFileHandler, updateFileGroupHandler } from '../controllers/files';

const router = Router();

router.post('/upload', authenticate, upload.single('file'), uploadFile);
router.get('/', authenticate, getFiles);
router.get('/:id/analyze', authenticate, analyzeFileHandler);
router.post('/:id/transform', authenticate, transformFileHandler);
router.delete('/:id', authenticate, deleteFileHandler);
router.patch('/:id/favorite', authenticate, toggleFavoriteHandler);
router.patch('/:id/group', authenticate, updateFileGroupHandler);
router.post('/scrape', authenticate, scrapeUrlHandler);

export default router;

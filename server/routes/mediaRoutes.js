import express from 'express';
import { uploadMedia } from '../controllers/mediaController.js';
import { upload } from '../middleware/upload.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

router.post('/upload', authenticateToken, upload.single('media'), uploadMedia);

export default router;

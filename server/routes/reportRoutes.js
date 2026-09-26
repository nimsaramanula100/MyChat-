import express from 'express';
import { reportUser, blockUser, unblockUser, getBlockedUsers } from '../controllers/reportController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

router.post('/report', authenticateToken, reportUser);
router.post('/block', authenticateToken, blockUser);
router.delete('/block/:targetUserId', authenticateToken, unblockUser);
router.get('/blocked', authenticateToken, getBlockedUsers);

export default router;

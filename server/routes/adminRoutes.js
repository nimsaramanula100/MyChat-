import express from 'express';
import { getAdminStats, getUsersList, toggleUserSuspend, getReports, updateReportStatus } from '../controllers/adminController.js';
import { authenticateToken, requireAdmin } from '../middleware/auth.js';

const router = express.Router();

router.use(authenticateToken);
router.use(requireAdmin);

router.get('/stats', getAdminStats);
router.get('/users', getUsersList);
router.post('/users/:userId/suspend', toggleUserSuspend);
router.get('/reports', getReports);
router.patch('/reports/:reportId', updateReportStatus);

export default router;

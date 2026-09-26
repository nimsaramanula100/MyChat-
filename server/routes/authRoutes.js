import express from 'express';
import { sendOtp, verifyOtp, logout, logoutAllOtherDevices, getActiveDevices } from '../controllers/authController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

router.post('/send-otp', sendOtp);
router.post('/verify-otp', verifyOtp);
router.post('/logout', authenticateToken, logout);
router.post('/logout-all', authenticateToken, logoutAllOtherDevices);
router.get('/devices', authenticateToken, getActiveDevices);

export default router;

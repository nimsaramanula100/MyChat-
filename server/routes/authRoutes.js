import express from 'express';
import { register, login, logout, logoutAllOtherDevices, getActiveDevices } from '../controllers/authController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.post('/logout', authenticateToken, logout);
router.post('/logout-all', authenticateToken, logoutAllOtherDevices);
router.get('/devices', authenticateToken, getActiveDevices);

export default router;

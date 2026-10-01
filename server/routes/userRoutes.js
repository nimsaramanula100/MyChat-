import express from 'express';
import {
  getMe, updateProfile, updatePrivacySettings, updateSecuritySettings,
  searchUsers, getContacts, addContact, syncContacts, deleteAccount
} from '../controllers/userController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

router.get('/me', authenticateToken, getMe);
router.patch('/me', authenticateToken, updateProfile);
router.patch('/privacy', authenticateToken, updatePrivacySettings);
router.patch('/security', authenticateToken, updateSecuritySettings);

router.get('/search', authenticateToken, searchUsers);
router.get('/contacts', authenticateToken, getContacts);
router.post('/contacts', authenticateToken, addContact);
router.post('/contacts/sync', authenticateToken, syncContacts);

router.delete('/me', authenticateToken, deleteAccount);

export default router;

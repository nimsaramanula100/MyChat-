import express from 'express';
import {
  getChats, createChat, getMessages, sendMessage, consumeViewOnce,
  hideChat, unlockHiddenChats, togglePinChat, setChatBackground,
  getGroupInfo, updateGroupInfo, addGroupMembers, removeGroupMember, leaveGroup
} from '../controllers/chatController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

router.get('/', authenticateToken, getChats);
router.post('/', authenticateToken, createChat);

router.get('/:roomId/group-info', authenticateToken, getGroupInfo);
router.patch('/:roomId/group-info', authenticateToken, updateGroupInfo);
router.post('/:roomId/members', authenticateToken, addGroupMembers);
router.delete('/:roomId/members/:targetUserId', authenticateToken, removeGroupMember);
router.post('/:roomId/leave', authenticateToken, leaveGroup);

router.get('/:roomId/messages', authenticateToken, getMessages);
router.post('/:roomId/messages', authenticateToken, sendMessage);

router.post('/messages/:messageId/consume-view-once', authenticateToken, consumeViewOnce);

router.post('/hide', authenticateToken, hideChat);
router.post('/unlock-hidden', authenticateToken, unlockHiddenChats);

router.post('/:roomId/pin', authenticateToken, togglePinChat);
router.post('/:roomId/background', authenticateToken, setChatBackground);

export default router;

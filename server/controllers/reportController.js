import crypto from 'crypto';
import { getDb } from '../config/database.js';

function generateId() {
  return crypto.randomUUID();
}

export async function reportUser(req, res) {
  try {
    const { reportedUserId, category, description } = req.body;
    if (!reportedUserId || !category) {
      return res.status(400).json({ error: 'Reported user ID and category are required' });
    }

    const db = await getDb();
    const reportId = generateId();

    await db.run(
      `INSERT INTO reports (id, reporter_id, reported_user_id, category, description)
       VALUES (?, ?, ?, ?, ?)`,
      [reportId, req.user.id, reportedUserId, category, description || '']
    );

    return res.json({ success: true, message: 'Report submitted for review' });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to submit report' });
  }
}

export async function blockUser(req, res) {
  try {
    const { targetUserId } = req.body;
    if (!targetUserId) {
      return res.status(400).json({ error: 'Target user ID required' });
    }

    const db = await getDb();
    await db.run(
      `INSERT INTO blocked_users (id, user_id, blocked_user_id)
       VALUES (?, ?, ?)
       ON CONFLICT(user_id, blocked_user_id) DO NOTHING`,
      [generateId(), req.user.id, targetUserId]
    );

    return res.json({ success: true, message: 'User blocked' });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to block user' });
  }
}

export async function unblockUser(req, res) {
  try {
    const { targetUserId } = req.params;
    const db = await getDb();

    await db.run('DELETE FROM blocked_users WHERE user_id = ? AND blocked_user_id = ?', [req.user.id, targetUserId]);
    return res.json({ success: true, message: 'User unblocked' });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to unblock user' });
  }
}

export async function getBlockedUsers(req, res) {
  try {
    const db = await getDb();
    const blocked = await db.all(
      `SELECT b.id AS block_id, u.id, u.display_name, u.username, u.avatar
       FROM blocked_users b
       JOIN users u ON b.blocked_user_id = u.id
       WHERE b.user_id = ?`,
      [req.user.id]
    );

    return res.json({ blocked });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to fetch blocked users' });
  }
}

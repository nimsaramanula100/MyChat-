import { getDb } from '../config/database.js';

export async function getAdminStats(req, res) {
  try {
    const db = await getDb();
    const usersCount = await db.get('SELECT COUNT(*) as count FROM users');
    const messagesCount = await db.get('SELECT COUNT(*) as count FROM messages');
    const roomsCount = await db.get('SELECT COUNT(*) as count FROM chat_rooms');
    const reportsCount = await db.get('SELECT COUNT(*) as count FROM reports WHERE status = "pending"');

    return res.json({
      totalUsers: usersCount ? usersCount.count : 0,
      totalMessages: messagesCount ? messagesCount.count : 0,
      totalRooms: roomsCount ? roomsCount.count : 0,
      pendingReports: reportsCount ? reportsCount.count : 0
    });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to fetch admin stats' });
  }
}

export async function getUsersList(req, res) {
  try {
    const db = await getDb();
    const users = await db.all('SELECT id, phone_number, display_name, username, avatar, is_admin, is_suspended, created_at FROM users ORDER BY created_at DESC');
    return res.json({ users });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to fetch users list' });
  }
}

export async function toggleUserSuspend(req, res) {
  try {
    const { userId } = req.params;
    const db = await getDb();
    const user = await db.get('SELECT is_suspended FROM users WHERE id = ?', [userId]);
    if (!user) return res.status(404).json({ error: 'User not found' });

    const newStatus = user.is_suspended ? 0 : 1;
    await db.run('UPDATE users SET is_suspended = ? WHERE id = ?', [newStatus, userId]);
    return res.json({ success: true, isSuspended: Boolean(newStatus) });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to toggle user suspension' });
  }
}

export async function getReports(req, res) {
  try {
    const db = await getDb();
    const reports = await db.all(
      `SELECT r.*,
              u1.display_name AS reporter_name,
              u2.display_name AS reported_name
       FROM reports r
       JOIN users u1 ON r.reporter_id = u1.id
       JOIN users u2 ON r.reported_user_id = u2.id
       ORDER BY r.created_at DESC`
    );
    return res.json({ reports });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to fetch reports' });
  }
}

export async function updateReportStatus(req, res) {
  try {
    const { reportId } = req.params;
    const { status } = req.body;
    const db = await getDb();

    await db.run('UPDATE reports SET status = ? WHERE id = ?', [status, reportId]);
    return res.json({ success: true, status });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to update report status' });
  }
}

import { User, Message, ChatRoom, ChatMember, Report, BlockedUser } from '../models/index.js';

export async function getAdminStats(req, res) {
  try {
    const [totalUsers, totalMessages, totalRooms, pendingReports] = await Promise.all([
      User.countDocuments(),
      Message.countDocuments(),
      ChatRoom.countDocuments(),
      Report.countDocuments({ status: 'pending' }),
    ]);
    return res.json({ totalUsers, totalMessages, totalRooms, pendingReports });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to fetch admin stats' });
  }
}

export async function getUsersList(req, res) {
  try {
    const users = await User.find().sort({ createdAt: -1 }).lean();
    return res.json({
      users: users.map(u => ({
        id: u._id,
        email: u.email,
        displayName: u.displayName,
        username: u.username,
        avatar: u.avatar,
        isAdmin: u.isAdmin,
        isSuspended: u.isSuspended,
        createdAt: u.createdAt,
      })),
    });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to fetch users list' });
  }
}

export async function toggleUserSuspend(req, res) {
  try {
    const { userId } = req.params;
    const user = await User.findById(userId).lean();
    if (!user) return res.status(404).json({ error: 'User not found' });

    const newStatus = !user.isSuspended;
    await User.findByIdAndUpdate(userId, { isSuspended: newStatus });
    return res.json({ success: true, isSuspended: newStatus });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to toggle user suspension' });
  }
}

export async function getReports(req, res) {
  try {
    const reports = await Report.find().sort({ createdAt: -1 }).lean();
    const userIds = [...new Set([...reports.map(r => r.reporterId), ...reports.map(r => r.reportedUserId)])];
    const users = await User.find({ _id: { $in: userIds } }).lean();
    const userMap = Object.fromEntries(users.map(u => [String(u._id), u]));

    return res.json({
      reports: reports.map(r => ({
        ...r,
        reporter_name: userMap[String(r.reporterId)]?.displayName || '',
        reported_name: userMap[String(r.reportedUserId)]?.displayName || '',
      })),
    });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to fetch reports' });
  }
}

export async function updateReportStatus(req, res) {
  try {
    const { reportId } = req.params;
    const { status } = req.body;
    await Report.findByIdAndUpdate(reportId, { status });
    return res.json({ success: true, status });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to update report status' });
  }
}

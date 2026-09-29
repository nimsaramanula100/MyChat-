import { Report, BlockedUser, User } from '../models/index.js';

export async function reportUser(req, res) {
  try {
    const { reportedUserId, category, description } = req.body;
    if (!reportedUserId || !category) {
      return res.status(400).json({ error: 'Reported user ID and category are required' });
    }

    await Report.create({
      reporterId: req.user._id,
      reportedUserId,
      category,
      description: description || '',
    });

    return res.json({ success: true, message: 'Report submitted for review' });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to submit report' });
  }
}

export async function blockUser(req, res) {
  try {
    const { targetUserId } = req.body;
    if (!targetUserId) return res.status(400).json({ error: 'Target user ID required' });

    await BlockedUser.findOneAndUpdate(
      { userId: req.user._id, blockedUserId: targetUserId },
      {},
      { upsert: true }
    );

    return res.json({ success: true, message: 'User blocked' });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to block user' });
  }
}

export async function unblockUser(req, res) {
  try {
    const { targetUserId } = req.params;
    await BlockedUser.deleteOne({ userId: req.user._id, blockedUserId: targetUserId });
    return res.json({ success: true, message: 'User unblocked' });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to unblock user' });
  }
}

export async function getBlockedUsers(req, res) {
  try {
    const blocked = await BlockedUser.find({ userId: req.user._id }).lean();
    const ids = blocked.map(b => b.blockedUserId);
    const users = await User.find({ _id: { $in: ids } }).lean();
    const userMap = Object.fromEntries(users.map(u => [String(u._id), u]));

    return res.json({
      blocked: blocked.map(b => {
        const u = userMap[String(b.blockedUserId)];
        return {
          block_id: b._id,
          id: u?._id,
          displayName: u?.displayName,
          username: u?.username,
          avatar: u?.avatar,
        };
      }),
    });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to fetch blocked users' });
  }
}

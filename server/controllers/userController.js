import bcrypt from 'bcryptjs';
import { User } from '../models/index.js';

export async function getMe(req, res) {
  try {
    const user = await User.findById(req.user._id).lean();
    return res.json({
      user: {
        id: user._id,
        email: user.email,
        displayName: user.displayName,
        username: user.username,
        bio: user.bio,
        avatar: user.avatar,
        isAdmin: Boolean(user.isAdmin),
        createdAt: user.createdAt,
      },
      privacy: user.privacy || {},
      security: {
        hasPin: Boolean(user.security?.appLockPinHash),
        notificationPrivacy: user.security?.notificationPrivacy || 'preview',
        autoLockMinutes: user.security?.autoLockMinutes || 0,
      },
    });
  } catch (err) {
    console.error('getMe error:', err);
    return res.status(500).json({ error: 'Failed to fetch user profile' });
  }
}

export async function updateProfile(req, res) {
  try {
    const { displayName, username, bio, avatar } = req.body;

    if (username) {
      const existing = await User.findOne({ username: username.trim(), _id: { $ne: req.user._id } }).lean();
      if (existing) {
        return res.status(400).json({ error: 'Username is already taken' });
      }
    }

    const updates = {};
    if (displayName) updates.displayName = displayName.trim();
    if (username) updates.username = username.trim();
    if (bio !== undefined) updates.bio = bio.trim();
    if (avatar) updates.avatar = avatar;

    const updatedUser = await User.findByIdAndUpdate(req.user._id, updates, { new: true }).lean();

    return res.json({
      success: true,
      user: {
        id: updatedUser._id,
        email: updatedUser.email,
        displayName: updatedUser.displayName,
        username: updatedUser.username,
        bio: updatedUser.bio,
        avatar: updatedUser.avatar,
        isAdmin: Boolean(updatedUser.isAdmin),
      },
    });
  } catch (err) {
    console.error('updateProfile error:', err);
    return res.status(500).json({ error: 'Failed to update profile' });
  }
}

export async function updatePrivacySettings(req, res) {
  try {
    const {
      emailPrivacy,
      lastSeenPrivacy,
      profilePhotoPrivacy,
      onlineStatusPrivacy,
      whoCanMessage,
      readReceiptsEnabled,
    } = req.body;

    const privacyUpdate = {};
    if (emailPrivacy !== undefined) privacyUpdate['privacy.emailPrivacy'] = emailPrivacy;
    if (lastSeenPrivacy !== undefined) privacyUpdate['privacy.lastSeenPrivacy'] = lastSeenPrivacy;
    if (profilePhotoPrivacy !== undefined) privacyUpdate['privacy.profilePhotoPrivacy'] = profilePhotoPrivacy;
    if (onlineStatusPrivacy !== undefined) privacyUpdate['privacy.onlineStatusPrivacy'] = onlineStatusPrivacy;
    if (whoCanMessage !== undefined) privacyUpdate['privacy.whoCanMessage'] = whoCanMessage;
    if (readReceiptsEnabled !== undefined) privacyUpdate['privacy.readReceiptsEnabled'] = readReceiptsEnabled;

    const updated = await User.findByIdAndUpdate(req.user._id, privacyUpdate, { new: true }).lean();
    return res.json({ success: true, privacy: updated.privacy });
  } catch (err) {
    console.error('updatePrivacy error:', err);
    return res.status(500).json({ error: 'Failed to update privacy settings' });
  }
}

export async function updateSecuritySettings(req, res) {
  try {
    const { pin, notificationPrivacy, autoLockMinutes } = req.body;

    const securityUpdate = {};
    if (pin !== undefined) {
      if (pin && pin.length >= 4) {
        securityUpdate['security.appLockPinHash'] = await bcrypt.hash(pin, 10);
      } else if (pin === '' || pin === null) {
        securityUpdate['security.appLockPinHash'] = '';
      }
    }
    if (notificationPrivacy !== undefined) securityUpdate['security.notificationPrivacy'] = notificationPrivacy;
    if (autoLockMinutes !== undefined) securityUpdate['security.autoLockMinutes'] = autoLockMinutes;

    await User.findByIdAndUpdate(req.user._id, securityUpdate);
    return res.json({ success: true, message: 'Security settings updated' });
  } catch (err) {
    console.error('updateSecurity error:', err);
    return res.status(500).json({ error: 'Failed to update security settings' });
  }
}

export async function searchUsers(req, res) {
  try {
    const { query } = req.query;
    if (!query || query.trim().length === 0) {
      return res.json({ users: [] });
    }

    const regex = new RegExp(query.trim(), 'i');
    const users = await User.find({
      $or: [{ username: regex }, { displayName: regex }, { email: regex }],
      _id: { $ne: req.user._id },
      isSuspended: false,
    }).limit(20).lean();

    return res.json({
      users: users.map(u => ({
        id: u._id,
        displayName: u.displayName,
        username: u.username,
        avatar: u.avatar,
        bio: u.bio,
      })),
    });
  } catch (err) {
    return res.status(500).json({ error: 'User search failed' });
  }
}

export async function getContacts(req, res) {
  try {
    const { Contact } = await import('../models/index.js');
    const contacts = await Contact.find({ userId: req.user._id }).lean();

    const userIds = contacts.map(c => c.contactId);
    const users = await User.find({ _id: { $in: userIds } }).lean();
    const userMap = Object.fromEntries(users.map(u => [u._id, u]));

    return res.json({
      contacts: contacts.map(c => {
        const u = userMap[c.contactId];
        return {
          contact_record_id: c._id,
          alias: c.alias,
          id: u?._id,
          displayName: u?.displayName,
          username: u?.username,
          avatar: u?.avatar,
          bio: u?.bio,
          email: u?.email,
        };
      }),
    });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to fetch contacts' });
  }
}

export async function addContact(req, res) {
  try {
    const { Contact } = await import('../models/index.js');
    const { contactUserId, email, alias } = req.body;

    let targetUser = null;
    if (contactUserId) {
      targetUser = await User.findById(contactUserId).lean();
    } else if (email) {
      const cleanEmail = email.trim().toLowerCase();
      targetUser = await User.findOne({ email: cleanEmail }).lean();
    }

    if (!targetUser) {
      return res.status(404).json({ registered: false, error: 'This user is not registered on MyChat.' });
    }
    if (String(targetUser._id) === String(req.user._id)) {
      return res.status(400).json({ error: 'You cannot add yourself as a contact.' });
    }

    await Contact.findOneAndUpdate(
      { userId: req.user._id, contactId: targetUser._id },
      { alias: alias || targetUser.displayName },
      { upsert: true, new: true }
    );

    return res.json({
      success: true,
      registered: true,
      message: 'Contact added successfully',
      contact: {
        id: targetUser._id,
        displayName: targetUser.displayName,
        username: targetUser.username,
        avatar: targetUser.avatar,
        bio: targetUser.bio,
        email: targetUser.email,
      },
    });
  } catch (err) {
    console.error('addContact error:', err);
    return res.status(500).json({ error: 'Failed to add contact' });
  }
}

export async function syncContacts(req, res) {
  try {
    const { emails } = req.body;
    if (!Array.isArray(emails) || emails.length === 0) {
      return res.json({ registered: [], unregistered: [] });
    }

    const normalizedList = [...new Set(emails.map(e => e.trim().toLowerCase()).filter(Boolean))];
    if (!normalizedList.length) return res.json({ registered: [], unregistered: [] });

    const matchedUsers = await User.find({
      email: { $in: normalizedList },
      _id: { $ne: req.user._id },
      isSuspended: false,
    }).lean();

    const registeredEmails = new Set(matchedUsers.map(u => u.email));
    const unregistered = normalizedList.filter(e => !registeredEmails.has(e)).map(e => ({ email: e }));

    return res.json({
      registered: matchedUsers.map(u => ({
        id: u._id,
        displayName: u.displayName,
        username: u.username,
        avatar: u.avatar,
        bio: u.bio,
        email: u.email,
      })),
      unregistered,
    });
  } catch (err) {
    console.error('syncContacts error:', err);
    return res.status(500).json({ error: 'Failed to sync contacts' });
  }
}

export async function deleteAccount(req, res) {
  try {
    await User.findByIdAndDelete(req.user._id);
    return res.json({ success: true, message: 'Account permanently deleted' });
  } catch (err) {
    return res.status(500).json({ error: 'Account deletion failed' });
  }
}

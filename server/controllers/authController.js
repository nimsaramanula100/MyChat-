import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { User, Session } from '../models/index.js';

export async function register(req, res) {
  try {
    const { email, password, displayName, deviceName, platform } = req.body;
    if (!email || !password || !displayName) {
      return res.status(400).json({ error: 'Email, password, and display name are required' });
    }

    const cleanEmail = email.trim().toLowerCase();

    let existingUser = await User.findOne({ email: cleanEmail }).lean();
    if (existingUser) {
      return res.status(400).json({ error: 'Email is already registered' });
    }

    const username = `user_${cleanEmail.split('@')[0]}_${Math.floor(Math.random() * 1000)}`;
    const passwordHash = await bcrypt.hash(password, 10);

    const user = await User.create({
      email: cleanEmail,
      passwordHash,
      displayName: displayName.trim(),
      username,
      bio: 'Hey there! I am using MyChat.',
      avatar: `https://api.dicebear.com/7.x/bottts/svg?seed=${username}`,
    });

    const jwtSecret = process.env.JWT_SECRET || 'super_secret_jwt_token_key_change_in_production_2026';
    const token = jwt.sign(
      { userId: user._id, email: user.email },
      jwtSecret,
      { expiresIn: '30d' }
    );

    await Session.create({
      userId: user._id,
      deviceName: deviceName || 'Web Browser',
      platform: platform || 'Desktop / Mobile Web',
      ipAddress: req.ip || '127.0.0.1',
      token,
    });

    return res.json({
      success: true,
      token,
      isNewUser: true,
      user: {
        id: user._id,
        email: user.email,
        displayName: user.displayName,
        username: user.username,
        bio: user.bio,
        avatar: user.avatar,
        isAdmin: Boolean(user.isAdmin),
      },
    });
  } catch (err) {
    console.error('register error:', err);
    return res.status(500).json({ error: 'Registration failed' });
  }
}

export async function login(req, res) {
  try {
    const { email, password, deviceName, platform } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const user = await User.findOne({ email: cleanEmail }).lean();

    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (!isValid) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    if (user.isSuspended) {
      return res.status(403).json({ error: 'Account suspended. Contact support.' });
    }

    const jwtSecret = process.env.JWT_SECRET || 'super_secret_jwt_token_key_change_in_production_2026';
    const token = jwt.sign(
      { userId: user._id, email: user.email },
      jwtSecret,
      { expiresIn: '30d' }
    );

    await Session.create({
      userId: user._id,
      deviceName: deviceName || 'Web Browser',
      platform: platform || 'Desktop / Mobile Web',
      ipAddress: req.ip || '127.0.0.1',
      token,
    });

    return res.json({
      success: true,
      token,
      isNewUser: false,
      user: {
        id: user._id,
        email: user.email,
        displayName: user.displayName,
        username: user.username,
        bio: user.bio,
        avatar: user.avatar,
        isAdmin: Boolean(user.isAdmin),
      },
    });
  } catch (err) {
    console.error('login error:', err);
    return res.status(500).json({ error: 'Login failed' });
  }
}

export async function logout(req, res) {
  try {
    await Session.findByIdAndDelete(req.session._id);
    return res.json({ success: true, message: 'Logged out successfully' });
  } catch (err) {
    return res.status(500).json({ error: 'Logout failed' });
  }
}

export async function logoutAllOtherDevices(req, res) {
  try {
    await Session.deleteMany({ userId: req.user._id, _id: { $ne: req.session._id } });
    return res.json({ success: true, message: 'Logged out from all other devices' });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to logout other devices' });
  }
}

export async function getActiveDevices(req, res) {
  try {
    const sessions = await Session.find({ userId: req.user._id }).sort({ lastActive: -1 }).lean();

    const devices = sessions.map(s => ({
      id: s._id,
      deviceName: s.deviceName,
      platform: s.platform,
      ipAddress: s.ipAddress,
      lastActive: s.lastActive,
      createdAt: s.createdAt,
      isCurrent: String(s._id) === String(req.session._id),
    }));

    return res.json({ devices });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to fetch active devices' });
  }
}

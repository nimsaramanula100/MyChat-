import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { getDb } from '../config/database.js';

function generateId() {
  return crypto.randomUUID();
}

export async function sendOtp(req, res) {
  try {
    const { phoneNumber } = req.body;
    if (!phoneNumber || phoneNumber.trim().length < 8) {
      return res.status(400).json({ error: 'Valid phone number is required' });
    }

    const cleanPhone = phoneNumber.trim();
    const devOtp = process.env.DEV_OTP || '123456';
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString(); // 10 mins expiry

    const db = await getDb();
    await db.run(
      'INSERT INTO otp_verifications (id, phone_number, otp_code, expires_at) VALUES (?, ?, ?, ?)',
      [generateId(), cleanPhone, devOtp, expiresAt]
    );

    return res.json({
      success: true,
      message: `OTP sent successfully. (Dev mode OTP: ${devOtp})`,
      devOtp: devOtp
    });
  } catch (err) {
    console.error('sendOtp error:', err);
    return res.status(500).json({ error: 'Failed to send OTP' });
  }
}

export async function verifyOtp(req, res) {
  try {
    const { phoneNumber, otpCode, deviceName, platform } = req.body;
    if (!phoneNumber || !otpCode) {
      return res.status(400).json({ error: 'Phone number and OTP code are required' });
    }

    const cleanPhone = phoneNumber.trim();
    const db = await getDb();

    // Verify OTP
    const record = await db.get(
      `SELECT * FROM otp_verifications 
       WHERE phone_number = ? AND otp_code = ? AND verified = 0 
       ORDER BY created_at DESC LIMIT 1`,
      [cleanPhone, otpCode]
    );

    if (!record) {
      return res.status(400).json({ error: 'Invalid or expired OTP code' });
    }

    // Check expiration
    if (new Date(record.expires_at) < new Date()) {
      return res.status(400).json({ error: 'OTP code has expired' });
    }

    // Mark OTP verified
    await db.run('UPDATE otp_verifications SET verified = 1 WHERE id = ?', [record.id]);

    // Check if user exists
    let user = await db.get('SELECT * FROM users WHERE phone_number = ?', [cleanPhone]);
    let isNewUser = false;

    if (!user) {
      isNewUser = true;
      const userId = generateId();
      const baseName = `User_${cleanPhone.slice(-4)}`;
      const username = `user_${cleanPhone.replace(/[^0-9]/g, '')}_${Math.floor(100 + Math.random() * 900)}`;

      await db.run(
        `INSERT INTO users (id, phone_number, display_name, username, bio, avatar)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [userId, cleanPhone, baseName, username, 'Hey there! I am using NovaChat.', `https://api.dicebear.com/7.x/bottts/svg?seed=${username}`]
      );

      user = await db.get('SELECT * FROM users WHERE id = ?', [userId]);

      // Initialize Privacy & Security settings
      await db.run(
        `INSERT INTO user_privacy_settings (user_id) VALUES (?)`,
        [userId]
      );
      await db.run(
        `INSERT INTO user_security_settings (user_id) VALUES (?)`,
        [userId]
      );
    }

    // Generate JWT
    const jwtSecret = process.env.JWT_SECRET || 'super_secret_jwt_token_key_change_in_production_2026';
    const token = jwt.sign(
      { userId: user.id, phone: user.phone_number },
      jwtSecret,
      { expiresIn: '30d' }
    );

    // Record session
    const sessionId = generateId();
    await db.run(
      `INSERT INTO sessions (id, user_id, device_name, platform, ip_address, token)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        sessionId,
        user.id,
        deviceName || 'Web Browser',
        platform || 'Desktop / Mobile Web',
        req.ip || '127.0.0.1',
        token
      ]
    );

    return res.json({
      success: true,
      token,
      isNewUser,
      user: {
        id: user.id,
        phoneNumber: user.phone_number,
        displayName: user.display_name,
        username: user.username,
        bio: user.bio,
        avatar: user.avatar,
        isAdmin: Boolean(user.is_admin)
      }
    });
  } catch (err) {
    console.error('verifyOtp error:', err);
    return res.status(500).json({ error: 'Verification failed' });
  }
}

export async function logout(req, res) {
  try {
    const db = await getDb();
    await db.run('DELETE FROM sessions WHERE id = ?', [req.session.id]);
    return res.json({ success: true, message: 'Logged out successfully' });
  } catch (err) {
    return res.status(500).json({ error: 'Logout failed' });
  }
}

export async function logoutAllOtherDevices(req, res) {
  try {
    const db = await getDb();
    await db.run('DELETE FROM sessions WHERE user_id = ? AND id != ?', [req.user.id, req.session.id]);
    return res.json({ success: true, message: 'Logged out from all other devices' });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to logout other devices' });
  }
}

export async function getActiveDevices(req, res) {
  try {
    const db = await getDb();
    const sessions = await db.all(
      'SELECT id, device_name, platform, ip_address, last_active, created_at FROM sessions WHERE user_id = ? ORDER BY last_active DESC',
      [req.user.id]
    );

    const devices = sessions.map(s => ({
      id: s.id,
      deviceName: s.device_name,
      platform: s.platform,
      ipAddress: s.ip_address,
      lastActive: s.last_active,
      createdAt: s.created_at,
      isCurrent: s.id === req.session.id
    }));

    return res.json({ devices });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to fetch active devices' });
  }
}

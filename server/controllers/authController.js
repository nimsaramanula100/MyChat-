import jwt from 'jsonwebtoken';
import { User, OtpVerification, Session } from '../models/index.js';
import { normalizePhoneNumber } from '../utils/phone.js';

export async function sendOtp(req, res) {
  try {
    const { phoneNumber } = req.body;
    if (!phoneNumber || phoneNumber.trim().length < 7) {
      return res.status(400).json({ error: 'Valid phone number is required' });
    }

    const cleanPhone = normalizePhoneNumber(phoneNumber);
    const generatedOtp = process.env.DEV_OTP || Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    // Rate-limit: 15 seconds between OTPs
    const recent = await OtpVerification
      .findOne({ phoneNumber: cleanPhone })
      .sort({ createdAt: -1 })
      .lean();

    if (recent && (Date.now() - new Date(recent.createdAt).getTime()) < 15000) {
      return res.status(429).json({ error: 'Please wait 15 seconds before requesting another OTP.' });
    }

    await OtpVerification.create({
      phoneNumber: cleanPhone,
      otpCode: generatedOtp,
      expiresAt,
    });

    console.log(`[OTP SERVICE] Generated OTP for ${cleanPhone}: ${generatedOtp}`);

    return res.json({
      success: true,
      message: `OTP sent to ${cleanPhone}.`,
      devOtp: process.env.DEV_MODE === 'true' ? generatedOtp : undefined,
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

    const cleanPhone = normalizePhoneNumber(phoneNumber);

    const record = await OtpVerification
      .findOne({ phoneNumber: cleanPhone, otpCode: otpCode.trim(), verified: false })
      .sort({ createdAt: -1 })
      .lean();

    if (!record) {
      return res.status(400).json({ error: 'Invalid or expired OTP code' });
    }

    if (new Date(record.expiresAt) < new Date()) {
      return res.status(400).json({ error: 'OTP code has expired. Please request a new one.' });
    }

    await OtpVerification.findByIdAndUpdate(record._id, { verified: true });

    let user = await User.findOne({ phoneNumber: cleanPhone }).lean();
    let isNewUser = false;

    if (!user) {
      isNewUser = true;
      const username = `user_${cleanPhone.replace(/[^0-9]/g, '')}`;
      user = await User.create({
        phoneNumber: cleanPhone,
        displayName: `User_${cleanPhone.slice(-4)}`,
        username,
        bio: 'Hey there! I am using MyChat.',
        avatar: `https://api.dicebear.com/7.x/bottts/svg?seed=${username}`,
      });
      user = user.toObject();
    }

    const jwtSecret = process.env.JWT_SECRET || 'super_secret_jwt_token_key_change_in_production_2026';
    const token = jwt.sign(
      { userId: user._id, phone: user.phoneNumber },
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
      isNewUser,
      user: {
        id: user._id,
        phoneNumber: user.phoneNumber,
        displayName: user.displayName,
        username: user.username,
        bio: user.bio,
        avatar: user.avatar,
        isAdmin: Boolean(user.isAdmin),
      },
    });
  } catch (err) {
    console.error('verifyOtp error:', err);
    return res.status(500).json({ error: 'Verification failed' });
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

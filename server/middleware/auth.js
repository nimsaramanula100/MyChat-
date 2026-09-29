import jwt from 'jsonwebtoken';
import { User, Session } from '../models/index.js';

export async function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = (authHeader && authHeader.split(' ')[1]) || req.query.token;

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  try {
    const jwtSecret = process.env.JWT_SECRET || 'super_secret_jwt_token_key_change_in_production_2026';
    const decoded = jwt.verify(token, jwtSecret);

    const user = await User.findById(decoded.userId).lean();
    if (!user) {
      return res.status(401).json({ error: 'User not found or token invalid' });
    }

    if (user.isSuspended) {
      return res.status(403).json({ error: 'Account suspended. Contact support.' });
    }

    const session = await Session.findOne({ token }).lean();
    if (!session) {
      return res.status(401).json({ error: 'Session expired or logged out' });
    }

    // Update last active
    await Session.findByIdAndUpdate(session._id, { lastActive: new Date() });

    req.user = user;
    req.session = session;
    next();
  } catch (err) {
    return res.status(403).json({ error: 'Invalid or expired token' });
  }
}

export function requireAdmin(req, res, next) {
  if (!req.user || !req.user.isAdmin) {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
}

import jwt from 'jsonwebtoken';
import { getDb } from '../config/database.js';

export async function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1] || req.query.token;

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  try {
    const jwtSecret = process.env.JWT_SECRET || 'super_secret_jwt_token_key_change_in_production_2026';
    const decoded = jwt.verify(token, jwtSecret);

    const db = await getDb();
    const user = await db.get('SELECT * FROM users WHERE id = ?', [decoded.userId]);

    if (!user) {
      return res.status(401).json({ error: 'User not found or token invalid' });
    }

    if (user.is_suspended) {
      return res.status(403).json({ error: 'Account suspended. Contact support.' });
    }

    // Verify session
    const session = await db.get('SELECT * FROM sessions WHERE token = ?', [token]);
    if (!session) {
      return res.status(401).json({ error: 'Session expired or logged out' });
    }

    // Update last active time for session
    await db.run('UPDATE sessions SET last_active = CURRENT_TIMESTAMP WHERE id = ?', [session.id]);

    req.user = user;
    req.session = session;
    next();
  } catch (err) {
    return res.status(403).json({ error: 'Invalid or expired token' });
  }
}

export function requireAdmin(req, res, next) {
  if (!req.user || !req.user.is_admin) {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
}

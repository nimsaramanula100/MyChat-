import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { getDb } from '../config/database.js';
import { calculateHaversineDistance } from '../utils/distance.js';

function generateId() {
  return crypto.randomUUID();
}

export async function getMe(req, res) {
  try {
    const db = await getDb();
    const user = await db.get('SELECT * FROM users WHERE id = ?', [req.user.id]);
    const privacy = await db.get('SELECT * FROM user_privacy_settings WHERE user_id = ?', [req.user.id]);
    const security = await db.get('SELECT * FROM user_security_settings WHERE user_id = ?', [req.user.id]);

    return res.json({
      user: {
        id: user.id,
        phoneNumber: user.phone_number,
        displayName: user.display_name,
        username: user.username,
        bio: user.bio,
        avatar: user.avatar,
        isAdmin: Boolean(user.is_admin),
        createdAt: user.created_at
      },
      privacy: privacy || {},
      security: {
        hasPin: Boolean(security?.app_lock_pin_hash),
        notificationPrivacy: security?.notification_privacy || 'preview',
        autoLockMinutes: security?.auto_lock_minutes || 0
      }
    });
  } catch (err) {
    console.error('getMe error:', err);
    return res.status(500).json({ error: 'Failed to fetch user profile' });
  }
}

export async function updateProfile(req, res) {
  try {
    const { displayName, username, bio, avatar } = req.body;
    const db = await getDb();

    if (username) {
      // Check username uniqueness if changing
      const existing = await db.get('SELECT id FROM users WHERE username = ? AND id != ?', [username.trim(), req.user.id]);
      if (existing) {
        return res.status(400).json({ error: 'Username is already taken' });
      }
    }

    await db.run(
      `UPDATE users SET
        display_name = COALESCE(?, display_name),
        username = COALESCE(?, username),
        bio = COALESCE(?, bio),
        avatar = COALESCE(?, avatar),
        updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [
        displayName ? displayName.trim() : null,
        username ? username.trim() : null,
        bio !== undefined ? bio.trim() : null,
        avatar || null,
        req.user.id
      ]
    );

    const updatedUser = await db.get('SELECT * FROM users WHERE id = ?', [req.user.id]);

    return res.json({
      success: true,
      user: {
        id: updatedUser.id,
        phoneNumber: updatedUser.phone_number,
        displayName: updatedUser.display_name,
        username: updatedUser.username,
        bio: updatedUser.bio,
        avatar: updatedUser.avatar,
        isAdmin: Boolean(updatedUser.is_admin)
      }
    });
  } catch (err) {
    console.error('updateProfile error:', err);
    return res.status(500).json({ error: 'Failed to update profile' });
  }
}

export async function updatePrivacySettings(req, res) {
  try {
    const {
      phonePrivacy,
      lastSeenPrivacy,
      profilePhotoPrivacy,
      onlineStatusPrivacy,
      locationDiscoveryEnabled,
      whoCanMessage,
      readReceiptsEnabled
    } = req.body;

    const db = await getDb();
    await db.run(
      `INSERT INTO user_privacy_settings (
        user_id, phone_privacy, last_seen_privacy, profile_photo_privacy,
        online_status_privacy, location_discovery_enabled, who_can_message, read_receipts_enabled
       ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(user_id) DO UPDATE SET
        phone_privacy = COALESCE(excluded.phone_privacy, phone_privacy),
        last_seen_privacy = COALESCE(excluded.last_seen_privacy, last_seen_privacy),
        profile_photo_privacy = COALESCE(excluded.profile_photo_privacy, profile_photo_privacy),
        online_status_privacy = COALESCE(excluded.online_status_privacy, online_status_privacy),
        location_discovery_enabled = COALESCE(excluded.location_discovery_enabled, location_discovery_enabled),
        who_can_message = COALESCE(excluded.who_can_message, who_can_message),
        read_receipts_enabled = COALESCE(excluded.read_receipts_enabled, read_receipts_enabled)`,
      [
        req.user.id,
        phonePrivacy,
        lastSeenPrivacy,
        profilePhotoPrivacy,
        onlineStatusPrivacy,
        locationDiscoveryEnabled !== undefined ? (locationDiscoveryEnabled ? 1 : 0) : null,
        whoCanMessage,
        readReceiptsEnabled !== undefined ? (readReceiptsEnabled ? 1 : 0) : null
      ]
    );

    const updated = await db.get('SELECT * FROM user_privacy_settings WHERE user_id = ?', [req.user.id]);
    return res.json({ success: true, privacy: updated });
  } catch (err) {
    console.error('updatePrivacy error:', err);
    return res.status(500).json({ error: 'Failed to update privacy settings' });
  }
}

export async function updateSecuritySettings(req, res) {
  try {
    const { pin, notificationPrivacy, autoLockMinutes } = req.body;
    const db = await getDb();

    let pinHash = null;
    if (pin !== undefined) {
      if (pin && pin.length >= 4) {
        pinHash = await bcrypt.hash(pin, 10);
      } else if (pin === '' || pin === null) {
        pinHash = '';
      }
    }

    await db.run(
      `INSERT INTO user_security_settings (user_id, app_lock_pin_hash, auto_lock_minutes, notification_privacy)
       VALUES (?, ?, ?, ?)
       ON CONFLICT(user_id) DO UPDATE SET
        app_lock_pin_hash = COALESCE(?, app_lock_pin_hash),
        auto_lock_minutes = COALESCE(?, auto_lock_minutes),
        notification_privacy = COALESCE(?, notification_privacy)`,
      [
        req.user.id,
        pinHash !== null ? pinHash : '',
        autoLockMinutes || 0,
        notificationPrivacy || 'preview',
        pinHash !== null ? pinHash : null,
        autoLockMinutes,
        notificationPrivacy
      ]
    );

    return res.json({ success: true, message: 'Security settings updated' });
  } catch (err) {
    console.error('updateSecurity error:', err);
    return res.status(500).json({ error: 'Failed to update security settings' });
  }
}

export async function updateLocation(req, res) {
  try {
    const { latitude, longitude, locationName } = req.body;
    if (latitude === undefined || longitude === undefined) {
      return res.status(400).json({ error: 'Latitude and longitude required' });
    }

    const db = await getDb();
    await db.run(
      `INSERT INTO user_locations (user_id, latitude, longitude, approx_location_name, updated_at)
       VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
       ON CONFLICT(user_id) DO UPDATE SET
        latitude = excluded.latitude,
        longitude = excluded.longitude,
        approx_location_name = excluded.approx_location_name,
        updated_at = CURRENT_TIMESTAMP`,
      [req.user.id, latitude, longitude, locationName || 'Approximate area']
    );

    return res.json({ success: true, message: 'Location updated successfully' });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to update location' });
  }
}

export async function getNearbyPeople(req, res) {
  try {
    const db = await getDb();

    // Check current user location
    const myLoc = await db.get('SELECT * FROM user_locations WHERE user_id = ?', [req.user.id]);
    const myPrivacy = await db.get('SELECT location_discovery_enabled FROM user_privacy_settings WHERE user_id = ?', [req.user.id]);

    if (!myPrivacy || !myPrivacy.location_discovery_enabled) {
      return res.json({
        enabled: false,
        message: 'Location discovery is currently disabled in your privacy settings.',
        people: []
      });
    }

    // Default coords if user hasn't set custom coords (e.g. Colombo, Sri Lanka / London default)
    const myLat = myLoc ? myLoc.latitude : 6.9271;
    const myLon = myLoc ? myLoc.longitude : 79.8612;

    // Fetch other users who have location discovery enabled
    const candidateUsers = await db.all(
      `SELECT u.id, u.display_name, u.username, u.avatar, u.bio,
              l.latitude, l.longitude, l.approx_location_name,
              p.location_discovery_enabled, p.phone_privacy
       FROM users u
       JOIN user_locations l ON u.id = l.user_id
       LEFT JOIN user_privacy_settings p ON u.id = p.user_id
       WHERE u.id != ? AND u.is_suspended = 0 AND (p.location_discovery_enabled IS NULL OR p.location_discovery_enabled = 1)`,
      [req.user.id]
    );

    const people = candidateUsers.map(u => {
      const distText = calculateHaversineDistance(myLat, myLon, u.latitude, u.longitude);
      return {
        id: u.id,
        displayName: u.display_name,
        username: u.username,
        avatar: u.avatar,
        bio: u.bio,
        distanceText: distText,
        approxLocation: u.approx_location_name || 'Nearby'
      };
    });

    return res.json({
      enabled: true,
      people
    });
  } catch (err) {
    console.error('getNearbyPeople error:', err);
    return res.status(500).json({ error: 'Failed to fetch nearby people' });
  }
}

export async function searchUsers(req, res) {
  try {
    const { query } = req.query;
    if (!query || query.trim().length === 0) {
      return res.json({ users: [] });
    }

    const searchTerm = `%${query.trim()}%`;
    const db = await getDb();
    const users = await db.all(
      `SELECT id, display_name, username, avatar, bio, phone_number
       FROM users
       WHERE (username LIKE ? OR display_name LIKE ? OR phone_number LIKE ?)
         AND id != ? AND is_suspended = 0
       LIMIT 20`,
      [searchTerm, searchTerm, searchTerm, req.user.id]
    );

    return res.json({
      users: users.map(u => ({
        id: u.id,
        displayName: u.display_name,
        username: u.username,
        avatar: u.avatar,
        bio: u.bio
      }))
    });
  } catch (err) {
    return res.status(500).json({ error: 'User search failed' });
  }
}

export async function getContacts(req, res) {
  try {
    const db = await getDb();
    const contacts = await db.all(
      `SELECT c.id AS contact_record_id, c.alias, u.id, u.display_name, u.username, u.avatar, u.bio, u.phone_number
       FROM contacts c
       JOIN users u ON c.contact_id = u.id
       WHERE c.user_id = ?`,
      [req.user.id]
    );

    return res.json({ contacts });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to fetch contacts' });
  }
}

export async function addContact(req, res) {
  try {
    const { contactUserId, alias } = req.body;
    if (!contactUserId) {
      return res.status(400).json({ error: 'Target user ID is required' });
    }

    const db = await getDb();
    await db.run(
      `INSERT INTO contacts (id, user_id, contact_id, alias)
       VALUES (?, ?, ?, ?)
       ON CONFLICT(user_id, contact_id) DO UPDATE SET alias = excluded.alias`,
      [generateId(), req.user.id, contactUserId, alias || '']
    );

    return res.json({ success: true, message: 'Contact added successfully' });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to add contact' });
  }
}

export async function deleteAccount(req, res) {
  try {
    const db = await getDb();
    await db.run('DELETE FROM users WHERE id = ?', [req.user.id]);
    return res.json({ success: true, message: 'Account permanently deleted' });
  } catch (err) {
    return res.status(500).json({ error: 'Account deletion failed' });
  }
}

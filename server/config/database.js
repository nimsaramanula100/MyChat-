import pkg from 'pg';
const { Pool } = pkg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

pool.on('connect', () => {
  console.log('Connected to PostgreSQL database!');
});

// Helper to convert SQLite '?' to PostgreSQL '$1, $2'
const convertQuery = (sql) => {
  let i = 1;
  return sql.replace(/\?/g, () => `$${i++}`);
};

const dbWrapper = {
  get: async (sql, params = []) => {
    try {
        const res = await pool.query(convertQuery(sql), params);
        return res.rows[0];
    } catch(err) {
        console.error("DB GET Error:", err, sql, params);
        throw err;
    }
  },
  all: async (sql, params = []) => {
    try {
        const res = await pool.query(convertQuery(sql), params);
        return res.rows;
    } catch(err) {
        console.error("DB ALL Error:", err, sql, params);
        throw err;
    }
  },
  run: async (sql, params = []) => {
    try {
        const res = await pool.query(convertQuery(sql), params);
        return { lastID: null, changes: res.rowCount };
    } catch(err) {
        console.error("DB RUN Error:", err, sql, params);
        throw err;
    }
  },
  exec: async (sql) => {
    try {
        await pool.query(sql);
    } catch(err) {
        console.error("DB EXEC Error:", err, sql);
        throw err;
    }
  }
};

export const getDb = async () => {
  return dbWrapper;
};

export const initDb = async () => {
  const schemaQuery = `
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      phone_number TEXT UNIQUE NOT NULL,
      display_name TEXT NOT NULL,
      username TEXT UNIQUE NOT NULL,
      bio TEXT DEFAULT '',
      avatar TEXT DEFAULT '',
      is_admin INTEGER DEFAULT 0,
      is_suspended INTEGER DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS sessions (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      device_name TEXT NOT NULL,
      platform TEXT NOT NULL,
      ip_address TEXT DEFAULT '',
      token TEXT UNIQUE NOT NULL,
      last_active TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS otp_verifications (
      id TEXT PRIMARY KEY,
      phone_number TEXT NOT NULL,
      otp_code TEXT NOT NULL,
      expires_at TIMESTAMP NOT NULL,
      verified INTEGER DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS contacts (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      contact_id TEXT NOT NULL,
      alias TEXT DEFAULT '',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
      FOREIGN KEY (contact_id) REFERENCES users (id) ON DELETE CASCADE,
      UNIQUE(user_id, contact_id)
    );

    CREATE TABLE IF NOT EXISTS blocked_users (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      blocked_user_id TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
      FOREIGN KEY (blocked_user_id) REFERENCES users (id) ON DELETE CASCADE,
      UNIQUE(user_id, blocked_user_id)
    );

    CREATE TABLE IF NOT EXISTS chat_rooms (
      id TEXT PRIMARY KEY,
      type TEXT NOT NULL,
      name TEXT DEFAULT '',
      avatar TEXT DEFAULT '',
      description TEXT DEFAULT '',
      created_by TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS chat_members (
      id TEXT PRIMARY KEY,
      room_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      role TEXT DEFAULT 'member',
      joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      is_pinned INTEGER DEFAULT 0,
      is_muted INTEGER DEFAULT 0,
      is_hidden INTEGER DEFAULT 0,
      is_locked INTEGER DEFAULT 0,
      custom_background TEXT DEFAULT '',
      FOREIGN KEY (room_id) REFERENCES chat_rooms (id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
      UNIQUE(room_id, user_id)
    );

    CREATE TABLE IF NOT EXISTS messages (
      id TEXT PRIMARY KEY,
      room_id TEXT NOT NULL,
      sender_id TEXT NOT NULL,
      type TEXT DEFAULT 'text',
      content TEXT DEFAULT '',
      media_url TEXT DEFAULT '',
      media_meta TEXT DEFAULT '{}',
      reply_to_id TEXT DEFAULT NULL,
      is_disappearing INTEGER DEFAULT 0,
      disappearing_seconds INTEGER DEFAULT 0,
      is_view_once INTEGER DEFAULT 0,
      is_consumed INTEGER DEFAULT 0,
      is_edited INTEGER DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (room_id) REFERENCES chat_rooms (id) ON DELETE CASCADE,
      FOREIGN KEY (sender_id) REFERENCES users (id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS message_reactions (
      id TEXT PRIMARY KEY,
      message_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      emoji TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (message_id) REFERENCES messages (id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
      UNIQUE(message_id, user_id, emoji)
    );

    CREATE TABLE IF NOT EXISTS message_reads (
      id TEXT PRIMARY KEY,
      message_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      read_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (message_id) REFERENCES messages (id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
      UNIQUE(message_id, user_id)
    );

    CREATE TABLE IF NOT EXISTS hidden_chats (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      room_id TEXT NOT NULL,
      pin_hash TEXT NOT NULL,
      hidden_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
      FOREIGN KEY (room_id) REFERENCES chat_rooms (id) ON DELETE CASCADE,
      UNIQUE(user_id, room_id)
    );

    CREATE TABLE IF NOT EXISTS locked_chats (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      room_id TEXT NOT NULL,
      pin_hash TEXT NOT NULL,
      locked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
      FOREIGN KEY (room_id) REFERENCES chat_rooms (id) ON DELETE CASCADE,
      UNIQUE(user_id, room_id)
    );

    CREATE TABLE IF NOT EXISTS user_privacy_settings (
      user_id TEXT PRIMARY KEY,
      phone_privacy TEXT DEFAULT 'contacts',
      last_seen_privacy TEXT DEFAULT 'everyone',
      profile_photo_privacy TEXT DEFAULT 'everyone',
      online_status_privacy TEXT DEFAULT 'everyone',
      location_discovery_enabled INTEGER DEFAULT 1,
      who_can_message TEXT DEFAULT 'everyone',
      read_receipts_enabled INTEGER DEFAULT 1,
      FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS user_security_settings (
      user_id TEXT PRIMARY KEY,
      app_lock_pin_hash TEXT DEFAULT '',
      auto_lock_minutes INTEGER DEFAULT 0,
      notification_privacy TEXT DEFAULT 'preview',
      FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS user_locations (
      user_id TEXT PRIMARY KEY,
      latitude REAL NOT NULL,
      longitude REAL NOT NULL,
      approx_location_name TEXT DEFAULT '',
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS reports (
      id TEXT PRIMARY KEY,
      reporter_id TEXT NOT NULL,
      reported_user_id TEXT NOT NULL,
      category TEXT NOT NULL,
      description TEXT DEFAULT '',
      status TEXT DEFAULT 'pending',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (reporter_id) REFERENCES users (id) ON DELETE CASCADE,
      FOREIGN KEY (reported_user_id) REFERENCES users (id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_users_phone ON users(phone_number);
    CREATE INDEX IF NOT EXISTS idx_messages_room ON messages(room_id);
    CREATE INDEX IF NOT EXISTS idx_messages_created ON messages(created_at);
    CREATE INDEX IF NOT EXISTS idx_chat_members_user ON chat_members(user_id);
    CREATE INDEX IF NOT EXISTS idx_chat_members_room ON chat_members(room_id);
    CREATE INDEX IF NOT EXISTS idx_contacts_user ON contacts(user_id);
  `;

  try {
    await pool.query(schemaQuery);
    console.log('PostgreSQL tables created successfully!');
  } catch (error) {
    console.error('Error creating tables:', error);
  }
};

export default pool;
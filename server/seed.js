import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { getDb } from './config/database.js';

function generateId() {
  return crypto.randomUUID();
}

export async function seedDatabase() {
  const db = await getDb();

  // Check if users already exist
  const existingUsers = await db.get('SELECT COUNT(*) as count FROM users');
  if (existingUsers && existingUsers.count > 0) {
    console.log('Database already populated. Skipping seed.');
    return;
  }

  console.log('Seeding SQLite database with initial test users, chats, and messages...');

  const usersData = [
    {
      phone: '+94771234567',
      name: 'Alex Rivera',
      username: 'alex_rivera',
      bio: 'Product Designer & UI Specialist 🎨✨',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80',
      isAdmin: 1,
      lat: 6.9271, lon: 79.8612, locName: 'Colombo Central'
    },
    {
      phone: '+94779876543',
      name: 'Sophia Chen',
      username: 'sophia_chen',
      bio: 'Software Architect | Coffee Enthusiast ☕💻',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=300&q=80',
      isAdmin: 0,
      lat: 6.9319, lon: 79.8478, locName: 'Fort District'
    },
    {
      phone: '+94712223344',
      name: 'Marcus Vance',
      username: 'marcus_vance',
      bio: 'Building the next gen social apps 🚀',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=300&q=80',
      isAdmin: 0,
      lat: 6.9147, lon: 79.8778, locName: 'Cinnamon Gardens'
    },
    {
      phone: '+94755556677',
      name: 'Elena Rostova',
      username: 'elena_rostova',
      bio: 'Digital Nomad & Photographer 📸🌍',
      avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=300&q=80',
      isAdmin: 0,
      lat: 6.8920, lon: 79.8550, locName: 'Bambalapitiya'
    },
    {
      phone: '+94701112233',
      name: 'David Miller',
      username: 'david_m',
      bio: 'Cybersecurity & Privacy Advocate 🛡️',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=300&q=80',
      isAdmin: 0,
      lat: 6.8720, lon: 79.8820, locName: 'Nugegoda Area'
    }
  ];

  const createdUserIds = [];

  for (const u of usersData) {
    const userId = generateId();
    createdUserIds.push(userId);

    await db.run(
      `INSERT INTO users (id, phone_number, display_name, username, bio, avatar, is_admin)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [userId, u.phone, u.name, u.username, u.bio, u.avatar, u.isAdmin]
    );

    // Privacy & Security
    await db.run(`INSERT INTO user_privacy_settings (user_id) VALUES (?)`, [userId]);
    await db.run(`INSERT INTO user_security_settings (user_id) VALUES (?)`, [userId]);

    // Locations for discovery
    await db.run(
      `INSERT INTO user_locations (user_id, latitude, longitude, approx_location_name)
       VALUES (?, ?, ?, ?)`,
      [userId, u.lat, u.lon, u.locName]
    );
  }

  const [alexId, sophiaId, marcusId, elenaId, davidId] = createdUserIds;

  // Add Contacts
  await db.run(`INSERT INTO contacts (id, user_id, contact_id, alias) VALUES (?, ?, ?, 'Sophia')`, [generateId(), alexId, sophiaId]);
  await db.run(`INSERT INTO contacts (id, user_id, contact_id, alias) VALUES (?, ?, ?, 'Marcus')`, [generateId(), alexId, marcusId]);

  // Create Direct Chat: Alex & Sophia
  const room1 = generateId();
  await db.run(`INSERT INTO chat_rooms (id, type, created_by) VALUES (?, 'direct', ?)`, [room1, alexId]);
  await db.run(`INSERT INTO chat_members (id, room_id, user_id, is_pinned) VALUES (?, ?, ?, 1)`, [generateId(), room1, alexId]);
  await db.run(`INSERT INTO chat_members (id, room_id, user_id) VALUES (?, ?, ?)`, [generateId(), room1, sophiaId]);

  const msg1 = generateId();
  await db.run(
    `INSERT INTO messages (id, room_id, sender_id, type, content, created_at)
     VALUES (?, ?, ?, 'text', 'Hey Sophia! Have you checked out the new real-time architecture?', DATETIME('now', '-30 minutes'))`,
    [msg1, room1, alexId]
  );
  const msg2 = generateId();
  await db.run(
    `INSERT INTO messages (id, room_id, sender_id, type, content, created_at)
     VALUES (?, ?, ?, 'text', 'Yes! The Socket.IO real-time engine combined with SQLite is super fast ⚡', DATETIME('now', '-25 minutes'))`,
    [msg2, room1, sophiaId]
  );

  // Add image message
  const msg3 = generateId();
  await db.run(
    `INSERT INTO messages (id, room_id, sender_id, type, content, media_url, created_at)
     VALUES (?, ?, ?, 'image', 'Here is the UI design preview!', 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=600&q=80', DATETIME('now', '-10 minutes'))`,
    [msg3, room1, alexId]
  );

  // Create Group Chat: Tech Team Nova
  const roomGroup = generateId();
  await db.run(
    `INSERT INTO chat_rooms (id, type, name, avatar, created_by)
     VALUES (?, 'group', 'Nova Team Lounge 🚀', 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=300&q=80', ?)`,
    [roomGroup, alexId]
  );
  await db.run(`INSERT INTO chat_members (id, room_id, user_id, role) VALUES (?, ?, ?, 'admin')`, [generateId(), roomGroup, alexId]);
  await db.run(`INSERT INTO chat_members (id, room_id, user_id, role) VALUES (?, ?, ?, 'member')`, [generateId(), roomGroup, sophiaId]);
  await db.run(`INSERT INTO chat_members (id, room_id, user_id, role) VALUES (?, ?, ?, 'member')`, [generateId(), roomGroup, marcusId]);

  await db.run(
    `INSERT INTO messages (id, room_id, sender_id, type, content, created_at)
     VALUES (?, ?, ?, 'system', 'Alex created group "Nova Team Lounge 🚀"', DATETIME('now', '-2 hours'))`,
    [generateId(), roomGroup, alexId]
  );
  await db.run(
    `INSERT INTO messages (id, room_id, sender_id, type, content, created_at)
     VALUES (?, ?, ?, 'text', 'Welcome everyone! We are launching NovaChat today.', DATETIME('now', '-1 hour'))`,
    [generateId(), roomGroup, alexId]
  );

  // Create Private Secret Chat with View-Once Media
  const roomSecret = generateId();
  await db.run(`INSERT INTO chat_rooms (id, type, created_by) VALUES (?, 'private', ?)`, [roomSecret, alexId]);
  await db.run(`INSERT INTO chat_members (id, room_id, user_id, is_locked) VALUES (?, ?, ?, 1)`, [generateId(), roomSecret, alexId]);
  await db.run(`INSERT INTO chat_members (id, room_id, user_id) VALUES (?, ?, ?)`, [generateId(), roomSecret, davidId]);

  await db.run(
    `INSERT INTO messages (id, room_id, sender_id, type, content, is_view_once, media_url, created_at)
     VALUES (?, ?, ?, 'image', 'Top Secret Confidential Blueprint (View Once)', 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=600&q=80', 1, DATETIME('now', '-5 minutes'))`,
    [generateId(), roomSecret, davidId]
  );

  console.log('Seed completed successfully! 5 test users created.');
}

import jwt from 'jsonwebtoken';
import { getDb } from '../config/database.js';

// Track online users: userId -> Set of socket IDs
const onlineUsers = new Map();

export function setupSocket(io) {
  // Authentication Middleware for Socket
  io.use(async (socket, next) => {
    const token = socket.handshake.auth?.token || socket.handshake.query?.token;
    if (!token) {
      return next(new Error('Authentication token missing'));
    }

    try {
      const jwtSecret = process.env.JWT_SECRET || 'super_secret_jwt_token_key_change_in_production_2026';
      const decoded = jwt.verify(token, jwtSecret);
      
      const db = await getDb();
      const user = await db.get('SELECT id, display_name, username, avatar FROM users WHERE id = ?', [decoded.userId]);

      if (!user) {
        return next(new Error('User not found'));
      }

      socket.user = user;
      next();
    } catch (err) {
      return next(new Error('Invalid token'));
    }
  });

  io.on('connection', async (socket) => {
    const userId = socket.user.id;
    console.log(`Socket connected: ${socket.user.username} (${socket.id})`);

    // Add to online map
    if (!onlineUsers.has(userId)) {
      onlineUsers.set(userId, new Set());
    }
    onlineUsers.get(userId).add(socket.id);

    // Join user to their own personal room
    socket.join(`user:${userId}`);

    // Join all chat rooms user is a member of
    const db = await getDb();
    const rooms = await db.all('SELECT room_id FROM chat_members WHERE user_id = ?', [userId]);
    rooms.forEach(r => {
      socket.join(`room:${r.room_id}`);
    });

    // Notify online status
    io.emit('user_status', { userId, status: 'online' });

    // Handle join_room
    socket.on('join_room', (roomId) => {
      socket.join(`room:${roomId}`);
    });

    // Handle typing events
    socket.on('typing_start', ({ roomId }) => {
      socket.to(`room:${roomId}`).emit('typing_start', {
        roomId,
        userId: socket.user.id,
        username: socket.user.username,
        displayName: socket.user.display_name
      });
    });

    socket.on('typing_stop', ({ roomId }) => {
      socket.to(`room:${roomId}`).emit('typing_stop', {
        roomId,
        userId: socket.user.id
      });
    });

    // Handle new message sending
    socket.on('send_message', async (data, callback) => {
      try {
        const { roomId, content, type = 'text', mediaUrl, mediaMeta, isViewOnce, replyToId } = data;

        const db = await getDb();
        const msgId = crypto.randomUUID();

        await db.run(
          `INSERT INTO messages (
            id, room_id, sender_id, type, content, media_url, media_meta, reply_to_id, is_view_once
           ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            msgId,
            roomId,
            socket.user.id,
            type,
            content || '',
            mediaUrl || '',
            JSON.stringify(mediaMeta || {}),
            replyToId || null,
            isViewOnce ? 1 : 0
          ]
        );

        // Mark read by sender
        await db.run(
          `INSERT INTO message_reads (id, message_id, user_id) VALUES (?, ?, ?)`,
          [crypto.randomUUID(), msgId, socket.user.id]
        );

        const fullMessage = {
          id: msgId,
          room_id: roomId,
          sender_id: socket.user.id,
          sender_name: socket.user.display_name,
          sender_avatar: socket.user.avatar,
          type,
          content: content || '',
          media_url: mediaUrl || '',
          mediaMeta: mediaMeta || {},
          is_view_once: isViewOnce ? 1 : 0,
          is_consumed: 0,
          reply_to_id: replyToId || null,
          created_at: new Date().toISOString(),
          reactions: [],
          reads: [{ user_id: socket.user.id, display_name: socket.user.display_name }]
        };

        // Broadcast to all room members
        io.to(`room:${roomId}`).emit('new_message', fullMessage);

        if (typeof callback === 'function') {
          callback({ success: true, message: fullMessage });
        }
      } catch (err) {
        console.error('Socket send_message error:', err);
        if (typeof callback === 'function') {
          callback({ success: false, error: 'Failed to deliver message' });
        }
      }
    });

    // Handle message read
    socket.on('read_message', async ({ messageId, roomId }) => {
      try {
        const db = await getDb();
        await db.run(
          `INSERT INTO message_reads (id, message_id, user_id) VALUES (?, ?, ?)
           ON CONFLICT(message_id, user_id) DO NOTHING`,
          [crypto.randomUUID(), messageId, socket.user.id]
        );

        io.to(`room:${roomId}`).emit('message_read', {
          messageId,
          roomId,
          userId: socket.user.id,
          displayName: socket.user.display_name
        });
      } catch (err) {
        console.error('read_message error:', err);
      }
    });

    // Handle message reaction
    socket.on('add_reaction', async ({ messageId, roomId, emoji }) => {
      try {
        const db = await getDb();
        await db.run(
          `INSERT INTO message_reactions (id, message_id, user_id, emoji) VALUES (?, ?, ?, ?)
           ON CONFLICT(message_id, user_id, emoji) DO NOTHING`,
          [crypto.randomUUID(), messageId, socket.user.id, emoji]
        );

        io.to(`room:${roomId}`).emit('reaction_added', {
          messageId,
          roomId,
          userId: socket.user.id,
          emoji
        });
      } catch (err) {
        console.error('add_reaction error:', err);
      }
    });

    // Disconnect
    socket.on('disconnect', () => {
      console.log(`Socket disconnected: ${socket.user.username}`);
      const userSockets = onlineUsers.get(userId);
      if (userSockets) {
        userSockets.delete(socket.id);
        if (userSockets.size === 0) {
          onlineUsers.delete(userId);
          io.emit('user_status', { userId, status: 'offline', lastSeen: new Date().toISOString() });
        }
      }
    });
  });
}

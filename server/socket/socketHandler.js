import jwt from 'jsonwebtoken';
import { User, ChatMember, Message } from '../models/index.js';

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

      const user = await User.findById(decoded.userId).lean();
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
    const userId = String(socket.user._id);
    console.log(`Socket connected: ${socket.user.username} (${socket.id})`);

    // Add to online map
    if (!onlineUsers.has(userId)) {
      onlineUsers.set(userId, new Set());
    }
    onlineUsers.get(userId).add(socket.id);

    // Join user to their own personal room
    socket.join(`user:${userId}`);

    // Join all chat rooms user is a member of
    const memberships = await ChatMember.find({ userId }).lean();
    memberships.forEach(m => {
      socket.join(`room:${m.roomId}`);
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
        userId: socket.user._id,
        username: socket.user.username,
        displayName: socket.user.displayName,
      });
    });

    socket.on('typing_stop', ({ roomId }) => {
      socket.to(`room:${roomId}`).emit('typing_stop', {
        roomId,
        userId: socket.user._id,
      });
    });

    // Handle new message
    socket.on('send_message', async (data, callback) => {
      try {
        const { roomId, content, type = 'text', mediaUrl, mediaMeta, isViewOnce, replyToId } = data;

        const msg = await Message.create({
          roomId,
          senderId: socket.user._id,
          type,
          content: content || '',
          mediaUrl: mediaUrl || '',
          mediaMeta: mediaMeta || {},
          replyToId: replyToId || null,
          isViewOnce: Boolean(isViewOnce),
          reads: [userId],
        });

        const fullMessage = {
          ...msg.toObject(),
          sender_name: socket.user.displayName,
          sender_avatar: socket.user.avatar,
          room_id: roomId,
          sender_id: socket.user._id,
        };

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
        await Message.findByIdAndUpdate(messageId, {
          $addToSet: { reads: userId },
        });

        io.to(`room:${roomId}`).emit('message_read', {
          messageId,
          roomId,
          userId: socket.user._id,
          displayName: socket.user.displayName,
        });
      } catch (err) {
        console.error('read_message error:', err);
      }
    });

    // Handle message reaction
    socket.on('add_reaction', async ({ messageId, roomId, emoji }) => {
      try {
        await Message.findByIdAndUpdate(messageId, {
          $addToSet: { reactions: { userId, emoji } },
        });

        io.to(`room:${roomId}`).emit('reaction_added', {
          messageId,
          roomId,
          userId: socket.user._id,
          emoji,
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

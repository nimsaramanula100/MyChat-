import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { getDb } from '../config/database.js';

function generateId() {
  return crypto.randomUUID();
}

export async function getChats(req, res) {
  try {
    const db = await getDb();
    const userId = req.user.id;

    // Fetch rooms where user is a member
    const rooms = await db.all(
      `SELECT r.id AS room_id, r.type, r.name AS group_name, r.avatar AS group_avatar, r.created_by,
              m.is_pinned, m.is_muted, m.is_hidden, m.is_locked, m.custom_background
       FROM chat_rooms r
       JOIN chat_members m ON r.id = m.room_id
       WHERE m.user_id = ?`,
      [userId]
    );

    const result = [];

    for (const room of rooms) {
      // Find other member if direct or private chat
      let partner = null;
      if (room.type === 'direct' || room.type === 'private' || room.type === 'secret') {
        const otherMember = await db.get(
          `SELECT u.id, u.display_name, u.username, u.avatar, u.bio, u.phone_number
           FROM chat_members cm
           JOIN users u ON cm.user_id = u.id
           WHERE cm.room_id = ? AND cm.user_id != ?`,
          [room.room_id, userId]
        );
        partner = otherMember || null;
      }

      // Fetch last message
      const lastMsg = await db.get(
        `SELECT msg.*, u.display_name AS sender_name
         FROM messages msg
         JOIN users u ON msg.sender_id = u.id
         WHERE msg.room_id = ?
         ORDER BY msg.created_at DESC LIMIT 1`,
        [room.room_id]
      );

      // Member count for groups
      let memberCount = 0;
      if (room.type === 'group') {
        const countRow = await db.get('SELECT COUNT(*) as count FROM chat_members WHERE room_id = ?', [room.room_id]);
        memberCount = countRow ? countRow.count : 0;
      }

      // Unread count
      const unreadCountRow = await db.get(
        `SELECT COUNT(*) AS count
         FROM messages msg
         WHERE msg.room_id = ? AND msg.sender_id != ?
           AND msg.id NOT IN (SELECT message_id FROM message_reads WHERE user_id = ?)`,
        [room.room_id, userId, userId]
      );

      result.push({
        id: room.room_id,
        type: room.type,
        name: room.type === 'group' ? room.group_name : (partner ? partner.display_name : 'Chat'),
        avatar: room.type === 'group' ? (room.group_avatar || `https://api.dicebear.com/7.x/identicon/svg?seed=${room.group_name || 'Group'}`) : (partner ? partner.avatar : ''),
        memberCount: memberCount,
        partner: partner ? {
          id: partner.id,
          displayName: partner.display_name,
          username: partner.username,
          avatar: partner.avatar,
          bio: partner.bio
        } : null,
        isPinned: Boolean(room.is_pinned),
        isMuted: Boolean(room.is_muted),
        isHidden: Boolean(room.is_hidden),
        isLocked: Boolean(room.is_locked),
        customBackground: room.custom_background || '',
        unreadCount: unreadCountRow ? unreadCountRow.count : 0,
        lastMessage: lastMsg ? {
          id: lastMsg.id,
          content: lastMsg.is_view_once && lastMsg.is_consumed ? '[Expired View Once Media]' : lastMsg.content,
          type: lastMsg.type,
          senderName: lastMsg.sender_name,
          createdAt: lastMsg.created_at
        } : null
      });
    }

    // Sort: pinned first, then by last message timestamp
    result.sort((a, b) => {
      if (a.isPinned !== b.isPinned) return a.isPinned ? -1 : 1;
      const timeA = a.lastMessage ? new Date(a.lastMessage.createdAt).getTime() : 0;
      const timeB = b.lastMessage ? new Date(b.lastMessage.createdAt).getTime() : 0;
      return timeB - timeA;
    });

    return res.json({ chats: result });
  } catch (err) {
    console.error('getChats error:', err);
    return res.status(500).json({ error: 'Failed to fetch chats' });
  }
}

export async function createChat(req, res) {
  try {
    const { targetUserId, type, name, avatar, members } = req.body;
    const db = await getDb();
    const currentUserId = req.user.id;

    if (type === 'group') {
      const roomId = generateId();
      const groupName = name ? name.trim() : 'New Group';
      const groupAvatar = avatar || `https://api.dicebear.com/7.x/identicon/svg?seed=${encodeURIComponent(groupName)}`;

      await db.run(
        `INSERT INTO chat_rooms (id, type, name, avatar, created_by) VALUES (?, 'group', ?, ?, ?)`,
        [roomId, groupName, groupAvatar, currentUserId]
      );

      // Add creator as admin
      await db.run(
        `INSERT INTO chat_members (id, room_id, user_id, role) VALUES (?, ?, ?, 'admin')`,
        [generateId(), roomId, currentUserId]
      );

      // Add other selected members
      if (Array.isArray(members)) {
        for (const mId of members) {
          if (mId !== currentUserId) {
            await db.run(
              `INSERT INTO chat_members (id, room_id, user_id, role) VALUES (?, ?, ?, 'member')`,
              [generateId(), roomId, mId]
            );
          }
        }
      }

      // Add initial system creation message
      const creatorUser = await db.get('SELECT display_name FROM users WHERE id = ?', [currentUserId]);
      const creatorName = creatorUser ? creatorUser.display_name : 'Someone';

      await db.run(
        `INSERT INTO messages (id, room_id, sender_id, type, content) VALUES (?, ?, ?, 'system', ?)`,
        [generateId(), roomId, currentUserId, `${creatorName} created group "${groupName}"`]
      );

      return res.json({ success: true, roomId });
    } else {
      // Direct or Private chat
      if (!targetUserId) {
        return res.status(400).json({ error: 'Target user ID is required' });
      }

      const existingRoom = await db.get(
        `SELECT r.id FROM chat_rooms r
         JOIN chat_members m1 ON r.id = m1.room_id AND m1.user_id = ?
         JOIN chat_members m2 ON r.id = m2.room_id AND m2.user_id = ?
         WHERE r.type = ?`,
        [currentUserId, targetUserId, type || 'direct']
      );

      if (existingRoom) {
        return res.json({ success: true, roomId: existingRoom.id });
      }

      const roomId = generateId();
      await db.run(
        `INSERT INTO chat_rooms (id, type, created_by) VALUES (?, ?, ?)`,
        [roomId, type || 'direct', currentUserId]
      );

      await db.run(
        `INSERT INTO chat_members (id, room_id, user_id) VALUES (?, ?, ?)`,
        [generateId(), roomId, currentUserId]
      );
      await db.run(
        `INSERT INTO chat_members (id, room_id, user_id) VALUES (?, ?, ?)`,
        [generateId(), roomId, targetUserId]
      );

      return res.json({ success: true, roomId });
    }
  } catch (err) {
    console.error('createChat error:', err);
    return res.status(500).json({ error: 'Failed to create chat' });
  }
}

export async function getGroupInfo(req, res) {
  try {
    const { roomId } = req.params;
    const db = await getDb();

    const room = await db.get('SELECT * FROM chat_rooms WHERE id = ? AND type = "group"', [roomId]);
    if (!room) {
      return res.status(404).json({ error: 'Group not found' });
    }

    const members = await db.all(
      `SELECT m.role, m.joined_at, u.id, u.display_name, u.username, u.avatar, u.phone_number
       FROM chat_members m
       JOIN users u ON m.user_id = u.id
       WHERE m.room_id = ?`,
      [roomId]
    );

    const currentUserMember = members.find(m => m.id === req.user.id);
    if (!currentUserMember) {
      return res.status(403).json({ error: 'You are not a member of this group' });
    }

    return res.json({
      group: {
        id: room.id,
        name: room.name,
        avatar: room.avatar || `https://api.dicebear.com/7.x/identicon/svg?seed=${encodeURIComponent(room.name)}`,
        createdBy: room.created_by,
        createdAt: room.created_at,
        isAdmin: currentUserMember.role === 'admin',
        members: members.map(m => ({
          id: m.id,
          displayName: m.display_name,
          username: m.username,
          avatar: m.avatar,
          phoneNumber: m.phone_number,
          role: m.role,
          joinedAt: m.joined_at
        }))
      }
    });
  } catch (err) {
    console.error('getGroupInfo error:', err);
    return res.status(500).json({ error: 'Failed to fetch group details' });
  }
}

export async function updateGroupInfo(req, res) {
  try {
    const { roomId } = req.params;
    const { name, avatar } = req.body;
    const db = await getDb();

    const member = await db.get('SELECT role FROM chat_members WHERE room_id = ? AND user_id = ?', [roomId, req.user.id]);
    if (!member || member.role !== 'admin') {
      return res.status(403).json({ error: 'Admin permission required to edit group info' });
    }

    await db.run(
      'UPDATE chat_rooms SET name = COALESCE(?, name), avatar = COALESCE(?, avatar) WHERE id = ?',
      [name ? name.trim() : null, avatar ? avatar.trim() : null, roomId]
    );

    return res.json({ success: true, message: 'Group details updated' });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to update group info' });
  }
}

export async function addGroupMembers(req, res) {
  try {
    const { roomId } = req.params;
    const { members } = req.body;
    const db = await getDb();

    const member = await db.get('SELECT role FROM chat_members WHERE room_id = ? AND user_id = ?', [roomId, req.user.id]);
    if (!member || member.role !== 'admin') {
      return res.status(403).json({ error: 'Admin permission required to add members' });
    }

    if (Array.isArray(members)) {
      for (const mId of members) {
        const existing = await db.get('SELECT id FROM chat_members WHERE room_id = ? AND user_id = ?', [roomId, mId]);
        if (!existing) {
          await db.run(
            'INSERT INTO chat_members (id, room_id, user_id, role) VALUES (?, ?, ?, "member")',
            [generateId(), roomId, mId]
          );
        }
      }
    }

    return res.json({ success: true, message: 'Members added' });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to add members' });
  }
}

export async function removeGroupMember(req, res) {
  try {
    const { roomId, targetUserId } = req.params;
    const db = await getDb();

    const currentMember = await db.get('SELECT role FROM chat_members WHERE room_id = ? AND user_id = ?', [roomId, req.user.id]);
    if (!currentMember || (currentMember.role !== 'admin' && req.user.id !== targetUserId)) {
      return res.status(403).json({ error: 'Admin permission required to remove member' });
    }

    await db.run('DELETE FROM chat_members WHERE room_id = ? AND user_id = ?', [roomId, targetUserId]);
    return res.json({ success: true, message: 'Member removed' });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to remove member' });
  }
}

export async function leaveGroup(req, res) {
  try {
    const { roomId } = req.params;
    const db = await getDb();

    await db.run('DELETE FROM chat_members WHERE room_id = ? AND user_id = ?', [roomId, req.user.id]);
    return res.json({ success: true, message: 'Left group successfully' });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to leave group' });
  }
}

export async function getMessages(req, res) {
  try {
    const { roomId } = req.params;
    const { limit = 50, before } = req.query;
    const db = await getDb();

    const isMember = await db.get('SELECT id FROM chat_members WHERE room_id = ? AND user_id = ?', [roomId, req.user.id]);
    if (!isMember) {
      return res.status(403).json({ error: 'You are not a member of this chat' });
    }

    let query = `
      SELECT m.*, u.display_name AS sender_name, u.avatar AS sender_avatar
      FROM messages m
      JOIN users u ON m.sender_id = u.id
      WHERE m.room_id = ?
    `;
    const params = [roomId];

    if (before) {
      query += ` AND m.created_at < ?`;
      params.push(before);
    }

    query += ` ORDER BY m.created_at ASC LIMIT ?`;
    params.push(parseInt(limit));

    const messages = await db.all(query, params);

    for (const msg of messages) {
      msg.mediaMeta = msg.media_meta ? JSON.parse(msg.media_meta) : {};
      
      if (msg.is_view_once && msg.is_consumed) {
        msg.content = 'Viewed Media (Expired)';
        msg.media_url = '';
      }

      const reactions = await db.all(
        `SELECT emoji, COUNT(*) as count FROM message_reactions WHERE message_id = ? GROUP BY emoji`,
        [msg.id]
      );
      msg.reactions = reactions;

      const reads = await db.all(
        `SELECT r.user_id, u.display_name FROM message_reads r JOIN users u ON r.user_id = u.id WHERE r.message_id = ?`,
        [msg.id]
      );
      msg.reads = reads;
    }

    return res.json({ messages });
  } catch (err) {
    console.error('getMessages error:', err);
    return res.status(500).json({ error: 'Failed to fetch messages' });
  }
}

export async function sendMessage(req, res) {
  try {
    const { roomId, content, type = 'text', mediaUrl, mediaMeta, replyToId, isViewOnce, disappearingSeconds } = req.body;
    const db = await getDb();

    const isMember = await db.get('SELECT id FROM chat_members WHERE room_id = ? AND user_id = ?', [roomId, req.user.id]);
    if (!isMember) {
      return res.status(403).json({ error: 'Not authorized for this room' });
    }

    const msgId = generateId();
    await db.run(
      `INSERT INTO messages (
        id, room_id, sender_id, type, content, media_url, media_meta,
        reply_to_id, is_disappearing, disappearing_seconds, is_view_once
       ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        msgId,
        roomId,
        req.user.id,
        type,
        content || '',
        mediaUrl || '',
        JSON.stringify(mediaMeta || {}),
        replyToId || null,
        disappearingSeconds ? 1 : 0,
        disappearingSeconds || 0,
        isViewOnce ? 1 : 0
      ]
    );

    await db.run(
      `INSERT INTO message_reads (id, message_id, user_id) VALUES (?, ?, ?)`,
      [generateId(), msgId, req.user.id]
    );

    const message = await db.get(
      `SELECT m.*, u.display_name AS sender_name, u.avatar AS sender_avatar
       FROM messages m JOIN users u ON m.sender_id = u.id WHERE m.id = ?`,
      [msgId]
    );
    const { tempId } = req.body;
    message.mediaMeta = JSON.parse(message.media_meta || '{}');
    if (tempId) message.tempId = tempId;

    // Broadcast to room via Socket.IO
    const io = req.app.get('io');
    if (io) {
      io.to(`room:${roomId}`).emit('new_message', message);
    }

    return res.json({ success: true, message });
  } catch (err) {
    console.error('sendMessage error:', err);
    return res.status(500).json({ error: 'Failed to send message' });
  }
}

export async function consumeViewOnce(req, res) {
  try {
    const { messageId } = req.params;
    const db = await getDb();

    const msg = await db.get('SELECT * FROM messages WHERE id = ?', [messageId]);
    if (!msg || !msg.is_view_once) {
      return res.status(400).json({ error: 'Not a view-once message' });
    }

    await db.run('UPDATE messages SET is_consumed = 1, media_url = "", content = "Viewed Media (Expired)" WHERE id = ?', [messageId]);
    return res.json({ success: true, message: 'View-once media consumed' });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to consume view-once media' });
  }
}

export async function hideChat(req, res) {
  try {
    const { roomId, pin } = req.body;
    if (!pin || pin.length < 4) {
      return res.status(400).json({ error: 'PIN (at least 4 digits) is required' });
    }

    const db = await getDb();
    const pinHash = await bcrypt.hash(pin, 10);

    await db.run('UPDATE chat_members SET is_hidden = 1 WHERE room_id = ? AND user_id = ?', [roomId, req.user.id]);
    await db.run(
      `INSERT INTO hidden_chats (id, user_id, room_id, pin_hash) VALUES (?, ?, ?, ?)
       ON CONFLICT(user_id, room_id) DO UPDATE SET pin_hash = excluded.pin_hash`,
      [generateId(), req.user.id, roomId, pinHash]
    );

    return res.json({ success: true, message: 'Chat moved to Hidden Chats' });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to hide chat' });
  }
}

export async function unlockHiddenChats(req, res) {
  try {
    const { pin } = req.body;
    if (!pin) {
      return res.status(400).json({ error: 'PIN required' });
    }

    const db = await getDb();
    const hiddenRecords = await db.all('SELECT pin_hash FROM hidden_chats WHERE user_id = ?', [req.user.id]);
    
    let valid = false;
    for (const rec of hiddenRecords) {
      if (await bcrypt.compare(pin, rec.pin_hash)) {
        valid = true;
        break;
      }
    }

    if (!valid && hiddenRecords.length > 0) {
      return res.status(401).json({ error: 'Incorrect PIN' });
    }

    return res.json({ success: true, unlocked: true });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to unlock hidden chats' });
  }
}

export async function togglePinChat(req, res) {
  try {
    const { roomId } = req.params;
    const db = await getDb();
    const member = await db.get('SELECT is_pinned FROM chat_members WHERE room_id = ? AND user_id = ?', [roomId, req.user.id]);
    if (!member) return res.status(404).json({ error: 'Chat member record not found' });

    const newPinned = member.is_pinned ? 0 : 1;
    await db.run('UPDATE chat_members SET is_pinned = ? WHERE room_id = ? AND user_id = ?', [newPinned, roomId, req.user.id]);
    return res.json({ success: true, isPinned: Boolean(newPinned) });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to toggle pin state' });
  }
}

export async function setChatBackground(req, res) {
  try {
    const { roomId } = req.params;
    const { background } = req.body;
    const db = await getDb();

    await db.run('UPDATE chat_members SET custom_background = ? WHERE room_id = ? AND user_id = ?', [background || '', roomId, req.user.id]);
    return res.json({ success: true, background });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to set chat background' });
  }
}

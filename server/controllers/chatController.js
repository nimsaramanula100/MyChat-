import bcrypt from 'bcryptjs';
import { ChatRoom, ChatMember, Message, HiddenChat, User } from '../models/index.js';

export async function getChats(req, res) {
  try {
    const userId = req.user._id;

    const memberships = await ChatMember.find({ userId }).lean();
    const roomIds = memberships.map(m => m.roomId);
    const rooms = await ChatRoom.find({ _id: { $in: roomIds } }).lean();
    const memberMap = Object.fromEntries(memberships.map(m => [m.roomId, m]));

    const result = [];

    for (const room of rooms) {
      const membership = memberMap[room._id];

      let partner = null;
      if (room.type === 'direct' || room.type === 'private' || room.type === 'secret') {
        const otherMembership = await ChatMember.findOne({ roomId: room._id, userId: { $ne: userId } }).lean();
        if (otherMembership) {
          partner = await User.findById(otherMembership.userId).lean();
        }
      }

      const lastMsg = await Message.findOne({ roomId: room._id }).sort({ createdAt: -1 }).lean();
      let senderName = '';
      if (lastMsg) {
        const sender = await User.findById(lastMsg.senderId).lean();
        senderName = sender?.displayName || '';
      }

      let memberCount = 0;
      if (room.type === 'group') {
        memberCount = await ChatMember.countDocuments({ roomId: room._id });
      }

      const allMsgs = await Message.find({ roomId: room._id, senderId: { $ne: userId } }).lean();
      const unreadCount = allMsgs.filter(m => !m.reads.includes(String(userId))).length;

      result.push({
        id: room._id,
        type: room.type,
        name: room.type === 'group' ? room.name : (partner ? partner.displayName : 'Chat'),
        avatar: room.type === 'group'
          ? (room.avatar || `https://api.dicebear.com/7.x/identicon/svg?seed=${room.name || 'Group'}`)
          : (partner ? partner.avatar : ''),
        memberCount,
        partner: partner ? {
          id: partner._id,
          displayName: partner.displayName,
          username: partner.username,
          avatar: partner.avatar,
          bio: partner.bio,
        } : null,
        isPinned: Boolean(membership?.isPinned),
        isMuted: Boolean(membership?.isMuted),
        isHidden: Boolean(membership?.isHidden),
        isLocked: Boolean(membership?.isLocked),
        customBackground: membership?.customBackground || '',
        unreadCount,
        lastMessage: lastMsg ? {
          id: lastMsg._id,
          content: lastMsg.isViewOnce && lastMsg.isConsumed ? '[Expired View Once Media]' : lastMsg.content,
          type: lastMsg.type,
          senderName,
          createdAt: lastMsg.createdAt,
        } : null,
      });
    }

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
    const currentUserId = req.user._id;

    if (type === 'group') {
      const groupName = name ? name.trim() : 'New Group';
      const groupAvatar = avatar || `https://api.dicebear.com/7.x/identicon/svg?seed=${encodeURIComponent(groupName)}`;

      const room = await ChatRoom.create({ type: 'group', name: groupName, avatar: groupAvatar, createdBy: currentUserId });
      await ChatMember.create({ roomId: room._id, userId: currentUserId, role: 'admin' });

      if (Array.isArray(members)) {
        for (const mId of members) {
          if (String(mId) !== String(currentUserId)) {
            await ChatMember.create({ roomId: room._id, userId: mId, role: 'member' });
          }
        }
      }

      const creator = await User.findById(currentUserId).lean();
      await Message.create({
        roomId: room._id,
        senderId: currentUserId,
        type: 'system',
        content: `${creator?.displayName || 'Someone'} created group "${groupName}"`,
      });

      return res.json({ success: true, roomId: room._id });
    } else {
      if (!targetUserId) {
        return res.status(400).json({ error: 'Target user ID is required' });
      }

      const chatType = type || 'direct';
      const myRooms = await ChatMember.find({ userId: currentUserId }).lean();
      const myRoomIds = myRooms.map(m => m.roomId);
      const theirRooms = await ChatMember.find({ userId: targetUserId, roomId: { $in: myRoomIds } }).lean();
      const theirRoomIds = theirRooms.map(m => m.roomId);

      if (theirRoomIds.length > 0) {
        const existingRoom = await ChatRoom.findOne({ _id: { $in: theirRoomIds }, type: chatType }).lean();
        if (existingRoom) {
          return res.json({ success: true, roomId: existingRoom._id, room: existingRoom });
        }
      }

      const room = await ChatRoom.create({ type: chatType, createdBy: currentUserId });
      await ChatMember.create({ roomId: room._id, userId: currentUserId });
      await ChatMember.create({ roomId: room._id, userId: targetUserId });

      return res.json({ success: true, roomId: room._id, room });
    }
  } catch (err) {
    console.error('createChat error:', err);
    return res.status(500).json({ error: 'Failed to create chat' });
  }
}

export async function getGroupInfo(req, res) {
  try {
    const { roomId } = req.params;
    const room = await ChatRoom.findOne({ _id: roomId, type: 'group' }).lean();
    if (!room) return res.status(404).json({ error: 'Group not found' });

    const memberships = await ChatMember.find({ roomId }).lean();
    const userIds = memberships.map(m => m.userId);
    const users = await User.find({ _id: { $in: userIds } }).lean();
    const userMap = Object.fromEntries(users.map(u => [String(u._id), u]));

    const currentMembership = memberships.find(m => String(m.userId) === String(req.user._id));
    if (!currentMembership) return res.status(403).json({ error: 'You are not a member of this group' });

    return res.json({
      group: {
        id: room._id,
        name: room.name,
        avatar: room.avatar || `https://api.dicebear.com/7.x/identicon/svg?seed=${encodeURIComponent(room.name)}`,
        createdBy: room.createdBy,
        createdAt: room.createdAt,
        isAdmin: currentMembership.role === 'admin',
        members: memberships.map(m => {
          const u = userMap[String(m.userId)];
          return {
            id: u?._id,
            displayName: u?.displayName,
            username: u?.username,
            avatar: u?.avatar,
            phoneNumber: u?.phoneNumber,
            role: m.role,
            joinedAt: m.joinedAt,
          };
        }),
      },
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

    const member = await ChatMember.findOne({ roomId, userId: req.user._id }).lean();
    if (!member || member.role !== 'admin') {
      return res.status(403).json({ error: 'Admin permission required to edit group info' });
    }

    const updates = {};
    if (name) updates.name = name.trim();
    if (avatar) updates.avatar = avatar.trim();
    await ChatRoom.findByIdAndUpdate(roomId, updates);
    return res.json({ success: true, message: 'Group details updated' });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to update group info' });
  }
}

export async function addGroupMembers(req, res) {
  try {
    const { roomId } = req.params;
    const { members } = req.body;

    const member = await ChatMember.findOne({ roomId, userId: req.user._id }).lean();
    if (!member || member.role !== 'admin') {
      return res.status(403).json({ error: 'Admin permission required to add members' });
    }

    if (Array.isArray(members)) {
      for (const mId of members) {
        await ChatMember.findOneAndUpdate(
          { roomId, userId: mId },
          { roomId, userId: mId, role: 'member' },
          { upsert: true }
        );
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
    const currentMember = await ChatMember.findOne({ roomId, userId: req.user._id }).lean();
    if (!currentMember || (currentMember.role !== 'admin' && String(req.user._id) !== String(targetUserId))) {
      return res.status(403).json({ error: 'Admin permission required to remove member' });
    }
    await ChatMember.deleteOne({ roomId, userId: targetUserId });
    return res.json({ success: true, message: 'Member removed' });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to remove member' });
  }
}

export async function leaveGroup(req, res) {
  try {
    const { roomId } = req.params;
    await ChatMember.deleteOne({ roomId, userId: req.user._id });
    return res.json({ success: true, message: 'Left group successfully' });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to leave group' });
  }
}

export async function getMessages(req, res) {
  try {
    const { roomId } = req.params;
    const { limit = 50, before } = req.query;

    const isMember = await ChatMember.findOne({ roomId, userId: req.user._id }).lean();
    if (!isMember) return res.status(403).json({ error: 'You are not a member of this chat' });

    const query = { roomId };
    if (before) query.createdAt = { $lt: new Date(before) };

    const messages = await Message.find(query).sort({ createdAt: 1 }).limit(parseInt(limit)).lean();

    const senderIds = [...new Set(messages.map(m => String(m.senderId)))];
    const senders = await User.find({ _id: { $in: senderIds } }).lean();
    const senderMap = Object.fromEntries(senders.map(u => [String(u._id), u]));

    const enriched = messages.map(msg => {
      const sender = senderMap[String(msg.senderId)];
      if (msg.isViewOnce && msg.isConsumed) {
        msg.content = 'Viewed Media (Expired)';
        msg.mediaUrl = '';
      }
      return {
        ...msg,
        sender_name: sender?.displayName || '',
        sender_avatar: sender?.avatar || '',
        mediaMeta: msg.mediaMeta || {},
      };
    });

    return res.json({ messages: enriched });
  } catch (err) {
    console.error('getMessages error:', err);
    return res.status(500).json({ error: 'Failed to fetch messages' });
  }
}

export async function sendMessage(req, res) {
  try {
    const { roomId, content, type = 'text', mediaUrl, mediaMeta, replyToId, isViewOnce, disappearingSeconds } = req.body;

    const isMember = await ChatMember.findOne({ roomId, userId: req.user._id }).lean();
    if (!isMember) return res.status(403).json({ error: 'Not authorized for this room' });

    const msg = await Message.create({
      roomId,
      senderId: req.user._id,
      type,
      content: content || '',
      mediaUrl: mediaUrl || '',
      mediaMeta: mediaMeta || {},
      replyToId: replyToId || null,
      isDisappearing: Boolean(disappearingSeconds),
      disappearingSeconds: disappearingSeconds || 0,
      isViewOnce: Boolean(isViewOnce),
      reads: [String(req.user._id)],
    });

    const sender = req.user;
    const fullMessage = {
      ...msg.toObject(),
      sender_name: sender.displayName,
      sender_avatar: sender.avatar,
    };

    const { tempId } = req.body;
    if (tempId) fullMessage.tempId = tempId;

    const io = req.app.get('io');
    if (io) {
      io.to(`room:${roomId}`).emit('new_message', fullMessage);
    }

    return res.json({ success: true, message: fullMessage });
  } catch (err) {
    console.error('sendMessage error:', err);
    return res.status(500).json({ error: 'Failed to send message' });
  }
}

export async function consumeViewOnce(req, res) {
  try {
    const { messageId } = req.params;
    const msg = await Message.findById(messageId).lean();
    if (!msg || !msg.isViewOnce) {
      return res.status(400).json({ error: 'Not a view-once message' });
    }
    await Message.findByIdAndUpdate(messageId, { isConsumed: true, mediaUrl: '', content: 'Viewed Media (Expired)' });
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
    const pinHash = await bcrypt.hash(pin, 10);
    await ChatMember.findOneAndUpdate({ roomId, userId: req.user._id }, { isHidden: true });
    await HiddenChat.findOneAndUpdate(
      { userId: req.user._id, roomId },
      { pinHash },
      { upsert: true }
    );
    return res.json({ success: true, message: 'Chat moved to Hidden Chats' });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to hide chat' });
  }
}

export async function unlockHiddenChats(req, res) {
  try {
    const { pin } = req.body;
    if (!pin) return res.status(400).json({ error: 'PIN required' });

    const hiddenRecords = await HiddenChat.find({ userId: req.user._id }).lean();
    let valid = false;
    for (const rec of hiddenRecords) {
      if (await bcrypt.compare(pin, rec.pinHash)) {
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
    const member = await ChatMember.findOne({ roomId, userId: req.user._id }).lean();
    if (!member) return res.status(404).json({ error: 'Chat member record not found' });

    const newPinned = !member.isPinned;
    await ChatMember.findOneAndUpdate({ roomId, userId: req.user._id }, { isPinned: newPinned });
    return res.json({ success: true, isPinned: newPinned });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to toggle pin state' });
  }
}

export async function setChatBackground(req, res) {
  try {
    const { roomId } = req.params;
    const { background } = req.body;
    await ChatMember.findOneAndUpdate({ roomId, userId: req.user._id }, { customBackground: background || '' });
    return res.json({ success: true, background });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to set chat background' });
  }
}

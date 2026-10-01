import { defineStore } from 'pinia';
import { api } from '../services/api.js';
import { onSocketEvent, emitSocketEvent } from '../services/socket.js';

export const useChatStore = defineStore('chat', {
  state: () => ({
    chats: [],
    activeChatId: null,
    messages: {}, // roomId -> array of messages
    typingUsers: {}, // roomId -> Set of user displayNames
    onlineUsers: new Set(),
    isLoadingChats: false,
    isLoadingMessages: false,
    currentWallpaper: 'default', // default, dark, gradient, custom URL
    isSocketInitialized: false
  }),

  getters: {
    activeChat: (state) => state.chats.find(c => c.id === state.activeChatId) || null,
    activeMessages: (state) => state.messages[state.activeChatId] || [],
    visibleChats: (state) => state.chats,
    pinnedChats: (state) => state.chats.filter(c => c.isPinned),
    unreadTotal: (state) => state.chats.reduce((acc, c) => acc + (c.unreadCount || 0), 0)
  },

  actions: {
    initSocketListeners() {
      if (this.isSocketInitialized) return;
      this.isSocketInitialized = true;

      // Listen for incoming new messages
      onSocketEvent('new_message', (msg) => {
        const roomId = msg.room_id || msg.roomId;
        if (!roomId) return;

        if (!this.messages[roomId]) {
          this.messages[roomId] = [];
        }

        const roomMsgs = this.messages[roomId];

        // Deduplication check by id or tempId
        const existingIndex = roomMsgs.findIndex(m => 
          m.id === msg.id || 
          (msg.tempId && m.tempId === msg.tempId) ||
          (m.id && m.id === msg.id)
        );

        if (existingIndex !== -1) {
          // Update existing message bubble in-place (e.g. optimistic -> confirmed)
          roomMsgs[existingIndex] = { ...roomMsgs[existingIndex], ...msg };
        } else {
          // Append single new message bubble
          roomMsgs.push(msg);
        }

        // Update chat's last message preview & unread count
        const chat = this.chats.find(c => c.id === roomId);
        if (chat) {
          chat.lastMessage = {
            id: msg.id,
            content: msg.is_view_once ? '[View Once Media]' : msg.content,
            type: msg.type,
            senderName: msg.sender_name || msg.senderName,
            createdAt: msg.created_at || msg.createdAt
          };

          if (this.activeChatId !== roomId) {
            chat.unreadCount = (chat.unreadCount || 0) + 1;
          }
        }
      });

      // Typing indicators
      onSocketEvent('typing_start', ({ roomId, displayName }) => {
        if (!this.typingUsers[roomId]) {
          this.typingUsers[roomId] = new Set();
        }
        this.typingUsers[roomId].add(displayName);
      });

      onSocketEvent('typing_stop', ({ roomId, displayName }) => {
        if (this.typingUsers[roomId]) {
          this.typingUsers[roomId].delete(displayName);
        }
      });

      // User status changes
      onSocketEvent('user_status', ({ userId, status }) => {
        if (status === 'online') {
          this.onlineUsers.add(userId);
        } else {
          this.onlineUsers.delete(userId);
        }
      });
    },

    async fetchChats() {
      this.isLoadingChats = true;
      try {
        const res = await api.getChats();
        this.chats = res.chats;
        this.initSocketListeners();
        return res.chats;
      } finally {
        this.isLoadingChats = false;
      }
    },

    async selectChat(roomId) {
      this.activeChatId = roomId;
      const chat = this.chats.find(c => c.id === roomId);
      if (chat) {
        chat.unreadCount = 0;
      }
      await this.fetchMessages(roomId);
    },

    async fetchMessages(roomId) {
      this.isLoadingMessages = true;
      try {
        const res = await api.getMessages(roomId);
        this.messages[roomId] = res.messages;
        return res.messages;
      } finally {
        this.isLoadingMessages = false;
      }
    },

    async sendMessage({ content, type = 'text', mediaUrl, mediaMeta, isViewOnce, replyToId }) {
      if (!this.activeChatId) return;

      const roomId = this.activeChatId;
      const tempId = `temp_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

      const optimisticMsg = {
        id: tempId,
        tempId: tempId,
        room_id: roomId,
        sender_id: localStorage.getItem('mychat_user_id') || '',
        sender_name: 'Me',
        type,
        content: content || '',
        media_url: mediaUrl || '',
        mediaMeta: mediaMeta || {},
        is_view_once: isViewOnce ? 1 : 0,
        is_consumed: 0,
        reply_to_id: replyToId || null,
        created_at: new Date().toISOString(),
        reactions: [],
        reads: []
      };

      if (!this.messages[roomId]) {
        this.messages[roomId] = [];
      }

      // Add single optimistic UI bubble immediately
      this.messages[roomId].push(optimisticMsg);

      try {
        const payload = {
          roomId,
          content,
          type,
          mediaUrl,
          mediaMeta,
          isViewOnce,
          replyToId,
          tempId
        };

        // Single REST API request (saves 1 DB row and broadcasts 1 Socket.IO new_message)
        const res = await api.sendMessage(roomId, payload);
        if (res.message) {
          const idx = this.messages[roomId].findIndex(m => m.tempId === tempId || m.id === tempId);
          if (idx !== -1) {
            this.messages[roomId][idx] = { ...this.messages[roomId][idx], ...res.message };
          }
        }
        return res;
      } catch (err) {
        console.error('Failed to send message:', err);
        // Remove optimistic bubble on send failure
        this.messages[roomId] = this.messages[roomId].filter(m => m.tempId !== tempId && m.id !== tempId);
        throw err;
      }
    },

    async consumeViewOnce(messageId) {
      await api.consumeViewOnce(messageId);
      if (this.activeChatId && this.messages[this.activeChatId]) {
        const msg = this.messages[this.activeChatId].find(m => m.id === messageId);
        if (msg) {
          msg.is_consumed = 1;
          msg.content = 'Viewed Media (Expired)';
          msg.media_url = '';
        }
      }
    },

    async createDirectChat(targetUserId) {
      const res = await api.createChat(targetUserId, 'direct');
      await this.fetchChats();
      await this.selectChat(res.roomId);
      return res.roomId;
    },

    async createGroupChat(name, members) {
      const res = await api.createChat(null, 'group', name, members);
      await this.fetchChats();
      await this.selectChat(res.roomId);
      return res.roomId;
    },

    async togglePinChat(roomId) {
      const res = await api.togglePinChat(roomId);
      const chat = this.chats.find(c => c.id === roomId);
      if (chat) chat.isPinned = res.isPinned;
    },

    async setChatBackground(roomId, background) {
      await api.setChatBackground(roomId, background);
      const chat = this.chats.find(c => c.id === roomId);
      if (chat) chat.customBackground = background;
    },

    sendTypingStart() {
      if (this.activeChatId) {
        emitSocketEvent('typing_start', { roomId: this.activeChatId });
      }
    },

    sendTypingStop() {
      if (this.activeChatId) {
        emitSocketEvent('typing_stop', { roomId: this.activeChatId });
      }
    }
  }
});

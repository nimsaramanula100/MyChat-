import { defineStore } from 'pinia';
import { api } from '../services/api.js';
import { onSocketEvent, emitSocketEvent } from '../services/socket.js';

export const useChatStore = defineStore('chat', {
  state: () => ({
    chats: [],
    hiddenChats: [],
    activeChatId: null,
    messages: {}, // roomId -> array of messages
    typingUsers: {}, // roomId -> Set of user displayNames
    onlineUsers: new Set(),
    isLoadingChats: false,
    isLoadingMessages: false,
    isHiddenUnlocked: false,
    hiddenPinPrompt: false,
    currentWallpaper: 'default' // default, dark, gradient, custom URL
  }),

  getters: {
    activeChat: (state) => state.chats.find(c => c.id === state.activeChatId) || null,
    activeMessages: (state) => state.messages[state.activeChatId] || [],
    visibleChats: (state) => {
      if (state.isHiddenUnlocked) {
        return state.chats;
      }
      return state.chats.filter(c => !c.isHidden);
    },
    pinnedChats: (state) => state.chats.filter(c => c.isPinned && (!c.isHidden || state.isHiddenUnlocked)),
    unreadTotal: (state) => state.chats.reduce((acc, c) => acc + (c.unreadCount || 0), 0)
  },

  actions: {
    initSocketListeners() {
      // Listen for incoming new messages
      onSocketEvent('new_message', (msg) => {
        const roomId = msg.room_id;
        if (!this.messages[roomId]) {
          this.messages[roomId] = [];
        }

        // Avoid duplicate message appending
        if (!this.messages[roomId].some(m => m.id === msg.id)) {
          this.messages[roomId].push(msg);
        }

        // Update chat's last message & unread count
        const chat = this.chats.find(c => c.id === roomId);
        if (chat) {
          chat.lastMessage = {
            id: msg.id,
            content: msg.is_view_once ? '[View Once Media]' : msg.content,
            type: msg.type,
            senderName: msg.sender_name,
            createdAt: msg.created_at
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

      const payload = {
        roomId: this.activeChatId,
        content,
        type,
        mediaUrl,
        mediaMeta,
        isViewOnce,
        replyToId
      };

      // Realtime emit via Socket
      emitSocketEvent('send_message', payload);

      // Fallback REST call for redundancy
      const res = await api.sendMessage(this.activeChatId, payload);
      return res;
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

    async hideChat(roomId, pin) {
      await api.hideChat(roomId, pin);
      const chat = this.chats.find(c => c.id === roomId);
      if (chat) chat.isHidden = true;
    },

    async unlockHiddenChats(pin) {
      const res = await api.unlockHiddenChats(pin);
      if (res.unlocked) {
        this.isHiddenUnlocked = true;
      }
      return res.unlocked;
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

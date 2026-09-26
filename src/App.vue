<template>
  <div :class="['app-container', themeClass, { 'mobile-view': isMobile }]">
    <!-- App Lock Overlay if PIN Locked -->
    <div v-if="authStore.isAppLocked" class="lock-overlay">
      <div class="lock-card">
        <div class="lock-icon">🔒</div>
        <h2>NovaChat Security Lock</h2>
        <p>Enter your 4-digit PIN to unlock NovaChat</p>
        <div class="pin-input-group">
          <input 
            type="password" 
            v-model="inputPin" 
            maxlength="6" 
            placeholder="• • • •"
            @keyup.enter="unlockApp"
            class="pin-input"
            autofocus
          />
        </div>
        <button @click="unlockApp" class="btn-primary">Unlock Application</button>
      </div>
    </div>

    <!-- Auth Modal (Phone OTP & Setup) -->
    <div v-else-if="!authStore.isAuthenticated" class="auth-wrapper">
      <div class="auth-card">
        <div class="auth-header">
          <div class="auth-logo">
            <span class="logo-icon">⚡</span>
            <span class="logo-text">NovaChat</span>
          </div>
          <p class="auth-subtitle">Real-time messaging platform inspired by Telegram & WhatsApp</p>
        </div>

        <!-- Step 1: Phone Entry -->
        <div v-if="!authStore.otpSent" class="auth-step">
          <h3 class="step-title">Sign in with Mobile Number</h3>
          <p class="step-desc">Select country code and enter your mobile phone number.</p>
          
          <div class="form-group phone-group">
            <select v-model="countryCode" class="country-select">
              <option value="+94">🇱🇰 Sri Lanka (+94)</option>
              <option value="+1">🇺🇸 USA (+1)</option>
              <option value="+44">🇬🇧 UK (+44)</option>
              <option value="+91">🇮🇳 India (+91)</option>
              <option value="+81">🇯🇵 Japan (+81)</option>
              <option value="+49">🇩🇪 Germany (+49)</option>
            </select>
            <input 
              type="tel" 
              v-model="phoneInput" 
              placeholder="77 123 4567" 
              class="phone-input"
              @keyup.enter="handleSendOtp"
            />
          </div>

          <button @click="handleSendOtp" :disabled="authStore.isLoading" class="btn-primary btn-block">
            <span v-if="authStore.isLoading">Sending OTP...</span>
            <span v-else>Continue & Send OTP</span>
          </button>

          <!-- Quick Dev Test Login Buttons -->
          <div class="dev-quick-login">
            <div class="dev-divider"><span>OR TEST WITH SEED ACCOUNTS</span></div>
            <div class="seed-users-grid">
              <button 
                v-for="user in devSeedUsers" 
                :key="user.phone" 
                @click="quickLoginSeedUser(user.phone)"
                class="seed-user-btn"
              >
                <img :src="user.avatar" class="seed-avatar" />
                <div class="seed-info">
                  <span class="seed-name">{{ user.name }}</span>
                  <span class="seed-role">{{ user.role }}</span>
                </div>
              </button>
            </div>
          </div>
        </div>

        <!-- Step 2: OTP Verification -->
        <div v-else class="auth-step">
          <h3 class="step-title">Verify OTP Code</h3>
          <p class="step-desc">Enter 6-digit OTP code sent to <strong>{{ authStore.phoneNumber }}</strong></p>

          <div class="dev-otp-badge">
            ⚡ Dev Mode OTP: <strong>{{ authStore.devOtpCode }}</strong>
            <button @click="otpInput = authStore.devOtpCode" class="btn-link">Auto-fill</button>
          </div>

          <div class="form-group">
            <input 
              type="text" 
              v-model="otpInput" 
              maxlength="6" 
              placeholder="123456" 
              class="otp-input"
              @keyup.enter="handleVerifyOtp"
            />
          </div>

          <button @click="handleVerifyOtp" :disabled="authStore.isLoading" class="btn-primary btn-block">
            <span v-if="authStore.isLoading">Verifying...</span>
            <span v-else>Verify & Enter</span>
          </button>

          <button @click="authStore.otpSent = false" class="btn-secondary btn-block mt-2">Back to Phone Input</button>
        </div>
      </div>
    </div>

    <!-- Main Application Interface -->
    <div v-else class="main-layout">
      <!-- Left Sidebar Navigation -->
      <aside :class="['sidebar-nav', { 'mobile-hidden': isMobile && activeTab === 'chat' && chatStore.activeChatId }]">
        <div class="nav-header">
          <div class="nav-brand">
            <span class="brand-logo">⚡</span>
            <span class="brand-name">NovaChat</span>
          </div>
          <div class="user-status-avatar" @click="showSettingsModal = true">
            <img :src="authStore.user?.avatar" class="avatar-sm" />
            <span class="online-indicator"></span>
          </div>
        </div>

        <!-- Main Section Selector Tabs -->
        <div class="section-tabs">
          <button 
            :class="['tab-btn', { active: activeTab === 'chat' }]" 
            @click="activeTab = 'chat'"
            title="Chats"
          >
            💬 <span class="tab-label">Chats</span>
            <span v-if="chatStore.unreadTotal > 0" class="badge-unread">{{ chatStore.unreadTotal }}</span>
          </button>

          <button 
            :class="['tab-btn', { active: activeTab === 'nearby' }]" 
            @click="switchTab('nearby')"
            title="People Nearby"
          >
            📍 <span class="tab-label">Nearby</span>
          </button>

          <button 
            :class="['tab-btn', { active: activeTab === 'contacts' }]" 
            @click="switchTab('contacts')"
            title="Contacts"
          >
            📇 <span class="tab-label">Contacts</span>
          </button>

          <button 
            v-if="authStore.user?.isAdmin"
            :class="['tab-btn', { active: activeTab === 'admin' }]" 
            @click="switchTab('admin')"
            title="Admin Dashboard"
          >
            🛡️ <span class="tab-label">Admin</span>
          </button>

          <button 
            :class="['tab-btn', { active: activeTab === 'settings' }]" 
            @click="showSettingsModal = true"
            title="Settings"
          >
            ⚙️ <span class="tab-label">Settings</span>
          </button>
        </div>

        <!-- Chat List View -->
        <div v-if="activeTab === 'chat'" class="chat-list-container">
          <div class="search-bar-wrapper">
            <span class="search-icon">🔍</span>
            <input 
              type="text" 
              v-model="searchQuery" 
              placeholder="Search chats or messages..." 
              class="search-input" 
            />
            <button @click="showNewChatModal = true" class="btn-icon-add" title="New Chat">+</button>
          </div>

          <!-- Hidden Chats Unlock Prompt Banner -->
          <div v-if="!chatStore.isHiddenUnlocked" class="hidden-chats-banner" @click="promptHiddenPin">
            <span class="banner-icon">🔒</span>
            <div class="banner-text">
              <span class="banner-title">Hidden Chats</span>
              <span class="banner-sub">Tap to enter security PIN</span>
            </div>
          </div>
          <div v-else class="hidden-chats-unlocked-badge">
            🔓 Hidden Chats Unlocked <button @click="chatStore.isHiddenUnlocked = false" class="btn-xs">Lock</button>
          </div>

          <div class="chat-items-scroll">
            <div v-if="chatStore.isLoadingChats" class="loading-spinner">Loading chats...</div>
            <div v-else-if="filteredChats.length === 0" class="empty-chats">
              <span>No chats found</span>
              <button @click="showNewChatModal = true" class="btn-secondary btn-sm mt-2">Start a Chat</button>
            </div>

            <div 
              v-for="chat in filteredChats" 
              :key="chat.id" 
              :class="['chat-item', { active: chat.id === chatStore.activeChatId, pinned: chat.isPinned }]"
              @click="chatStore.selectChat(chat.id)"
            >
              <div class="chat-item-avatar">
                <img :src="chat.avatar || 'https://api.dicebear.com/7.x/identicon/svg?seed=' + chat.name" class="avatar-md" />
                <span v-if="chatStore.onlineUsers.has(chat.partner?.id)" class="online-indicator"></span>
              </div>
              <div class="chat-item-content">
                <div class="chat-item-top">
                  <span class="chat-name">
                    <span v-if="chat.type === 'private' || chat.type === 'secret'">🔐 </span>
                    {{ chat.name }}
                  </span>
                  <span v-if="chat.lastMessage" class="chat-time">{{ formatTime(chat.lastMessage.createdAt) }}</span>
                </div>
                <div class="chat-item-bottom">
                  <span class="chat-preview">
                    <span v-if="chatStore.typingUsers[chat.id]?.size > 0" class="typing-text">typing...</span>
                    <span v-else-if="chat.lastMessage">{{ chat.lastMessage.senderName }}: {{ chat.lastMessage.content }}</span>
                    <span v-else class="no-msg">No messages yet</span>
                  </span>
                  <div class="chat-badges">
                    <span v-if="chat.isPinned" class="pin-badge">📌</span>
                    <span v-if="chat.unreadCount > 0" class="unread-badge">{{ chat.unreadCount }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- People Nearby View -->
        <div v-else-if="activeTab === 'nearby'" class="nearby-container">
          <div class="section-header">
            <h3>📍 People Nearby</h3>
            <p>Discover users in your approximate area</p>
          </div>
          <div class="nearby-scroll">
            <div v-for="person in peopleStore.nearbyPeople" :key="person.id" class="person-card">
              <img :src="person.avatar" class="avatar-lg" />
              <div class="person-details">
                <span class="person-name">{{ person.displayName }}</span>
                <span class="person-user">@{{ person.username }}</span>
                <span class="person-dist">📍 {{ person.distanceText }}</span>
                <p class="person-bio">{{ person.bio }}</p>
                <button @click="startChatWithUser(person.id)" class="btn-primary btn-sm mt-2">Message Direct</button>
              </div>
            </div>
          </div>
        </div>

        <!-- Contacts View -->
        <div v-else-if="activeTab === 'contacts'" class="contacts-container">
          <div class="section-header">
            <h3>📇 My Contacts</h3>
          </div>
          <div class="contacts-scroll">
            <div v-for="c in peopleStore.contacts" :key="c.id" class="contact-item">
              <img :src="c.avatar" class="avatar-md" />
              <div class="contact-info">
                <span class="contact-name">{{ c.display_name }}</span>
                <span class="contact-phone">{{ c.phone_number }}</span>
              </div>
              <button @click="startChatWithUser(c.id)" class="btn-secondary btn-sm">Chat</button>
            </div>
          </div>
        </div>

        <!-- Admin View -->
        <div v-else-if="activeTab === 'admin'" class="admin-container">
          <div class="section-header">
            <h3>🛡️ Admin Dashboard</h3>
          </div>
          <div v-if="adminStore.stats" class="stats-grid">
            <div class="stat-card">
              <span class="stat-num">{{ adminStore.stats.totalUsers }}</span>
              <span class="stat-lbl">Users</span>
            </div>
            <div class="stat-card">
              <span class="stat-num">{{ adminStore.stats.totalMessages }}</span>
              <span class="stat-lbl">Messages</span>
            </div>
            <div class="stat-card">
              <span class="stat-num">{{ adminStore.stats.pendingReports }}</span>
              <span class="stat-lbl">Reports</span>
            </div>
          </div>
        </div>
      </aside>

      <!-- Center & Right Chat Conversation Workspace -->
      <main class="chat-workspace">
        <div v-if="!chatStore.activeChatId" class="no-active-chat">
          <div class="welcome-banner">
            <span class="banner-hero-icon">⚡</span>
            <h2>Welcome to NovaChat</h2>
            <p>Select a conversation from the sidebar or find nearby people to start messaging in real time.</p>
          </div>
        </div>

        <div v-else class="active-chat-container">
          <!-- Chat Header -->
          <header class="chat-header">
            <div class="header-left">
              <button v-if="isMobile" @click="chatStore.activeChatId = null" class="btn-back">←</button>
              <img :src="chatStore.activeChat?.avatar || 'https://api.dicebear.com/7.x/identicon/svg?seed=Chat'" class="avatar-md" />
              <div class="header-title-group">
                <span class="header-name">{{ chatStore.activeChat?.name }}</span>
                <span class="header-sub">
                  <span v-if="chatStore.typingUsers[chatStore.activeChatId]?.size > 0" class="typing-active">typing...</span>
                  <span v-else-if="chatStore.onlineUsers.has(chatStore.activeChat?.partner?.id)">Online</span>
                  <span v-else>Offline</span>
                </span>
              </div>
            </div>

            <div class="header-actions">
              <button @click="togglePin" class="btn-icon" :title="chatStore.activeChat?.isPinned ? 'Unpin' : 'Pin Chat'">📌</button>
              <button @click="promptHideCurrentChat" class="btn-icon" title="Hide Chat with PIN">🔒</button>
              <button @click="showWallpaperPicker = !showWallpaperPicker" class="btn-icon" title="Change Background">🎨</button>
            </div>
          </header>

          <!-- Wallpaper Picker Dropdown -->
          <div v-if="showWallpaperPicker" class="wallpaper-picker-bar">
            <span>Wallpaper:</span>
            <button @click="setWallpaper('default')" class="wp-opt default">Default</button>
            <button @click="setWallpaper('dark')" class="wp-opt dark">Dark Slate</button>
            <button @click="setWallpaper('gradient')" class="wp-opt gradient">Neon Glow</button>
          </div>

          <!-- Messages Scrollable Body -->
          <div :class="['messages-body', wallpaperClass]">
            <div v-if="chatStore.isLoadingMessages" class="loading-spinner">Loading messages...</div>

            <div 
              v-for="msg in chatStore.activeMessages" 
              :key="msg.id" 
              :class="['message-bubble-wrapper', { outgoing: msg.sender_id === authStore.user?.id }]"
            >
              <div class="message-bubble">
                <span v-if="msg.sender_id !== authStore.user?.id && chatStore.activeChat?.type === 'group'" class="sender-name">{{ msg.sender_name }}</span>

                <!-- Text Content -->
                <div v-if="msg.type === 'text'" class="msg-content">{{ msg.content }}</div>

                <!-- Image Attachment -->
                <div v-else-if="msg.type === 'image'" class="msg-media-container">
                  <div v-if="msg.is_view_once" class="view-once-box" @click="handleOpenViewOnce(msg)">
                    <span class="vo-icon">👁️</span>
                    <span v-if="msg.is_consumed" class="vo-status">Viewed Media (Expired)</span>
                    <span v-else class="vo-status">Tap to View Once Photo</span>
                  </div>
                  <img v-else :src="msg.media_url" class="msg-image-preview" />
                </div>

                <!-- Voice Message -->
                <div v-else-if="msg.type === 'voice'" class="msg-voice-player">
                  <button @click="playVoiceAudio(msg.media_url)" class="voice-play-btn">▶</button>
                  <div class="voice-waveform"></div>
                  <span class="voice-duration">0:15</span>
                </div>

                <!-- Message Meta -->
                <div class="msg-meta">
                  <span class="msg-time">{{ formatTime(msg.created_at) }}</span>
                  <span v-if="msg.sender_id === authStore.user?.id" class="read-ticks">✓✓</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Chat Input Bar -->
          <footer class="chat-input-bar">
            <div class="input-actions-left">
              <label class="btn-icon file-upload-label" title="Send Photo/Video">
                📷
                <input type="file" @change="handleFileUpload" accept="image/*,video/*,audio/*" style="display:none;" />
              </label>
              <button 
                @click="isViewOnceMode = !isViewOnceMode" 
                :class="['btn-icon', { active: isViewOnceMode }]"
                title="Toggle View Once Media"
              >
                1️⃣
              </button>
            </div>

            <textarea 
              v-model="messageInput" 
              placeholder="Write a message..." 
              class="message-textarea"
              rows="1"
              @keydown.enter.prevent="handleSendMessage"
              @input="handleTyping"
            ></textarea>

            <div class="input-actions-right">
              <button 
                @click="isRecordingVoice = !isRecordingVoice" 
                :class="['btn-icon', { recording: isRecordingVoice }]"
                title="Voice Recording"
              >
                🎙️
              </button>
              <button @click="handleSendMessage" class="btn-send">Send ⚡</button>
            </div>
          </footer>
        </div>
      </main>
    </div>

    <!-- Modals -->
    <!-- PIN Prompt Modal for Hidden Chats -->
    <div v-if="showPinModal" class="modal-overlay">
      <div class="modal-card">
        <h3>Enter Security PIN</h3>
        <p>Unlock your private hidden conversations.</p>
        <input type="password" v-model="hiddenPinInput" maxlength="6" class="pin-input mt-2" placeholder="• • • •" />
        <div class="modal-actions mt-3">
          <button @click="submitHiddenPin" class="btn-primary">Unlock</button>
          <button @click="showPinModal = false" class="btn-secondary">Cancel</button>
        </div>
      </div>
    </div>

    <!-- View-Once Media Fullscreen Dialog -->
    <div v-if="activeViewOnceMsg" class="view-once-modal-overlay">
      <div class="view-once-card">
        <div class="vo-header">
          <span>1️⃣ View-Once Media</span>
          <button @click="closeViewOnceModal" class="btn-close">✕ Close & Expire</button>
        </div>
        <img :src="activeViewOnceMsg.media_url" class="vo-full-image" />
        <p class="vo-warning">⚠️ This media will expire permanently when you close this window.</p>
      </div>
    </div>

    <!-- Settings Modal -->
    <div v-if="showSettingsModal" class="modal-overlay">
      <div class="modal-card settings-card">
        <div class="modal-header">
          <h3>⚙️ Application Settings</h3>
          <button @click="showSettingsModal = false" class="btn-close">✕</button>
        </div>
        <div class="settings-body">
          <div class="setting-row">
            <span>Display Name:</span>
            <input type="text" v-model="authStore.user.displayName" class="input-sm" />
          </div>
          <div class="setting-row">
            <span>Location Discovery:</span>
            <input type="checkbox" v-model="peopleStore.isLocationEnabled" />
          </div>
          <button @click="authStore.logout()" class="btn-danger btn-block mt-3">Log Out</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useAuthStore } from './stores/authStore.js';
import { useChatStore } from './stores/chatStore.js';
import { usePeopleStore } from './stores/peopleStore.js';
import { useAdminStore } from './stores/adminStore.js';
import { api } from './services/api.js';

const authStore = useAuthStore();
const chatStore = useChatStore();
const peopleStore = usePeopleStore();
const adminStore = useAdminStore();

const activeTab = ref('chat');
const isMobile = ref(window.innerWidth < 768);
const countryCode = ref('+94');
const phoneInput = ref('');
const otpInput = ref('');
const searchQuery = ref('');
const messageInput = ref('');
const isViewOnceMode = ref(false);
const isRecordingVoice = ref(false);
const showWallpaperPicker = ref(false);
const showSettingsModal = ref(false);
const showPinModal = ref(false);
const hiddenPinInput = ref('');
const activeViewOnceMsg = ref(null);
const inputPin = ref('');
const themeClass = ref('theme-dark');
const wallpaperClass = ref('wp-default');

const devSeedUsers = [
  { phone: '+94771234567', name: 'Alex Rivera (Admin)', role: 'Product Lead', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80' },
  { phone: '+94779876543', name: 'Sophia Chen', role: 'Architect', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80' },
  { phone: '+94712223344', name: 'Marcus Vance', role: 'Dev', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80' }
];

const filteredChats = computed(() => {
  let list = chatStore.visibleChats;
  if (searchQuery.value) {
    list = list.filter(c => c.name.toLowerCase().includes(searchQuery.value.toLowerCase()));
  }
  return list;
});

onMounted(async () => {
  if (authStore.isAuthenticated) {
    await authStore.fetchMe();
    await chatStore.fetchChats();
  }
});

async function handleSendOtp() {
  if (!phoneInput.value) return;
  const fullPhone = `${countryCode.value}${phoneInput.value.replace(/\s+/g, '')}`;
  await authStore.requestOtp(fullPhone);
}

async function quickLoginSeedUser(phone) {
  await authStore.requestOtp(phone);
  await authStore.verifyOtp(authStore.devOtpCode);
  await chatStore.fetchChats();
}

async function handleVerifyOtp() {
  await authStore.verifyOtp(otpInput.value);
  await chatStore.fetchChats();
}

function switchTab(tab) {
  activeTab.value = tab;
  if (tab === 'nearby') peopleStore.fetchNearbyPeople();
  if (tab === 'contacts') peopleStore.fetchContacts();
  if (tab === 'admin') {
    adminStore.fetchStats();
    adminStore.fetchUsers();
  }
}

async function handleSendMessage() {
  if (!messageInput.value && !isViewOnceMode.value) return;
  await chatStore.sendMessage({
    content: messageInput.value,
    type: 'text',
    isViewOnce: isViewOnceMode.value
  });
  messageInput.value = '';
  isViewOnceMode.value = false;
}

function handleTyping() {
  chatStore.sendTypingStart();
}

async function handleFileUpload(e) {
  const file = e.target.files[0];
  if (!file) return;
  const res = await api.uploadMedia(file);
  await chatStore.sendMessage({
    type: file.type.startsWith('image') ? 'image' : 'video',
    mediaUrl: res.mediaUrl,
    mediaMeta: res.mediaMeta,
    isViewOnce: isViewOnceMode.value
  });
  isViewOnceMode.value = false;
}

function handleOpenViewOnce(msg) {
  if (msg.is_consumed) return;
  activeViewOnceMsg.value = msg;
}

async function closeViewOnceModal() {
  if (activeViewOnceMsg.value) {
    await chatStore.consumeViewOnce(activeViewOnceMsg.value.id);
    activeViewOnceMsg.value = null;
  }
}

function promptHiddenPin() {
  showPinModal.value = true;
}

async function submitHiddenPin() {
  const unlocked = await chatStore.unlockHiddenChats(hiddenPinInput.value);
  if (unlocked) {
    showPinModal.value = false;
    hiddenPinInput.value = '';
  }
}

async function promptHideCurrentChat() {
  if (!chatStore.activeChatId) return;
  const pin = prompt('Enter a 4-digit PIN to hide this conversation:');
  if (pin) {
    await chatStore.hideChat(chatStore.activeChatId, pin);
    alert('Chat moved to Hidden Chats.');
  }
}

function setWallpaper(mode) {
  wallpaperClass.value = `wp-${mode}`;
  showWallpaperPicker.value = false;
}

function formatTime(isoStr) {
  if (!isoStr) return '';
  const d = new Date(isoStr);
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function unlockApp() {
  authStore.unlockApp(inputPin.value);
  inputPin.value = '';
}

async function startChatWithUser(userId) {
  const roomId = await chatStore.createDirectChat(userId);
  activeTab.value = 'chat';
}

function playVoiceAudio(url) {
  const audio = new Audio(url);
  audio.play();
}
</script>

<style>
@import './assets/styles/variables.css';
@import './assets/styles/base.css';
@import './assets/styles/components.css';

.app-container {
  display: flex;
  width: 100vw;
  height: 100vh;
  background-color: #0f172a;
  color: #f8fafc;
  font-family: 'Inter', system-ui, sans-serif;
  overflow: hidden;
}

/* Auth Section */
.auth-wrapper {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
  height: 100%;
  background: radial-gradient(circle at top right, #1e1b4b, #0f172a);
}

.auth-card {
  width: 440px;
  max-width: 90%;
  padding: 2.5rem;
  background: rgba(30, 41, 59, 0.85);
  backdrop-filter: blur(16px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 1.5rem;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.5);
}

.auth-header {
  text-align: center;
  margin-bottom: 2rem;
}

.logo-icon {
  font-size: 2.5rem;
  background: linear-gradient(135deg, #6366f1, #a855f7);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.logo-text {
  font-size: 2rem;
  font-weight: 800;
  margin-left: 0.5rem;
  background: linear-gradient(135deg, #6366f1, #ec4899);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.auth-subtitle {
  color: #94a3b8;
  font-size: 0.9rem;
  margin-top: 0.5rem;
}

.phone-group {
  display: flex;
  gap: 0.5rem;
}

.country-select {
  background: #0f172a;
  color: #fff;
  border: 1px solid #334155;
  border-radius: 0.75rem;
  padding: 0.75rem;
}

.phone-input, .otp-input {
  width: 100%;
  background: #0f172a;
  color: #fff;
  border: 1px solid #334155;
  border-radius: 0.75rem;
  padding: 0.75rem 1rem;
  font-size: 1.1rem;
}

.btn-primary {
  background: linear-gradient(135deg, #6366f1, #4f46e5);
  color: white;
  border: none;
  padding: 0.85rem 1.5rem;
  border-radius: 0.75rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-primary:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(99, 102, 241, 0.4);
}

.btn-block { width: 100%; }

.dev-quick-login {
  margin-top: 2rem;
  text-align: center;
}

.dev-divider {
  display: flex;
  align-items: center;
  margin: 1.5rem 0;
  color: #64748b;
  font-size: 0.75rem;
}

.dev-divider::before, .dev-divider::after {
  content: '';
  flex: 1;
  border-bottom: 1px solid #334155;
}

.seed-users-grid {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.seed-user-btn {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.6rem 1rem;
  background: rgba(15, 23, 42, 0.6);
  border: 1px solid #334155;
  border-radius: 0.75rem;
  color: #f8fafc;
  cursor: pointer;
  transition: background 0.2s;
}

.seed-user-btn:hover {
  background: #334155;
}

.seed-avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  object-fit: cover;
}

/* Main Layout */
.main-layout {
  display: flex;
  width: 100%;
  height: 100%;
}

.sidebar-nav {
  width: 360px;
  background: #1e293b;
  border-right: 1px solid #334155;
  display: flex;
  flex-direction: column;
}

.nav-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.2rem;
  border-bottom: 1px solid #334155;
}

.nav-brand {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: 700;
  font-size: 1.3rem;
}

.section-tabs {
  display: flex;
  background: #0f172a;
  padding: 0.5rem;
  gap: 0.25rem;
  border-bottom: 1px solid #334155;
}

.tab-btn {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.4rem;
  padding: 0.6rem 0.4rem;
  background: transparent;
  border: none;
  color: #94a3b8;
  border-radius: 0.5rem;
  font-size: 0.85rem;
  cursor: pointer;
}

.tab-btn.active {
  background: #334155;
  color: #fff;
  font-weight: 600;
}

.chat-list-container {
  display: flex;
  flex-direction: column;
  flex: 1;
  overflow: hidden;
}

.search-bar-wrapper {
  display: flex;
  align-items: center;
  padding: 0.75rem 1rem;
  gap: 0.5rem;
  background: #0f172a;
  border-bottom: 1px solid #334155;
}

.search-input {
  flex: 1;
  background: transparent;
  border: none;
  color: #fff;
  outline: none;
}

.btn-icon-add {
  background: #6366f1;
  color: #fff;
  border: none;
  border-radius: 50%;
  width: 28px;
  height: 28px;
  cursor: pointer;
}

.chat-items-scroll {
  flex: 1;
  overflow-y: auto;
}

.chat-item {
  display: flex;
  align-items: center;
  padding: 0.85rem 1rem;
  gap: 0.75rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  cursor: pointer;
  transition: background 0.15s;
}

.chat-item:hover, .chat-item.active {
  background: #334155;
}

.chat-item-content {
  flex: 1;
  min-width: 0;
}

.chat-item-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.chat-name {
  font-weight: 600;
  font-size: 0.95rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.chat-time {
  font-size: 0.75rem;
  color: #64748b;
}

.chat-preview {
  font-size: 0.85rem;
  color: #94a3b8;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  display: block;
}

/* Chat Workspace */
.chat-workspace {
  flex: 1;
  display: flex;
  flex-direction: column;
  background: #0f172a;
}

.no-active-chat {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100%;
  color: #64748b;
  text-align: center;
}

.active-chat-container {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.chat-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.85rem 1.5rem;
  background: #1e293b;
  border-bottom: 1px solid #334155;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.messages-body {
  flex: 1;
  padding: 1.5rem;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.wp-default { background: #0f172a; }
.wp-dark { background: #020617; }
.wp-gradient { background: radial-gradient(circle at bottom left, #1e1b4b, #0f172a); }

.message-bubble-wrapper {
  display: flex;
  width: 100%;
}

.message-bubble-wrapper.outgoing {
  justify-content: flex-end;
}

.message-bubble {
  max-width: 65%;
  padding: 0.75rem 1rem;
  border-radius: 1rem;
  background: #1e293b;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.2);
}

.outgoing .message-bubble {
  background: linear-gradient(135deg, #6366f1, #4f46e5);
  color: white;
}

.chat-input-bar {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1rem 1.5rem;
  background: #1e293b;
  border-top: 1px solid #334155;
}

.message-textarea {
  flex: 1;
  background: #0f172a;
  border: 1px solid #334155;
  border-radius: 1.5rem;
  padding: 0.6rem 1.2rem;
  color: #fff;
  outline: none;
  resize: none;
}

.btn-send {
  background: linear-gradient(135deg, #6366f1, #a855f7);
  color: white;
  border: none;
  padding: 0.6rem 1.2rem;
  border-radius: 1.5rem;
  font-weight: 600;
  cursor: pointer;
}

.view-once-box {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: rgba(255, 255, 255, 0.1);
  padding: 0.6rem 1rem;
  border-radius: 0.75rem;
  cursor: pointer;
}
</style>

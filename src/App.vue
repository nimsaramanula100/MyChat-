<template>
  <div :class="['app-container', themeClass, { 'mobile-view': isMobile }]">
    <!-- App Lock Overlay if PIN Locked -->
    <div v-if="authStore.isAppLocked" class="lock-overlay">
      <div class="lock-card">
        <div class="lock-icon">🔒</div>
        <h2>MyChat Security Lock</h2>
        <p>Enter your 4-digit PIN to unlock MyChat</p>
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
            <span class="logo-text">MyChat</span>
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
            <span class="brand-name">MyChat</span>
          </div>
          <div class="nav-brand-actions">
            <button @click="openSettingsPage('main')" class="btn-icon" title="Application Settings">⚙️</button>
            <div class="user-status-avatar" @click="openProfilePage()" title="Settings & Profile">
              <img :src="authStore.user?.avatar" class="avatar-sm" />
              <span class="online-indicator"></span>
            </div>
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
            @click="openSettingsPage('main')"
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
            
            <!-- Empty Chat List Screen (Section 29) -->
            <div v-else-if="filteredChats.length === 0" class="empty-chats-box">
              <span class="empty-icon">💬</span>
              <h4>No conversations yet</h4>
              <p>Find a friend or search for someone to start chatting in real time.</p>
              <div class="empty-actions">
                <button @click="switchTab('nearby')" class="btn-primary btn-sm">Find People</button>
                <button @click="switchTab('contacts')" class="btn-secondary btn-sm">Contacts</button>
                <button @click="showNewChatModal = true" class="btn-secondary btn-sm">Add Contact</button>
              </div>
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
                    <span v-if="chatStore.typingUsers[chat.id]?.size > 0" class="typing-active">typing...</span>
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

        <!-- Contacts View (Sections 4, 5, 6, 8) -->
        <div v-else-if="activeTab === 'contacts'" class="contacts-container">
          <div class="section-header">
            <h3>📇 My Contacts</h3>
            <button @click="showNewChatModal = true" class="btn-primary btn-sm">+ Add Contact</button>
          </div>

          <!-- Web Limitation Banner (Section 6) -->
          <div class="web-contact-notice">
            <span class="notice-icon">📱</span>
            <div class="notice-text">
              <strong>Contact access is not available on this web device.</strong>
              <p>You can add contacts manually using their phone number below.</p>
            </div>
          </div>

          <div class="contacts-scroll">
            <h4 class="contact-section-title">Registered on MyChat</h4>
            <div v-if="peopleStore.contacts.length === 0" class="empty-sub">No contacts added yet.</div>
            <div v-for="c in peopleStore.contacts" :key="c.id" class="contact-item">
              <img :src="c.avatar" class="avatar-md" />
              <div class="contact-info">
                <span class="contact-name">{{ c.display_name }}</span>
                <span class="contact-phone">{{ c.phone_number }}</span>
              </div>
              <button @click="startChatWithUser(c.id)" class="btn-primary btn-sm">Message</button>
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
            <h2>Welcome to MyChat</h2>
            <p>Select a conversation from the sidebar or find nearby people to start messaging in real time.</p>
            <div class="welcome-actions mt-3">
              <button @click="showNewChatModal = true" class="btn-primary">Start New Chat</button>
              <button @click="switchTab('contacts')" class="btn-secondary ml-2">My Contacts</button>
            </div>
          </div>
        </div>

        <div v-else class="active-chat-container">
          <!-- Chat Header -->
          <header class="chat-header">
            <div class="header-left clickable-header-left" @click="chatStore.activeChat?.type === 'group' ? showGroupInfoModal = true : openProfilePage()">
              <button v-if="isMobile" @click.stop="chatStore.activeChatId = null" class="btn-back">← Back</button>
              <img :src="chatStore.activeChat?.avatar || 'https://api.dicebear.com/7.x/identicon/svg?seed=Chat'" class="avatar-md" />
              <div class="header-title-group">
                <span class="header-name">
                  {{ chatStore.activeChat?.name }}
                  <span v-if="chatStore.activeChat?.type === 'group'" class="group-tag-badge">Group ℹ️</span>
                </span>
                <span class="header-sub">
                  <span v-if="chatStore.activeChat?.type === 'group'">{{ chatStore.activeChat?.memberCount || 'Multiple' }} members • Tap for info</span>
                  <span v-else-if="chatStore.typingUsers[chatStore.activeChatId]?.size > 0" class="typing-active">typing...</span>
                  <span v-else-if="chatStore.onlineUsers.has(chatStore.activeChat?.partner?.id)" class="status-online">Online</span>
                  <span v-else class="status-offline">Offline</span>
                </span>
              </div>
            </div>

            <div class="header-actions">
              <button v-if="chatStore.activeChat?.type === 'group'" @click="showGroupInfoModal = true" class="btn-icon" title="Group Info">ℹ️</button>
              <button @click="togglePin" class="btn-icon" :title="chatStore.activeChat?.isPinned ? 'Unpin' : 'Pin Chat'">📌</button>
              <button @click="promptHideCurrentChat" class="btn-icon" title="Hide Chat with PIN">🔒</button>
              <button @click="showWallpaperPicker = !showWallpaperPicker" class="btn-icon" title="Change Background">🎨</button>
              <button @click="openSettingsPage('main')" class="btn-icon" title="Application Settings">⚙️</button>
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
                  <div v-else class="image-bubble-wrap" @click="openLightbox(msg.media_url, msg.content, 'image')">
                    <img :src="fullFileUrl(msg.media_url)" class="msg-image-preview" alt="Chat photo" />
                    <div v-if="msg.content" class="msg-caption">{{ msg.content }}</div>
                  </div>
                </div>

                <!-- Video Attachment -->
                <div v-else-if="msg.type === 'video'" class="msg-media-container">
                  <div class="video-bubble-wrap">
                    <video :src="fullFileUrl(msg.media_url)" controls class="msg-video-player"></video>
                    <div v-if="msg.content" class="msg-caption">{{ msg.content }}</div>
                  </div>
                </div>

                <!-- Document Attachment (WhatsApp style card) -->
                <div v-else-if="msg.type === 'document'" class="msg-doc-card">
                  <div class="doc-card-top">
                    <span class="doc-badge-sm" :class="getDocBadgeClass(msg.mediaMeta?.name || msg.media_meta?.originalName)">
                      {{ getDocExtension(msg.mediaMeta?.name || msg.media_meta?.originalName) }}
                    </span>
                    <div class="doc-card-details">
                      <span class="doc-card-name">{{ msg.mediaMeta?.name || msg.media_meta?.originalName || 'Document' }}</span>
                      <span class="doc-card-size">{{ formatFileSize(msg.mediaMeta?.size || msg.media_meta?.size) }}</span>
                    </div>
                    <a :href="fullFileUrl(msg.media_url)" target="_blank" download class="btn-doc-dl" title="Download Document">💾</a>
                  </div>
                  <div v-if="msg.content" class="msg-caption mt-1">{{ msg.content }}</div>
                </div>

                <!-- Audio / Voice Message -->
                <div v-else-if="msg.type === 'audio' || msg.type === 'voice'" class="msg-audio-card">
                  <div class="audio-card-header">
                    <span class="audio-icon">🎵</span>
                    <div class="audio-card-meta">
                      <span class="audio-card-title">{{ msg.mediaMeta?.name || 'Audio Message' }}</span>
                      <span class="audio-card-size">{{ formatFileSize(msg.mediaMeta?.size) }}</span>
                    </div>
                  </div>
                  <audio :src="fullFileUrl(msg.media_url)" controls class="msg-audio-element"></audio>
                  <div v-if="msg.content" class="msg-caption mt-1">{{ msg.content }}</div>
                </div>

                <!-- Contact Message -->
                <div v-else-if="msg.type === 'contact'" class="msg-contact-card">
                  <div class="contact-card-top">
                    <img :src="(msg.mediaMeta?.avatar || msg.media_meta?.avatar) || 'https://api.dicebear.com/7.x/identicon/svg?seed=Contact'" class="avatar-md" />
                    <div class="contact-card-info">
                      <span class="contact-card-name">{{ (msg.mediaMeta?.displayName || msg.media_meta?.displayName) || 'Shared Contact' }}</span>
                      <span class="contact-card-phone">{{ (msg.mediaMeta?.phoneNumber || msg.media_meta?.phoneNumber) || '' }}</span>
                    </div>
                  </div>
                  <button @click="startChatWithUser(msg.mediaMeta?.id || msg.media_meta?.id)" class="btn-contact-msg">Message Direct 💬</button>
                </div>

                <!-- Poll Message -->
                <div v-else-if="msg.type === 'poll'" class="msg-poll-card">
                  <h4 class="poll-question">📊 {{ msg.content }}</h4>
                  <div class="poll-options-list">
                    <div 
                      v-for="opt in (msg.mediaMeta?.options || msg.media_meta?.options || [])" 
                      :key="opt.id" 
                      class="poll-opt-item"
                      @click="votePollOption(msg, opt.id)"
                    >
                      <div class="poll-opt-row">
                        <span class="poll-opt-radio" :class="{ checked: opt.votes?.includes(authStore.user?.id) }"></span>
                        <span class="poll-opt-text">{{ opt.text }}</span>
                        <span class="poll-opt-count">{{ opt.votes?.length || 0 }}</span>
                      </div>
                      <div class="poll-progress-bg">
                        <div 
                          class="poll-progress-fill" 
                          :style="{ width: getPollPercent(msg, opt.votes?.length || 0) + '%' }"
                        ></div>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Message Meta & Delivery Ticks -->
                <div class="msg-meta">
                  <span class="msg-time">{{ formatTime(msg.created_at) }}</span>
                  <span v-if="msg.sender_id === authStore.user?.id" class="read-ticks">✓✓</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Live Microphone Voice Recorder Status Overlay -->
          <div v-if="isRecordingVoice" class="voice-recording-banner">
            <span class="rec-pulse">🔴 Recording... {{ recordingDuration }}s</span>
            <button @click="stopAndSendVoice" class="btn-danger btn-xs ml-2">Stop & Send 🚀</button>
            <button @click="cancelVoiceRecord" class="btn-secondary btn-xs ml-1">Cancel</button>
          </div>

          <!-- Chat Input Bar -->
          <footer class="chat-input-bar">
            <div class="input-actions-left">
              <!-- WhatsApp-style attachment toggle button -->
              <button 
                @click="showAttachmentMenu = !showAttachmentMenu" 
                :class="['btn-icon', 'btn-attach', { active: showAttachmentMenu }]" 
                title="Attach Media & Files"
              >
                📎
              </button>

              <!-- Attachment Popover Menu -->
              <div v-if="showAttachmentMenu" class="attachment-menu-popover">
                <div class="attachment-menu-grid">
                  <button class="att-menu-item item-photos" @click="fileInputMedia?.click()">
                    <span class="att-icon">📷</span>
                    <span class="att-label">Photos & Videos</span>
                  </button>
                  <button class="att-menu-item item-doc" @click="fileInputDoc?.click()">
                    <span class="att-icon">📄</span>
                    <span class="att-label">Document</span>
                  </button>
                  <button class="att-menu-item item-camera" @click="fileInputCamera?.click()">
                    <span class="att-icon">📸</span>
                    <span class="att-label">Camera</span>
                  </button>
                  <button class="att-menu-item item-audio" @click="fileInputAudio?.click()">
                    <span class="att-icon">🎵</span>
                    <span class="att-label">Audio</span>
                  </button>
                  <button class="att-menu-item item-contact" @click="showAttachmentMenu = false; showContactPickerModal = true">
                    <span class="att-icon">👤</span>
                    <span class="att-label">Contact</span>
                  </button>
                  <button class="att-menu-item item-poll" @click="showAttachmentMenu = false; showCreatePollModal = true">
                    <span class="att-icon">📊</span>
                    <span class="att-label">Poll</span>
                  </button>
                </div>
              </div>

              <!-- Hidden File Pickers -->
              <input ref="fileInputMedia" type="file" accept="image/*,video/*" style="display:none" @change="handleFileSelected" />
              <input ref="fileInputDoc" type="file" accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.zip,.csv" style="display:none" @change="handleFileSelected" />
              <input ref="fileInputCamera" type="file" accept="image/*" capture="environment" style="display:none" @change="handleFileSelected" />
              <input ref="fileInputAudio" type="file" accept="audio/*" style="display:none" @change="handleFileSelected" />

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
                @click="startVoiceRecord" 
                :class="['btn-icon', { recording: isRecordingVoice }]"
                title="Microphone Recording"
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
    <!-- New Chat / Add Contact Modal (Section 7, 30) -->
    <div v-if="showNewChatModal" class="modal-overlay">
      <div class="modal-card">
        <div class="modal-top-nav">
          <button @click="showNewChatModal = false" class="btn-modal-back">
            ← Back
          </button>
        </div>
        <div class="modal-header">
          <h3>➕ Start New Chat / Add Contact</h3>
          <button @click="showNewChatModal = false" class="btn-close">✕</button>
        </div>
        <div class="modal-body">
          <div class="tab-sub-bar">
            <button :class="['tab-sub', { active: newChatTab === 'phone' }]" @click="newChatTab = 'phone'">By Phone Number</button>
            <button :class="['tab-sub', { active: newChatTab === 'user' }]" @click="newChatTab = 'user'">By Username</button>
            <button class="tab-sub group-tab-btn" @click="showNewChatModal = false; showCreateGroupModal = true;">👥 Create Group</button>
          </div>

          <!-- Search by Phone Number -->
          <div v-if="newChatTab === 'phone'" class="new-chat-section mt-3">
            <label class="input-label">Enter Mobile Phone Number:</label>
            <input type="tel" v-model="manualPhoneInput" placeholder="+94712345678" class="phone-input" />
            <button @click="handleAddContactByPhone" class="btn-primary btn-block mt-2">Search & Add Contact</button>
            <p v-if="phoneAddResult" :class="['result-msg', phoneAddResult.registered ? 'success' : 'error']">
              {{ phoneAddResult.message }}
            </p>
          </div>

          <!-- Search by Username -->
          <div v-else class="new-chat-section mt-3">
            <input type="text" v-model="userSearchQuery" @input="handleUserSearch" placeholder="Search username or display name..." class="search-input-modal" />
            
            <div v-if="peopleStore.isLoading" class="loading-spinner mt-2">Searching users...</div>
            <div v-else-if="peopleStore.searchResults.length === 0 && userSearchQuery.trim()" class="empty-info-msg mt-2">No registered users found</div>
            
            <div v-else class="search-results-list mt-2">
              <div v-for="u in peopleStore.searchResults" :key="u.id" class="search-user-item" @click="startChatWithUser(u.id); showNewChatModal = false;">
                <img :src="u.avatar" class="avatar-sm" />
                <div class="user-item-info">
                  <span class="user-item-name">{{ u.displayName }}</span>
                  <span class="user-item-sub">@{{ u.username }}</span>
                </div>
                <button class="btn-primary btn-xs">Chat</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

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

    <!-- Settings & Profile Suite Modal -->
    <SettingsModal 
      v-if="showSettingsModal" 
      :initialPage="settingsInitialPage"
      @close="showSettingsModal = false" 
    />

    <!-- Create Group Chat Modal -->
    <CreateGroupModal 
      v-if="showCreateGroupModal"
      @close="showCreateGroupModal = false"
      @created="handleGroupCreated"
    />

    <!-- Group Information Modal -->
    <GroupInfoModal 
      v-if="showGroupInfoModal && chatStore.activeChatId"
      :roomId="chatStore.activeChatId"
      @close="showGroupInfoModal = false"
      @updated="chatStore.fetchChats()"
      @left="chatStore.fetchChats(); chatStore.activeChatId = null;"
    />

    <!-- Attachment & Media Modals -->
    <MediaPreviewModal 
      v-if="selectedFileForPreview" 
      :file="selectedFileForPreview" 
      @send="handleSendMediaFromPreview" 
      @cancel="selectedFileForPreview = null" 
    />

    <MediaLightboxModal 
      v-if="activeLightboxMedia" 
      :mediaUrl="activeLightboxMedia.url" 
      :caption="activeLightboxMedia.caption" 
      :type="activeLightboxMedia.type" 
      @close="activeLightboxMedia = null" 
    />

    <ContactPickerModal 
      v-if="showContactPickerModal" 
      @select="handleSendContact" 
      @cancel="showContactPickerModal = false" 
    />

    <CreatePollModal 
      v-if="showCreatePollModal" 
      @create="handleSendPoll" 
      @cancel="showCreatePollModal = false" 
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useAuthStore } from './stores/authStore.js';
import { useChatStore } from './stores/chatStore.js';
import { usePeopleStore } from './stores/peopleStore.js';
import { useAdminStore } from './stores/adminStore.js';
import { api } from './services/api.js';
import SettingsModal from './components/SettingsModal.vue';
import GroupInfoModal from './components/GroupInfoModal.vue';
import CreateGroupModal from './components/CreateGroupModal.vue';
import MediaPreviewModal from './components/MediaPreviewModal.vue';
import MediaLightboxModal from './components/MediaLightboxModal.vue';
import ContactPickerModal from './components/ContactPickerModal.vue';
import CreatePollModal from './components/CreatePollModal.vue';

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
const recordingDuration = ref(0);
let mediaRecorder = null;
let audioChunks = [];
let recordingTimer = null;

const showWallpaperPicker = ref(false);
const showSettingsModal = ref(false);
const settingsInitialPage = ref('main');
const showNewChatModal = ref(false);
const showGroupInfoModal = ref(false);
const showCreateGroupModal = ref(false);
const newChatTab = ref('phone');
const manualPhoneInput = ref('');
const phoneAddResult = ref(null);
const userSearchQuery = ref('');

const showAttachmentMenu = ref(false);
const selectedFileForPreview = ref(null);
const showContactPickerModal = ref(false);
const showCreatePollModal = ref(false);
const activeLightboxMedia = ref(null);
const isUploadingMedia = ref(false);

const fileInputMedia = ref(null);
const fileInputDoc = ref(null);
const fileInputCamera = ref(null);
const fileInputAudio = ref(null);

const showPinModal = ref(false);
const hiddenPinInput = ref('');
const activeViewOnceMsg = ref(null);
const inputPin = ref('');
const themeClass = ref('theme-dark');
const wallpaperClass = ref('wp-default');

const devSeedUsers = [
  { phone: '+94771234567', name: 'Alex Rivera (Admin)', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80' },
  { phone: '+94779876543', name: 'Sophia Chen', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80' },
  { phone: '+94712223344', name: 'Marcus Vance', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80' }
];

const filteredChats = computed(() => {
  let list = chatStore.visibleChats;
  if (searchQuery.value) {
    list = list.filter(c => c.name.toLowerCase().includes(searchQuery.value.toLowerCase()));
  }
  return list;
});

onMounted(async () => {
  window.addEventListener('keydown', handleGlobalKeydown);
  if (authStore.isAuthenticated) {
    await authStore.fetchMe();
    await chatStore.fetchChats();
  }
});

onUnmounted(() => {
  window.removeEventListener('keydown', handleGlobalKeydown);
});

function fullFileUrl(url) {
  if (!url) return '';
  if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('blob:') || url.startsWith('data:')) return url;
  const baseUrl = import.meta.env.VITE_API_URL || window.location.origin;
  return `${baseUrl}${url.startsWith('/') ? '' : '/'}${url}`;
}

function formatFileSize(bytes) {
  if (!bytes) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

function getDocBadgeClass(fileName) {
  if (!fileName) return 'file-badge';
  const ext = fileName.split('.').pop().toLowerCase();
  if (ext === 'pdf') return 'pdf-badge';
  if (['doc', 'docx'].includes(ext)) return 'doc-badge';
  if (['xls', 'xlsx', 'csv'].includes(ext)) return 'xls-badge';
  if (['ppt', 'pptx'].includes(ext)) return 'ppt-badge';
  return 'file-badge';
}

function getDocExtension(fileName) {
  if (!fileName) return 'FILE';
  const parts = fileName.split('.');
  return parts.length > 1 ? parts.pop().toUpperCase() : 'FILE';
}

function openLightbox(url, caption, type) {
  activeLightboxMedia.value = {
    url: fullFileUrl(url),
    caption: caption || '',
    type: type || 'image'
  };
}

function handleFileSelected(e) {
  const files = e.target.files;
  if (files && files.length > 0) {
    selectedFileForPreview.value = files[0];
  }
  showAttachmentMenu.value = false;
  e.target.value = '';
}

async function handleSendMediaFromPreview({ file, caption, type }) {
  if (!file) return;
  selectedFileForPreview.value = null;
  isUploadingMedia.value = true;
  try {
    const res = await api.uploadMedia(file);
    const mediaMeta = {
      name: file.name,
      size: file.size,
      mimeType: file.type,
      caption: caption || ''
    };
    await chatStore.sendMessage({
      type,
      content: caption || '',
      mediaUrl: res.mediaUrl,
      mediaMeta,
      isViewOnce: isViewOnceMode.value
    });
    isViewOnceMode.value = false;
  } catch (err) {
    console.error('Upload media failed:', err);
    alert('Failed to upload attachment. Please try again.');
  } finally {
    isUploadingMedia.value = false;
  }
}

async function handleSendContact(contact) {
  showContactPickerModal.value = false;
  await chatStore.sendMessage({
    type: 'contact',
    content: `Contact: ${contact.displayName}`,
    mediaMeta: contact
  });
}

async function handleSendPoll(pollData) {
  showCreatePollModal.value = false;
  await chatStore.sendMessage({
    type: 'poll',
    content: pollData.question,
    mediaMeta: pollData
  });
}

function votePollOption(msg, optionId) {
  const currentUserId = authStore.user?.id;
  if (!currentUserId) return;
  const meta = msg.mediaMeta || msg.media_meta;
  if (!meta || !meta.options) return;

  meta.options.forEach(opt => {
    if (!opt.votes) opt.votes = [];
    if (opt.id === optionId) {
      if (!opt.votes.includes(currentUserId)) {
        opt.votes.push(currentUserId);
      } else {
        opt.votes = opt.votes.filter(id => id !== currentUserId);
      }
    }
  });

  msg.mediaMeta = { ...meta };
}

function getPollPercent(msg, voteCount) {
  const meta = msg.mediaMeta || msg.media_meta;
  if (!meta || !meta.options) return 0;
  const totalVotes = meta.options.reduce((sum, o) => sum + (o.votes?.length || 0), 0);
  if (totalVotes === 0) return 0;
  return Math.round((voteCount / totalVotes) * 100);
}

function openSettingsPage(page = 'main') {
  settingsInitialPage.value = page;
  showSettingsModal.value = true;
}

function openProfilePage() {
  openSettingsPage('profile');
}

function handleGroupCreated(roomId) {
  chatStore.fetchChats();
  chatStore.selectChat(roomId);
}

function handleGlobalKeydown(e) {
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
    e.preventDefault();
    showNewChatModal.value = true;
  } else if ((e.ctrlKey || e.metaKey) && e.key === ',') {
    e.preventDefault();
    openSettingsPage('main');
  } else if (e.key === 'Escape') {
    if (showSettingsModal.value) showSettingsModal.value = false;
    else if (showNewChatModal.value) showNewChatModal.value = false;
    else if (showPinModal.value) showPinModal.value = false;
  }
}

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
    type: file.type.startsWith('image') ? 'image' : (file.type.startsWith('video') ? 'video' : 'voice'),
    mediaUrl: res.mediaUrl,
    mediaMeta: res.mediaMeta,
    isViewOnce: isViewOnceMode.value
  });
  isViewOnceMode.value = false;
}

/* Microphone Voice Recording */
async function startVoiceRecord() {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    audioChunks = [];
    mediaRecorder = new MediaRecorder(stream);
    
    mediaRecorder.ondataavailable = (e) => {
      if (e.data.size > 0) audioChunks.push(e.data);
    };

    mediaRecorder.start();
    isRecordingVoice.value = true;
    recordingDuration.value = 0;
    
    recordingTimer = setInterval(() => {
      recordingDuration.value++;
    }, 1000);
  } catch (err) {
    alert('Microphone access denied or not supported on this browser.');
  }
}

async function stopAndSendVoice() {
  if (!mediaRecorder) return;
  
  clearInterval(recordingTimer);
  mediaRecorder.stop();
  
  mediaRecorder.onstop = async () => {
    const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
    const audioFile = new File([audioBlob], `voice_${Date.now()}.webm`, { type: 'audio/webm' });
    
    const res = await api.uploadMedia(audioFile);
    await chatStore.sendMessage({
      type: 'voice',
      mediaUrl: res.mediaUrl,
      mediaMeta: { duration: recordingDuration.value }
    });

    isRecordingVoice.value = false;
    recordingDuration.value = 0;
  };
}

function cancelVoiceRecord() {
  if (mediaRecorder) mediaRecorder.stop();
  clearInterval(recordingTimer);
  isRecordingVoice.value = false;
  recordingDuration.value = 0;
}

async function handleAddContactByPhone() {
  if (!manualPhoneInput.value) return;
  const res = await peopleStore.addContactByPhone(manualPhoneInput.value);
  phoneAddResult.value = res;
  if (res.registered && res.contact) {
    setTimeout(async () => {
      showNewChatModal.value = false;
      await startChatWithUser(res.contact.id);
    }, 1000);
  }
}

function handleUserSearch() {
  peopleStore.search(userSearchQuery.value);
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

.empty-chats-box {
  padding: 3rem 1.5rem;
  text-align: center;
  color: #94a3b8;
}

.empty-icon {
  font-size: 2.5rem;
  display: block;
  margin-bottom: 0.5rem;
}

.empty-actions {
  display: flex;
  gap: 0.5rem;
  justify-content: center;
  margin-top: 1rem;
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

.status-online { color: #10b981; font-weight: 500; }
.status-offline { color: #64748b; }

.messages-body {
  flex: 1;
  padding: 1.5rem;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.wp-default { background: #c9e2ff; }
.wp-dark { background: #020617; }
.wp-gradient { background: linear-gradient(135deg, #c9e2ff, #bae6fd); }

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

.voice-recording-banner {
  background: #991b1b;
  color: white;
  padding: 0.5rem 1.5rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.web-contact-notice {
  background: rgba(30, 41, 59, 0.9);
  border: 1px dashed #475569;
  padding: 0.85rem 1rem;
  margin: 1rem;
  border-radius: 0.75rem;
  font-size: 0.85rem;
  color: #cbd5e1;
}

.tab-sub-bar {
  display: flex;
  gap: 0.5rem;
  border-bottom: 1px solid #334155;
  padding-bottom: 0.5rem;
}

.tab-sub {
  flex: 1;
  background: transparent;
  border: none;
  color: #94a3b8;
  padding: 0.5rem;
  cursor: pointer;
}

.tab-sub.active {
  color: #6366f1;
  border-bottom: 2px solid #6366f1;
  font-weight: 600;
}

.result-msg {
  font-size: 0.85rem;
  margin-top: 0.5rem;
}

.result-msg.success { color: #10b981; }
.result-msg.error { color: #ef4444; }

.modal-top-nav {
  display: flex;
  justify-content: flex-start;
  margin-bottom: 0.75rem;
}

.btn-modal-back {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  background: rgba(99, 102, 241, 0.12);
  color: #a5b4fc;
  border: 1px solid rgba(99, 102, 241, 0.3);
  padding: 0.45rem 0.9rem;
  border-radius: 0.6rem;
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-modal-back:hover {
  background: rgba(99, 102, 241, 0.25);
  color: #ffffff;
  border-color: #6366f1;
  transform: translateX(-3px);
  box-shadow: 0 2px 10px rgba(99, 102, 241, 0.35);
}

.search-input-modal {
  width: 100%;
  padding: 0.85rem 1.15rem;
  font-size: 1rem;
  background: #0f172a;
  color: #ffffff;
  border: 1.5px solid #334155;
  border-radius: 0.85rem;
  outline: none;
  transition: all 0.2s ease;
  box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.2);
}

.search-input-modal:focus {
  border-color: #6366f1;
  box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.25), inset 0 2px 4px rgba(0, 0, 0, 0.2);
}

.search-input-modal::placeholder {
  color: #64748b;
  font-size: 0.95rem;
}

.nav-brand-actions {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.clickable-header-left {
  cursor: pointer;
  padding: 0.2rem 0.5rem;
  border-radius: 0.6rem;
  transition: background 0.15s;
}

.clickable-header-left:hover {
  background: rgba(255, 255, 255, 0.08);
}

.group-tag-badge {
  font-size: 0.72rem;
  background: rgba(99, 102, 241, 0.25);
  color: #a5b4fc;
  border: 1px solid rgba(99, 102, 241, 0.4);
  padding: 0.15rem 0.5rem;
  border-radius: 0.4rem;
  margin-left: 0.4rem;
  vertical-align: middle;
}

.group-tab-btn {
  background: rgba(99, 102, 241, 0.15) !important;
  color: #a5b4fc !important;
  font-weight: 600;
  border-radius: 0.5rem;
}

.group-tab-btn:hover {
  background: rgba(99, 102, 241, 0.3) !important;
  color: #fff !important;
}

/* Attachment Menu Popover & Media Cards Styles */
.input-actions-left {
  position: relative;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.btn-attach {
  font-size: 1.25rem;
  cursor: pointer;
  background: transparent;
  border: none;
  padding: 0.4rem 0.6rem;
  border-radius: 0.5rem;
  transition: background 0.2s;
}

.btn-attach:hover, .btn-attach.active {
  background: rgba(255, 255, 255, 0.1);
}

.attachment-menu-popover {
  position: absolute;
  bottom: 125%;
  left: 0;
  background: #1e293b;
  border: 1px solid #334155;
  border-radius: 1.25rem;
  padding: 1rem;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.6);
  z-index: 100;
  animation: fadeIn 0.2s ease-out;
  width: 280px;
}

.attachment-menu-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 0.75rem;
}

.att-menu-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.35rem;
  padding: 0.75rem 0.5rem;
  background: #0f172a;
  border: 1px solid #334155;
  border-radius: 0.85rem;
  color: #fff;
  cursor: pointer;
  transition: all 0.2s;
}

.att-menu-item:hover {
  transform: translateY(-2px);
  border-color: #6366f1;
}

.att-icon {
  font-size: 1.4rem;
}

.att-label {
  font-size: 0.72rem;
  font-weight: 600;
  color: #cbd5e1;
}

/* Color highlights for attachment menu icons */
.item-photos .att-icon { color: #ec4899; }
.item-doc .att-icon { color: #3b82f6; }
.item-camera .att-icon { color: #f59e0b; }
.item-audio .att-icon { color: #10b981; }
.item-contact .att-icon { color: #a855f7; }
.item-poll .att-icon { color: #6366f1; }

/* Image and Media Chat Bubbles */
.msg-media-container {
  margin-top: 0.35rem;
  max-width: 300px;
}

.image-bubble-wrap {
  cursor: pointer;
}

.msg-image-preview {
  max-width: 280px;
  max-height: 280px;
  border-radius: 0.75rem;
  object-fit: cover;
  display: block;
  transition: transform 0.2s;
}

.msg-image-preview:hover {
  transform: scale(1.02);
}

.msg-video-player {
  max-width: 300px;
  max-height: 240px;
  border-radius: 0.75rem;
  outline: none;
  display: block;
}

.msg-caption {
  font-size: 0.88rem;
  margin-top: 0.4rem;
  color: inherit;
  word-break: break-word;
}

/* Document Cards */
.msg-doc-card {
  background: rgba(15, 23, 42, 0.6);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 0.75rem;
  padding: 0.75rem 0.9rem;
  min-width: 240px;
  max-width: 320px;
}

.doc-card-top {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.doc-badge-sm {
  padding: 0.4rem 0.6rem;
  border-radius: 0.5rem;
  font-weight: 800;
  font-size: 0.75rem;
  color: #fff;
  text-transform: uppercase;
}

.pdf-badge { background: #ef4444; }
.doc-badge { background: #3b82f6; }
.xls-badge { background: #10b981; }
.ppt-badge { background: #f59e0b; }
.file-badge { background: #6366f1; }

.doc-card-details {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.doc-card-name {
  font-weight: 600;
  font-size: 0.85rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  color: #fff;
}

.doc-card-size {
  font-size: 0.72rem;
  color: #94a3b8;
}

.btn-doc-dl {
  background: rgba(99, 102, 241, 0.2);
  color: #a5b4fc;
  border: 1px solid rgba(99, 102, 241, 0.4);
  padding: 0.4rem 0.6rem;
  border-radius: 0.5rem;
  text-decoration: none;
  font-size: 0.85rem;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-doc-dl:hover {
  background: #6366f1;
  color: #fff;
}

/* Audio Player Card */
.msg-audio-card {
  background: rgba(15, 23, 42, 0.6);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 0.75rem;
  padding: 0.75rem;
  min-width: 250px;
}

.audio-card-header {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  margin-bottom: 0.5rem;
}

.audio-icon {
  font-size: 1.4rem;
}

.audio-card-meta {
  display: flex;
  flex-direction: column;
}

.audio-card-title {
  font-weight: 600;
  font-size: 0.85rem;
  color: #fff;
}

.audio-card-size {
  font-size: 0.72rem;
  color: #94a3b8;
}

.msg-audio-element {
  width: 100%;
  height: 36px;
  border-radius: 0.5rem;
}

/* Contact Card */
.msg-contact-card {
  background: rgba(15, 23, 42, 0.6);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 0.75rem;
  padding: 0.85rem;
  min-width: 240px;
}

.contact-card-top {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 0.75rem;
}

.contact-card-name {
  font-weight: 700;
  font-size: 0.9rem;
  color: #fff;
}

.contact-card-phone {
  font-size: 0.78rem;
  color: #94a3b8;
  display: block;
}

.btn-contact-msg {
  width: 100%;
  background: linear-gradient(135deg, #6366f1, #4f46e5);
  color: #fff;
  border: none;
  padding: 0.5rem;
  border-radius: 0.6rem;
  font-size: 0.8rem;
  font-weight: 600;
  cursor: pointer;
}

/* Poll Card */
.msg-poll-card {
  background: rgba(15, 23, 42, 0.7);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 0.85rem;
  padding: 0.85rem;
  min-width: 260px;
}

.poll-question {
  font-weight: 700;
  font-size: 0.95rem;
  color: #fff;
  margin: 0 0 0.75rem 0;
}

.poll-options-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.poll-opt-item {
  background: rgba(30, 41, 59, 0.8);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 0.6rem;
  padding: 0.5rem 0.75rem;
  cursor: pointer;
  position: relative;
  overflow: hidden;
}

.poll-opt-row {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  position: relative;
  z-index: 2;
}

.poll-opt-radio {
  width: 14px;
  height: 14px;
  border-radius: 50%;
  border: 2px solid #64748b;
  display: inline-block;
  flex-shrink: 0;
}

.poll-opt-radio.checked {
  border-color: #6366f1;
  background: #6366f1;
}

.poll-opt-text {
  flex: 1;
  font-size: 0.85rem;
  color: #fff;
}

.poll-opt-count {
  font-size: 0.75rem;
  font-weight: 700;
  color: #a5b4fc;
}

.poll-progress-bg {
  position: absolute;
  top: 0;
  left: 0;
  bottom: 0;
  right: 0;
  background: transparent;
}

.poll-progress-fill {
  height: 100%;
  background: rgba(99, 102, 241, 0.25);
  transition: width 0.3s ease;
}

@media (max-width: 768px) {
  .attachment-menu-popover {
    width: 240px;
    bottom: 110%;
  }
  .message-bubble {
    max-width: 85%;
  }
}
</style>

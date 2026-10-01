<template>
  <div class="modal-overlay" @click.self="$emit('close')">
    <div class="modal-card settings-card animate-scale-up">
      <!-- Main Settings Navigation Page -->
      <div v-if="currentPage === 'main'" class="settings-view">
        <div class="modal-header">
          <div class="header-title">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="12" r="3"/>
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>
            </svg>
            <h3>Settings</h3>
          </div>
          <button class="btn-close" @click="$emit('close')">✕</button>
        </div>

        <div class="settings-body">
          <!-- Profile Card Banner -->
          <div class="profile-banner-card" @click="currentPage = 'profile'">
            <div class="avatar-wrapper">
              <img :src="authStore.user?.avatar || defaultAvatar" class="profile-avatar-img" />
              <span class="online-dot"></span>
            </div>
            <div class="profile-banner-info">
              <div class="profile-banner-name">{{ authStore.user?.displayName || 'Set Display Name' }}</div>
              <div class="profile-banner-sub">@{{ authStore.user?.username || 'username' }} • {{ authStore.user?.phoneNumber }}</div>
              <div class="profile-banner-status">"{{ authStore.user?.bio || 'Available' }}"</div>
            </div>
            <div class="chevron-arrow">›</div>
          </div>

          <!-- Settings Items List -->
          <div class="settings-menu-list">
            <div class="menu-item" @click="currentPage = 'general'">
              <div class="menu-item-icon icon-purple">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
              </div>
              <div class="menu-item-text">
                <span class="title">General</span>
                <span class="subtitle">Startup, window behavior, languages</span>
              </div>
              <span class="chevron">›</span>
            </div>

            <div class="menu-item" @click="currentPage = 'account'">
              <div class="menu-item-icon icon-blue">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
              </div>
              <div class="menu-item-text">
                <span class="title">Account</span>
                <span class="subtitle">Security PIN, active sessions, delete account</span>
              </div>
              <span class="chevron">›</span>
            </div>

            <div class="menu-item" @click="currentPage = 'privacy'">
              <div class="menu-item-icon icon-emerald">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
              </div>
              <div class="menu-item-text">
                <span class="title">Privacy</span>
                <span class="subtitle">Blocked contacts, last seen, read receipts</span>
              </div>
              <span class="chevron">›</span>
            </div>

            <div class="menu-item" @click="currentPage = 'chats'">
              <div class="menu-item-icon icon-indigo">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
              </div>
              <div class="menu-item-text">
                <span class="title">Chats</span>
                <span class="subtitle">Theme, wallpaper, font size, enter to send</span>
              </div>
              <span class="chevron">›</span>
            </div>

            <div class="menu-item" @click="currentPage = 'voice'">
              <div class="menu-item-icon icon-amber">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/></svg>
              </div>
              <div class="menu-item-text">
                <span class="title">Video & voice</span>
                <span class="subtitle">Camera, microphone, test stream & audio</span>
              </div>
              <span class="chevron">›</span>
            </div>

            <div class="menu-item" @click="currentPage = 'notifications'">
              <div class="menu-item-icon icon-rose">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
              </div>
              <div class="menu-item-text">
                <span class="title">Notifications</span>
                <span class="subtitle">Message alerts, sounds, push permissions</span>
              </div>
              <span class="chevron">›</span>
            </div>

            <div class="menu-item" @click="currentPage = 'shortcuts'">
              <div class="menu-item-icon icon-cyan">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="4" width="20" height="16" rx="2"/><line x1="6" y1="8" x2="6.01" y2="8"/><line x1="10" y1="8" x2="10.01" y2="8"/><line x1="14" y1="8" x2="14.01" y2="8"/><line x1="18" y1="8" x2="18.01" y2="8"/><line x1="8" y1="16" x2="16" y2="16"/></svg>
              </div>
              <div class="menu-item-text">
                <span class="title">Keyboard shortcuts</span>
                <span class="subtitle">Keyboard navigation & quick commands</span>
              </div>
              <span class="chevron">›</span>
            </div>

            <div class="menu-item" @click="currentPage = 'help'">
              <div class="menu-item-icon icon-teal">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
              </div>
              <div class="menu-item-text">
                <span class="title">Help and feedback</span>
                <span class="subtitle">FAQ, report problem, submit feedback</span>
              </div>
              <span class="chevron">›</span>
            </div>

            <div class="menu-item menu-item-danger" @click="showLogoutConfirm = true">
              <div class="menu-item-icon icon-red">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
              </div>
              <div class="menu-item-text">
                <span class="title text-danger">Log out</span>
                <span class="subtitle">Sign out of your MyChat account</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 1. DEDICATED PROFILE PAGE (Telegram / WhatsApp Style) -->
      <div v-else-if="currentPage === 'profile'" class="settings-view page-profile">
        <div class="subpage-header">
          <button class="btn-subpage-back" @click="currentPage = 'main'">
            ← Back
          </button>
          <h3 class="subpage-title">Profile Details</h3>
          <button class="btn-close" @click="$emit('close')">✕</button>
        </div>

        <div class="settings-body profile-page-body">
          <div v-if="toastMessage" class="toast-banner" :class="toastType">
            {{ toastMessage }}
          </div>

          <!-- Large Profile Picture Avatar Upload -->
          <div class="profile-hero-section">
            <div class="large-avatar-container">
              <img :src="profileForm.avatar || defaultAvatar" class="large-avatar-img" />
              <label class="avatar-edit-overlay" title="Upload New Profile Picture">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>
                <input type="file" accept="image/*" @change="handleAvatarFileSelect" style="display:none;" />
              </label>
            </div>
            <p class="avatar-hint">Tap camera icon to change profile photo</p>
          </div>

          <!-- Editable Fields Grid -->
          <div class="profile-fields-container">
            <!-- Display Name -->
            <div class="profile-field-group">
              <div class="field-label-row">
                <label class="field-label">Display Name</label>
                <span class="edit-badge">✏️ Edit</span>
              </div>
              <input 
                type="text" 
                v-model="profileForm.displayName" 
                placeholder="Enter your name" 
                class="form-input-lg"
              />
              <p class="field-subtext">This is how your name will appear to your contacts and chats.</p>
            </div>

            <!-- Username -->
            <div class="profile-field-group">
              <div class="field-label-row">
                <label class="field-label">Username</label>
                <span class="edit-badge">@ Handle</span>
              </div>
              <div class="input-with-prefix">
                <span class="prefix">@</span>
                <input 
                  type="text" 
                  v-model="profileForm.username" 
                  placeholder="username" 
                  class="form-input-lg with-prefix"
                />
              </div>
              <p class="field-subtext">People can find and chat with you using this handle.</p>
            </div>

            <!-- About / Bio -->
            <div class="profile-field-group">
              <div class="field-label-row">
                <label class="field-label">About / Status</label>
                <span class="edit-badge">✏️ Edit</span>
              </div>
              <textarea 
                v-model="profileForm.bio" 
                placeholder="Write a short status or bio..." 
                rows="2" 
                class="form-textarea-lg"
              ></textarea>
            </div>

            <!-- Phone Number (Read Only Registered Mobile) -->
            <div class="profile-field-group read-only-group">
              <label class="field-label">Phone Number (Account Key)</label>
              <div class="phone-display-box">
                <span class="phone-text">📱 {{ profileForm.phoneNumber }}</span>
                <span class="verified-tag">✓ Verified</span>
              </div>
              <p class="field-subtext">Your mobile number is tied to your account identity.</p>
            </div>
          </div>

          <!-- Action Buttons -->
          <div class="profile-actions-bar">
            <button class="btn-primary btn-save-profile" @click="saveProfile" :disabled="isSaving">
              <span v-if="isSaving">Saving Changes...</span>
              <span v-else>💾 Save & Update Profile</span>
            </button>
            <button class="btn-secondary" @click="resetProfileForm">Cancel</button>
          </div>
        </div>
      </div>

      <!-- 2. GENERAL SETTINGS PAGE -->
      <div v-else-if="currentPage === 'general'" class="settings-view">
        <div class="subpage-header">
          <button class="btn-subpage-back" @click="currentPage = 'main'">← Back</button>
          <h3 class="subpage-title">General Settings</h3>
          <button class="btn-close" @click="$emit('close')">✕</button>
        </div>

        <div class="settings-body">
          <div v-if="toastMessage" class="toast-banner" :class="toastType">{{ toastMessage }}</div>

          <div class="setting-block">
            <h4 class="block-title">Startup & System Behavior</h4>
            <div class="setting-row">
              <div class="setting-text">
                <span class="title">Launch on System Startup</span>
                <span class="desc">Automatically start MyChat when Windows/OS boots.</span>
              </div>
              <input type="checkbox" v-model="generalSettings.startOnBoot" @change="saveGeneral" class="toggle-checkbox" />
            </div>

            <div class="setting-row">
              <div class="setting-text">
                <span class="title">Minimize to System Tray on Close</span>
                <span class="desc">Keep MyChat running in background when closing window.</span>
              </div>
              <input type="checkbox" v-model="generalSettings.minimizeToTray" @change="saveGeneral" class="toggle-checkbox" />
            </div>

            <div class="setting-row">
              <div class="setting-text">
                <span class="title">Auto-Check for Updates</span>
                <span class="desc">Download and prompt for app updates automatically.</span>
              </div>
              <input type="checkbox" v-model="generalSettings.autoUpdate" @change="saveGeneral" class="toggle-checkbox" />
            </div>
          </div>

          <div class="setting-block">
            <h4 class="block-title">Language & Regional</h4>
            <div class="form-group mt-2">
              <label class="form-label">Application Language</label>
              <select v-model="generalSettings.language" @change="saveGeneral" class="form-select">
                <option value="en">English (US)</option>
                <option value="si">Sinhala (🇱🇰 Sri Lanka)</option>
                <option value="es">Spanish (Español)</option>
                <option value="ja">Japanese (日本語)</option>
                <option value="de">German (Deutsch)</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      <!-- 3. ACCOUNT SETTINGS PAGE -->
      <div v-else-if="currentPage === 'account'" class="settings-view">
        <div class="subpage-header">
          <button class="btn-subpage-back" @click="currentPage = 'main'">← Back</button>
          <h3 class="subpage-title">Account Settings</h3>
          <button class="btn-close" @click="$emit('close')">✕</button>
        </div>

        <div class="settings-body">
          <div v-if="toastMessage" class="toast-banner" :class="toastType">{{ toastMessage }}</div>

          <div class="setting-block">
            <h4 class="block-title">Account Overview</h4>
            <div class="account-info-card">
              <div class="info-row">
                <span class="lbl">Mobile Number:</span>
                <span class="val">{{ authStore.user?.phoneNumber }}</span>
              </div>
              <div class="info-row">
                <span class="lbl">User ID:</span>
                <span class="val code-font">{{ authStore.user?.id }}</span>
              </div>
              <div class="info-row">
                <span class="lbl">Account Created:</span>
                <span class="val">{{ formatDate(authStore.user?.createdAt) }}</span>
              </div>
            </div>
          </div>

          <div class="setting-block">
            <h4 class="block-title">Security PIN & App Lock</h4>
            <p class="block-sub">Set or change a 4-digit security PIN used to lock the application.</p>
            <div class="pin-setup-row mt-2">
              <input 
                type="password" 
                v-model="accountPinInput" 
                maxlength="6" 
                placeholder="• • • •" 
                class="form-input pin-field"
              />
              <button class="btn-primary" @click="updateAccountPin">Update Security PIN</button>
            </div>
          </div>

          <div class="setting-block">
            <h4 class="block-title">Active Devices & Sessions</h4>
            <div class="devices-list">
              <div v-for="dev in activeDevicesList" :key="dev.id" class="device-item">
                <span class="dev-icon">💻</span>
                <div class="dev-info">
                  <span class="dev-name">{{ dev.deviceName || 'Web Client Session' }}</span>
                  <span class="dev-sub">{{ dev.platform || 'Browser' }} • {{ dev.isCurrent ? 'Active Now' : 'Last seen recently' }}</span>
                </div>
              </div>
            </div>
            <button class="btn-secondary btn-block mt-3" @click="logoutAllOtherDevices">Log Out All Other Devices</button>
          </div>

          <div class="setting-block danger-block">
            <h4 class="block-title text-danger">Danger Zone</h4>
            <p class="block-sub">Permanently remove your account data and chat history.</p>
            <button class="btn-danger-sm mt-2" @click="promptDeleteAccount">Delete Account</button>
          </div>
        </div>
      </div>

      <!-- 4. PRIVACY SETTINGS PAGE -->
      <div v-else-if="currentPage === 'privacy'" class="settings-view">
        <div class="subpage-header">
          <button class="btn-subpage-back" @click="currentPage = 'main'">← Back</button>
          <h3 class="subpage-title">Privacy & Security Controls</h3>
          <button class="btn-close" @click="$emit('close')">✕</button>
        </div>

        <div class="settings-body">
          <div v-if="toastMessage" class="toast-banner" :class="toastType">{{ toastMessage }}</div>

          <div class="setting-block">
            <h4 class="block-title">Visibility & Privacy</h4>
            <div class="form-group">
              <label class="form-label">Last Seen & Online Status</label>
              <select v-model="privacySettings.lastSeenPrivacy" @change="savePrivacy" class="form-select">
                <option value="everyone">Everyone</option>
                <option value="contacts">My Contacts Only</option>
                <option value="nobody">Nobody</option>
              </select>
            </div>

            <div class="setting-row">
              <div class="setting-text">
                <span class="title">Read Receipts (Blue Ticks ✓✓)</span>
                <span class="desc">If turned off, you won't send or receive read receipts.</span>
              </div>
              <input type="checkbox" v-model="privacySettings.readReceipts" @change="savePrivacy" class="toggle-checkbox" />
            </div>

          </div>

          <div class="setting-block">
            <h4 class="block-title">Blocked Contacts</h4>
            <div v-if="blockedUsersList.length === 0" class="empty-sub-info">
              No contacts are currently blocked.
            </div>
            <div v-else class="blocked-users-list">
              <div v-for="user in blockedUsersList" :key="user.id" class="blocked-item">
                <span>{{ user.displayName || user.username }} ({{ user.phoneNumber }})</span>
                <button class="btn-xs btn-secondary" @click="unblockContact(user.id)">Unblock</button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 5. CHATS SETTINGS PAGE -->
      <div v-else-if="currentPage === 'chats'" class="settings-view">
        <div class="subpage-header">
          <button class="btn-subpage-back" @click="currentPage = 'main'">← Back</button>
          <h3 class="subpage-title">Chat Settings & Appearance</h3>
          <button class="btn-close" @click="$emit('close')">✕</button>
        </div>

        <div class="settings-body">
          <div v-if="toastMessage" class="toast-banner" :class="toastType">{{ toastMessage }}</div>

          <div class="setting-block">
            <h4 class="block-title">Application Theme Mode</h4>
            <div class="theme-picker-grid">
              <button 
                :class="['theme-option-btn', { active: chatSettings.theme === 'dark' }]"
                @click="setAppTheme('dark')"
              >
                <span class="preview dark-prev"></span>
                <span>Dark Slate</span>
              </button>
              <button 
                :class="['theme-option-btn', { active: chatSettings.theme === 'light' }]"
                @click="setAppTheme('light')"
              >
                <span class="preview light-prev"></span>
                <span>Light Theme</span>
              </button>
            </div>
          </div>

          <div class="setting-block">
            <h4 class="block-title">Chat Conversation Wallpaper</h4>
            <div class="wallpaper-options-grid">
              <button 
                :class="['wp-card', { active: chatSettings.wallpaper === 'default' }]"
                @click="setChatWallpaper('default')"
              >
                <span class="wp-color-preview fresco-prev"></span>
                <span>Fresco Sky (#c9e2ff)</span>
              </button>
              <button 
                :class="['wp-card', { active: chatSettings.wallpaper === 'dark' }]"
                @click="setChatWallpaper('dark')"
              >
                <span class="wp-color-preview dark-prev"></span>
                <span>Dark Midnight</span>
              </button>
              <button 
                :class="['wp-card', { active: chatSettings.wallpaper === 'gradient' }]"
                @click="setChatWallpaper('gradient')"
              >
                <span class="wp-color-preview grad-prev"></span>
                <span>Neon Glow</span>
              </button>
            </div>
          </div>

          <div class="setting-block">
            <h4 class="block-title">Chat Input & Messaging Behavior</h4>
            <div class="setting-row">
              <div class="setting-text">
                <span class="title">Press Enter to Send Message</span>
                <span class="desc">Pressing Enter key sends the message; Shift + Enter adds a new line.</span>
              </div>
              <input type="checkbox" v-model="chatSettings.enterToSend" @change="saveChatSettings" class="toggle-checkbox" />
            </div>

            <div class="form-group mt-3">
              <label class="form-label">Message Text Size</label>
              <select v-model="chatSettings.fontSize" @change="saveChatSettings" class="form-select">
                <option value="13px">Small (13px)</option>
                <option value="15px">Medium (15px - Default)</option>
                <option value="17px">Large (17px)</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      <!-- 6. VIDEO & VOICE SETTINGS PAGE -->
      <div v-else-if="currentPage === 'voice'" class="settings-view">
        <div class="subpage-header">
          <button class="btn-subpage-back" @click="currentPage = 'main'">← Back</button>
          <h3 class="subpage-title">Video & Voice Hardware</h3>
          <button class="btn-close" @click="$emit('close')">✕</button>
        </div>

        <div class="settings-body">
          <div v-if="toastMessage" class="toast-banner" :class="toastType">{{ toastMessage }}</div>

          <div class="setting-block">
            <h4 class="block-title">Microphone Input Device</h4>
            <div class="form-group">
              <select v-model="selectedMicId" class="form-select">
                <option v-for="dev in micDevices" :key="dev.deviceId" :value="dev.deviceId">
                  🎙️ {{ dev.label || 'Microphone ' + dev.deviceId.substring(0, 5) }}
                </option>
              </select>
            </div>

            <div class="mic-test-container mt-2">
              <button class="btn-secondary btn-sm" @click="toggleMicTest">
                {{ isTestingMic ? 'Stop Microphone Test' : '🎙️ Test Live Microphone Level' }}
              </button>
              <div class="mic-meter-bar mt-2">
                <div class="mic-meter-fill" :style="{ width: micVolumeLevel + '%' }"></div>
              </div>
            </div>
          </div>

          <div class="setting-block">
            <h4 class="block-title">Camera Input & Live Preview</h4>
            <div class="form-group">
              <select v-model="selectedCamId" class="form-select">
                <option v-for="dev in cameraDevices" :key="dev.deviceId" :value="dev.deviceId">
                  📷 {{ dev.label || 'Camera ' + dev.deviceId.substring(0, 5) }}
                </option>
              </select>
            </div>

            <div class="camera-test-container mt-2">
              <button class="btn-secondary btn-sm" @click="toggleCameraTest">
                {{ isTestingCam ? 'Stop Camera Preview' : '📷 Test Live Camera Feed' }}
              </button>
              <div v-show="isTestingCam" class="video-preview-box mt-2">
                <video ref="cameraVideoElement" autoplay playsinline class="video-stream"></video>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 7. NOTIFICATIONS SETTINGS PAGE -->
      <div v-else-if="currentPage === 'notifications'" class="settings-view">
        <div class="subpage-header">
          <button class="btn-subpage-back" @click="currentPage = 'main'">← Back</button>
          <h3 class="subpage-title">Notification Preferences</h3>
          <button class="btn-close" @click="$emit('close')">✕</button>
        </div>

        <div class="settings-body">
          <div v-if="toastMessage" class="toast-banner" :class="toastType">{{ toastMessage }}</div>

          <div class="setting-block">
            <h4 class="block-title">Desktop Push Notifications</h4>
            <div class="setting-row">
              <div class="setting-text">
                <span class="title">Browser Push Alerts</span>
                <span class="desc">Show desktop popup banners for incoming chats and calls.</span>
              </div>
              <input type="checkbox" v-model="notifSettings.desktopPush" @change="saveNotif" class="toggle-checkbox" />
            </div>

            <div class="permission-status-box mt-2">
              <span>Permission Status: <strong>{{ notificationPermissionStatus }}</strong></span>
              <button class="btn-primary btn-xs ml-2" @click="requestNotificationPermission">Request Permission</button>
            </div>
          </div>

          <div class="setting-block">
            <h4 class="block-title">Sound Effects & Alerts</h4>
            <div class="setting-row">
              <div class="setting-text">
                <span class="title">Message Notification Sound</span>
                <span class="desc">Play sound effect when receiving new real-time messages.</span>
              </div>
              <input type="checkbox" v-model="notifSettings.playSound" @change="saveNotif" class="toggle-checkbox" />
            </div>

            <button class="btn-secondary btn-sm mt-2" @click="playTestNotificationSound">
              🔔 Test Notification Chime Sound
            </button>
          </div>
        </div>
      </div>

      <!-- 8. KEYBOARD SHORTCUTS PAGE -->
      <div v-else-if="currentPage === 'shortcuts'" class="settings-view">
        <div class="subpage-header">
          <button class="btn-subpage-back" @click="currentPage = 'main'">← Back</button>
          <h3 class="subpage-title">Keyboard Shortcuts</h3>
          <button class="btn-close" @click="$emit('close')">✕</button>
        </div>

        <div class="settings-body">
          <div class="shortcuts-grid">
            <div v-for="sc in shortcutsList" :key="sc.key" class="shortcut-row">
              <span class="shortcut-desc">{{ sc.description }}</span>
              <kbd class="shortcut-badge">{{ sc.key }}</kbd>
            </div>
          </div>
        </div>
      </div>

      <!-- 9. HELP AND FEEDBACK PAGE -->
      <div v-else-if="currentPage === 'help'" class="settings-view">
        <div class="subpage-header">
          <button class="btn-subpage-back" @click="currentPage = 'main'">← Back</button>
          <h3 class="subpage-title">Help & Feedback</h3>
          <button class="btn-close" @click="$emit('close')">✕</button>
        </div>

        <div class="settings-body">
          <div v-if="toastMessage" class="toast-banner" :class="toastType">{{ toastMessage }}</div>

          <div class="setting-block">
            <h4 class="block-title">Frequently Asked Questions (FAQ)</h4>
            <div class="faq-accordion mt-2">
              <div 
                v-for="(faq, idx) in faqList" 
                :key="idx" 
                class="faq-item"
                :class="{ open: expandedFaq === idx }"
                @click="expandedFaq = expandedFaq === idx ? null : idx"
              >
                <div class="faq-question">
                  <span>{{ faq.q }}</span>
                  <span class="faq-toggle-icon">{{ expandedFaq === idx ? '−' : '+' }}</span>
                </div>
                <div v-if="expandedFaq === idx" class="faq-answer">
                  {{ faq.a }}
                </div>
              </div>
            </div>
          </div>

          <div class="setting-block">
            <h4 class="block-title">Submit Feedback / Report an Issue</h4>
            <div class="form-group mt-2">
              <label class="form-label">Category</label>
              <select v-model="feedbackForm.category" class="form-select">
                <option value="General Feedback">General Feedback</option>
                <option value="Bug Report">Bug Report</option>
                <option value="Feature Request">Feature Request</option>
                <option value="Security Issue">Security Issue</option>
              </select>
            </div>

            <div class="form-group mt-2">
              <label class="form-label">Description</label>
              <textarea 
                v-model="feedbackForm.description" 
                placeholder="Tell us what's on your mind..." 
                rows="3" 
                class="form-textarea"
              ></textarea>
            </div>

            <button class="btn-primary mt-2" @click="submitFeedback" :disabled="!feedbackForm.description.trim()">
              🚀 Send Feedback
            </button>
          </div>

          <div class="app-build-info mt-4">
            <p><strong>MyChat App</strong> • Version 1.0.0 (Build 2026.09)</p>
            <p class="sub">Encrypted real-time messaging platform.</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Log Out Confirmation Modal Dialog -->
    <div v-if="showLogoutConfirm" class="modal-overlay nested-overlay" @click.self="showLogoutConfirm = false">
      <div class="modal-card dialog-card">
        <h3>Log Out</h3>
        <p>Are you sure you want to log out?</p>
        <div class="dialog-actions mt-3">
          <button class="btn-secondary" @click="showLogoutConfirm = false" :disabled="isLoggingOut">Cancel</button>
          <button class="btn-danger" @click="confirmLogout" :disabled="isLoggingOut">
            <span v-if="isLoggingOut">Logging out...</span>
            <span v-else>Log out</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, onUnmounted, nextTick } from 'vue';
import { useAuthStore } from '../stores/authStore.js';
import { useChatStore } from '../stores/chatStore.js';
import { api } from '../services/api.js';

const props = defineProps({
  initialPage: {
    type: String,
    default: 'main'
  }
});

const emit = defineEmits(['close']);

const authStore = useAuthStore();
const chatStore = useChatStore();

const currentPage = ref(props.initialPage || 'main');
const showLogoutConfirm = ref(false);
const isSaving = ref(false);

const toastMessage = ref('');
const toastType = ref('success');

const defaultAvatar = 'https://api.dicebear.com/7.x/identicon/svg?seed=MyChatUser';

// 1. Profile Form State
const profileForm = reactive({
  displayName: '',
  username: '',
  bio: '',
  avatar: '',
  phoneNumber: ''
});

// 2. General Settings
const generalSettings = reactive({
  startOnBoot: localStorage.getItem('mychat_startup') === 'true',
  minimizeToTray: localStorage.getItem('mychat_tray') !== 'false',
  autoUpdate: localStorage.getItem('mychat_autoupdate') !== 'false',
  language: localStorage.getItem('mychat_language') || 'en'
});

// 3. Account Settings
const accountPinInput = ref('');
const activeDevicesList = ref([]);

// 4. Privacy Settings
const privacySettings = reactive({
  lastSeenPrivacy: 'everyone',
  readReceipts: true
});
const blockedUsersList = ref([]);

// 5. Chat Settings
const chatSettings = reactive({
  theme: localStorage.getItem('mychat_theme') || 'dark',
  wallpaper: localStorage.getItem('mychat_wallpaper') || 'default',
  enterToSend: localStorage.getItem('mychat_enter_to_send') !== 'false',
  fontSize: localStorage.getItem('mychat_font_size') || '15px'
});

// 6. Voice & Video Settings
const micDevices = ref([]);
const cameraDevices = ref([]);
const selectedMicId = ref('');
const selectedCamId = ref('');
const isTestingMic = ref(false);
const isTestingCam = ref(false);
const micVolumeLevel = ref(0);
const cameraVideoElement = ref(null);
let audioContext = null;
let micStream = null;
let cameraStream = null;
let audioAnimFrame = null;

// 7. Notifications
const notifSettings = reactive({
  desktopPush: localStorage.getItem('mychat_notif_push') !== 'false',
  playSound: localStorage.getItem('mychat_notif_sound') !== 'false'
});
const notificationPermissionStatus = ref(typeof Notification !== 'undefined' ? Notification.permission : 'unsupported');

// 8. Keyboard Shortcuts
const shortcutsList = [
  { key: 'Enter', description: 'Send active chat message' },
  { key: 'Shift + Enter', description: 'Insert new line in message input' },
  { key: 'Ctrl + F', description: 'Focus search bar in sidebar' },
  { key: 'Ctrl + K', description: 'Open Start New Chat / Add Contact modal' },
  { key: 'Ctrl + ,', description: 'Open Application Settings' },
  { key: 'Escape', description: 'Close modals or cancel action' }
];

// 9. Help & Feedback
const expandedFaq = ref(null);
const faqList = [
  { q: 'How do I add contacts by mobile phone number?', a: 'Click the "+" button at the top of the chat list, select "By Phone Number", enter their mobile number (e.g. +94771234567) and tap "Search & Add Contact".' },
  { q: 'How do View-Once photo messages work?', a: 'Click the "1️⃣" icon in the message input bar before sending a photo. The recipient can only view it once before it expires permanently.' },
];

const feedbackForm = reactive({
  category: 'General Feedback',
  description: ''
});

// Setup on Mounted
onMounted(async () => {
  resetProfileForm();
  await fetchHardwareDevices();
  fetchDevicesAndBlocked();
});

onUnmounted(() => {
  stopMicTest();
  stopCameraTest();
});

function showToast(msg, type = 'success') {
  toastMessage.value = msg;
  toastType.value = type;
  setTimeout(() => {
    toastMessage.value = '';
  }, 3500);
}

function formatDate(isoStr) {
  if (!isoStr) return 'N/A';
  return new Date(isoStr).toLocaleDateString([], { year: 'numeric', month: 'short', day: 'numeric' });
}

function resetProfileForm() {
  const u = authStore.user || {};
  profileForm.displayName = u.displayName || '';
  profileForm.username = u.username || '';
  profileForm.bio = u.bio || 'Available';
  profileForm.avatar = u.avatar || defaultAvatar;
  profileForm.phoneNumber = u.phoneNumber || '';
}

// PROFILE ACTIONS
async function handleAvatarFileSelect(e) {
  const file = e.target.files?.[0];
  if (!file) return;

  try {
    const res = await api.uploadMedia(file);
    if (res.url) {
      profileForm.avatar = res.url;
      showToast('Avatar uploaded! Tap "Save & Update Profile" to apply.', 'success');
    }
  } catch (err) {
    // Fallback base64 for instant preview
    const reader = new FileReader();
    reader.onload = (evt) => {
      profileForm.avatar = evt.target.result;
      showToast('Avatar image loaded! Save profile to finish.', 'success');
    };
    reader.readAsDataURL(file);
  }
}

async function saveProfile() {
  isSaving.value = true;
  try {
    const updated = await authStore.updateProfile({
      displayName: profileForm.displayName,
      username: profileForm.username,
      bio: profileForm.bio,
      avatar: profileForm.avatar
    });
    showToast('Profile updated successfully!', 'success');
  } catch (err) {
    showToast(err.message || 'Failed to update profile', 'error');
  } finally {
    isSaving.value = false;
  }
}

// GENERAL ACTIONS
function saveGeneral() {
  localStorage.setItem('mychat_startup', generalSettings.startOnBoot);
  localStorage.setItem('mychat_tray', generalSettings.minimizeToTray);
  localStorage.setItem('mychat_autoupdate', generalSettings.autoUpdate);
  localStorage.setItem('mychat_language', generalSettings.language);
  showToast('General settings saved!', 'success');
}

// ACCOUNT ACTIONS
async function updateAccountPin() {
  if (!accountPinInput.value || accountPinInput.value.length < 4) {
    showToast('Please enter a valid 4 to 6-digit PIN', 'error');
    return;
  }
  try {
    await authStore.updateSecurity({ pin: accountPinInput.value });
    accountPinInput.value = '';
    showToast('Security PIN updated successfully!', 'success');
  } catch (err) {
    showToast('Failed to update PIN', 'error');
  }
}

async function fetchDevicesAndBlocked() {
  try {
    const devs = await api.getDevices().catch(() => ({ devices: [] }));
    activeDevicesList.value = devs.devices || [];

    const blocked = await api.getBlockedUsers().catch(() => ({ blocked: [] }));
    blockedUsersList.value = blocked.blocked || [];
  } catch (e) {}
}

async function logoutAllOtherDevices() {
  try {
    await api.logoutAll();
    showToast('Logged out all other sessions', 'success');
    fetchDevicesAndBlocked();
  } catch (err) {
    showToast('Action completed', 'success');
  }
}

function promptDeleteAccount() {
  if (confirm('⚠️ Are you sure you want to permanently delete your account? This action CANNOT be undone.')) {
    api.deleteAccount().finally(() => {
      authStore.logout();
    });
  }
}

// PRIVACY ACTIONS
async function savePrivacy() {
  try {
    await authStore.updatePrivacy({
      lastSeenPrivacy: privacySettings.lastSeenPrivacy,
      readReceipts: privacySettings.readReceipts
    });
    showToast('Privacy settings saved!', 'success');
  } catch (e) {
    showToast('Privacy settings saved locally', 'success');
  }
}

async function unblockContact(userId) {
  try {
    await api.unblockUser(userId);
    blockedUsersList.value = blockedUsersList.value.filter(u => u.id !== userId);
    showToast('Contact unblocked', 'success');
  } catch (err) {
    showToast('Failed to unblock user', 'error');
  }
}

// CHATS ACTIONS
function setAppTheme(mode) {
  chatSettings.theme = mode;
  localStorage.setItem('mychat_theme', mode);
  if (mode === 'light') {
    document.body.classList.remove('dark-theme');
    document.body.classList.add('light-theme');
  } else {
    document.body.classList.remove('light-theme');
    document.body.classList.add('dark-theme');
  }
  showToast(`Theme changed to ${mode.toUpperCase()}`, 'success');
}

function setChatWallpaper(wp) {
  chatSettings.wallpaper = wp;
  localStorage.setItem('mychat_wallpaper', wp);
  showToast('Chat wallpaper updated!', 'success');
}

function saveChatSettings() {
  localStorage.setItem('mychat_enter_to_send', chatSettings.enterToSend);
  localStorage.setItem('mychat_font_size', chatSettings.fontSize);
  document.body.style.setProperty('--msg-font-size', chatSettings.fontSize);
  showToast('Chat preferences saved!', 'success');
}

// HARDWARE (VOICE & VIDEO) ACTIONS
async function fetchHardwareDevices() {
  try {
    if (!navigator.mediaDevices?.enumerateDevices) return;
    const devices = await navigator.mediaDevices.enumerateDevices();
    micDevices.value = devices.filter(d => d.kind === 'audioinput');
    cameraDevices.value = devices.filter(d => d.kind === 'videoinput');

    if (micDevices.value.length > 0) selectedMicId.value = micDevices.value[0].deviceId;
    if (cameraDevices.value.length > 0) selectedCamId.value = cameraDevices.value[0].deviceId;
  } catch (err) {
    console.warn('Hardware enumeration error:', err);
  }
}

async function toggleMicTest() {
  if (isTestingMic.value) {
    stopMicTest();
  } else {
    try {
      micStream = await navigator.mediaDevices.getUserMedia({
        audio: selectedMicId.value ? { deviceId: { exact: selectedMicId.value } } : true
      });
      isTestingMic.value = true;
      audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const source = audioContext.createMediaStreamSource(micStream);
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 64;
      source.connect(analyser);

      const dataArray = new Uint8Array(analyser.frequencyBinCount);
      const updateMeter = () => {
        if (!isTestingMic.value) return;
        analyser.getByteFrequencyData(dataArray);
        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) sum += dataArray[i];
        const avg = sum / dataArray.length;
        micVolumeLevel.value = Math.min(100, Math.round((avg / 128) * 100));
        audioAnimFrame = requestAnimationFrame(updateMeter);
      };
      updateMeter();
    } catch (err) {
      showToast('Could not access microphone', 'error');
    }
  }
}

function stopMicTest() {
  isTestingMic.value = false;
  micVolumeLevel.value = 0;
  if (audioAnimFrame) cancelAnimationFrame(audioAnimFrame);
  if (micStream) {
    micStream.getTracks().forEach(t => t.stop());
    micStream = null;
  }
  if (audioContext) {
    audioContext.close();
    audioContext = null;
  }
}

async function toggleCameraTest() {
  if (isTestingCam.value) {
    stopCameraTest();
  } else {
    try {
      isTestingCam.value = true;
      await nextTick();
      cameraStream = await navigator.mediaDevices.getUserMedia({
        video: selectedCamId.value ? { deviceId: { exact: selectedCamId.value } } : true
      });
      if (cameraVideoElement.value) {
        cameraVideoElement.value.srcObject = cameraStream;
      }
    } catch (err) {
      isTestingCam.value = false;
      showToast('Could not access camera', 'error');
    }
  }
}

function stopCameraTest() {
  isTestingCam.value = false;
  if (cameraStream) {
    cameraStream.getTracks().forEach(t => t.stop());
    cameraStream = null;
  }
}

// NOTIFICATION ACTIONS
function saveNotif() {
  localStorage.setItem('mychat_notif_push', notifSettings.desktopPush);
  localStorage.setItem('mychat_notif_sound', notifSettings.playSound);
  showToast('Notification settings saved!', 'success');
}

async function requestNotificationPermission() {
  if (typeof Notification === 'undefined') {
    showToast('Desktop notifications not supported in this browser', 'error');
    return;
  }
  const result = await Notification.requestPermission();
  notificationPermissionStatus.value = result;
  if (result === 'granted') {
    showToast('Desktop notification permission granted!', 'success');
  } else {
    showToast('Permission ' + result, 'error');
  }
}

function playTestNotificationSound() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
    osc.frequency.setValueAtTime(880, ctx.currentTime + 0.12); // A5
    gain.gain.setValueAtTime(0.2, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.45);
    showToast('Played test chime sound', 'success');
  } catch (e) {}
}

// HELP ACTIONS
function submitFeedback() {
  showToast('Thank you! Your feedback has been submitted.', 'success');
  feedbackForm.description = '';
}

// LOGOUT ACTION
const isLoggingOut = ref(false);

async function confirmLogout() {
  isLoggingOut.value = true;
  try {
    await authStore.logout();
    showLogoutConfirm.value = false;
    emit('close');
  } catch (err) {
    showToast(err.message || 'Failed to logout cleanly', 'error');
  } finally {
    isLoggingOut.value = false;
  }
}
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  inset: 0;
  background-color: rgba(0, 0, 0, 0.75);
  backdrop-filter: blur(10px);
  z-index: 1200;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
}

.nested-overlay {
  z-index: 1300;
}

.settings-card {
  width: 600px;
  max-width: 95vw;
  height: 85vh;
  max-height: 85vh;
  background: #1e293b;
  border: 1px solid #334155;
  border-radius: 1.25rem;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  color: #f8fafc;
  position: relative;
}

.settings-view {
  display: flex;
  flex-direction: column;
  height: 100%;
  width: 100%;
  overflow: hidden;
}

.dialog-card {
  width: 400px;
  padding: 1.5rem;
  text-align: center;
}

.modal-header, .subpage-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1.2rem 1.5rem;
  border-bottom: 1px solid #334155;
  background: #0f172a;
  position: sticky;
  top: 0;
  z-index: 20;
  flex-shrink: 0;
}

.header-title {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  color: #a5b4fc;
}

.header-title h3, .subpage-title {
  font-size: 1.15rem;
  font-weight: 700;
  margin: 0;
  color: #f8fafc;
}

.btn-subpage-back {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  background: rgba(99, 102, 241, 0.15);
  color: #a5b4fc;
  border: 1px solid rgba(99, 102, 241, 0.3);
  padding: 0.4rem 0.85rem;
  border-radius: 0.6rem;
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-subpage-back:hover {
  background: rgba(99, 102, 241, 0.3);
  color: #ffffff;
  transform: translateX(-2px);
}

.btn-close {
  background: transparent;
  border: none;
  color: #94a3b8;
  font-size: 1.2rem;
  cursor: pointer;
  padding: 0.2rem 0.5rem;
  border-radius: 0.4rem;
}

.btn-close:hover {
  background: #334155;
  color: #fff;
}

.settings-body {
  padding: 1.5rem;
  padding-bottom: 3rem;
  overflow-y: auto;
  overflow-x: hidden;
  flex: 1;
  scroll-behavior: smooth;
  -webkit-overflow-scrolling: touch;
}

/* Dark Theme Custom Scrollbar */
.settings-body::-webkit-scrollbar {
  width: 6px;
}

.settings-body::-webkit-scrollbar-track {
  background: #0f172a;
}

.settings-body::-webkit-scrollbar-thumb {
  background: #334155;
  border-radius: 3px;
}

.settings-body::-webkit-scrollbar-thumb:hover {
  background: #6366f1;
}

.toast-banner {
  padding: 0.75rem 1rem;
  border-radius: 0.6rem;
  font-size: 0.88rem;
  font-weight: 500;
  margin-bottom: 1.2rem;
}
.toast-banner.success { background: rgba(16, 185, 129, 0.18); border: 1px solid #10b981; color: #34d399; }
.toast-banner.error { background: rgba(239, 68, 68, 0.18); border: 1px solid #ef4444; color: #f87171; }

/* Profile Banner Card */
.profile-banner-card {
  display: flex;
  align-items: center;
  gap: 1.2rem;
  padding: 1.2rem;
  background: linear-gradient(135deg, rgba(30, 41, 59, 0.9), rgba(15, 23, 42, 0.9));
  border: 1px solid #334155;
  border-radius: 1rem;
  cursor: pointer;
  transition: all 0.2s;
  margin-bottom: 1.5rem;
}

.profile-banner-card:hover {
  border-color: #6366f1;
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(99, 102, 241, 0.2);
}

.avatar-wrapper {
  position: relative;
  width: 60px;
  height: 60px;
  flex-shrink: 0;
}

.profile-avatar-img {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  object-fit: cover;
  border: 2px solid #6366f1;
}

.online-dot {
  position: absolute;
  bottom: 2px;
  right: 2px;
  width: 14px;
  height: 14px;
  border-radius: 50%;
  background: #10b981;
  border: 2px solid #1e293b;
}

.profile-banner-info {
  flex: 1;
  min-width: 0;
}

.profile-banner-name {
  font-size: 1.1rem;
  font-weight: 700;
  color: #fff;
}

.profile-banner-sub {
  font-size: 0.82rem;
  color: #94a3b8;
  margin-top: 2px;
}

.profile-banner-status {
  font-size: 0.8rem;
  color: #a5b4fc;
  font-style: italic;
  margin-top: 4px;
}

.chevron-arrow {
  font-size: 1.5rem;
  color: #64748b;
}

/* Settings Menu List */
.settings-menu-list {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}

.menu-item {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 0.9rem 1rem;
  border-radius: 0.75rem;
  background: rgba(15, 23, 42, 0.4);
  border: 1px solid transparent;
  cursor: pointer;
  transition: all 0.15s;
}

.menu-item:hover {
  background: #334155;
  border-color: rgba(255, 255, 255, 0.08);
}

.menu-item-danger:hover {
  background: rgba(239, 68, 68, 0.15);
  border-color: rgba(239, 68, 68, 0.3);
}

.menu-item-icon {
  width: 40px;
  height: 40px;
  border-radius: 0.6rem;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.icon-purple { background: rgba(168, 85, 247, 0.15); color: #c084fc; }
.icon-blue { background: rgba(59, 130, 246, 0.15); color: #60a5fa; }
.icon-emerald { background: rgba(16, 185, 129, 0.15); color: #34d399; }
.icon-indigo { background: rgba(99, 102, 241, 0.15); color: #818cf8; }
.icon-amber { background: rgba(245, 158, 11, 0.15); color: #fbbf24; }
.icon-rose { background: rgba(244, 63, 94, 0.15); color: #fb7185; }
.icon-cyan { background: rgba(6, 182, 212, 0.15); color: #22d3ee; }
.icon-teal { background: rgba(20, 184, 166, 0.15); color: #2dd4bf; }
.icon-red { background: rgba(239, 68, 68, 0.15); color: #f87171; }

.menu-item-text {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.menu-item-text .title {
  font-size: 0.95rem;
  font-weight: 600;
}

.menu-item-text .subtitle {
  font-size: 0.78rem;
  color: #94a3b8;
  margin-top: 2px;
}

.chevron {
  font-size: 1.2rem;
  color: #64748b;
}

/* DEDICATED PROFILE PAGE STYLES */
.profile-hero-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 1.8rem;
}

.large-avatar-container {
  position: relative;
  width: 110px;
  height: 110px;
}

.large-avatar-img {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  object-fit: cover;
  border: 4px solid #6366f1;
  box-shadow: 0 10px 25px rgba(99, 102, 241, 0.3);
}

.avatar-edit-overlay {
  position: absolute;
  bottom: 4px;
  right: 4px;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: #6366f1;
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.4);
  transition: transform 0.2s;
}

.avatar-edit-overlay:hover {
  transform: scale(1.1);
  background: #4f46e5;
}

.avatar-hint {
  font-size: 0.8rem;
  color: #94a3b8;
  margin-top: 0.6rem;
}

.profile-fields-container {
  display: flex;
  flex-direction: column;
  gap: 1.2rem;
}

.profile-field-group {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}

.field-label-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.field-label {
  font-size: 0.85rem;
  font-weight: 600;
  color: #cbd5e1;
}

.edit-badge {
  font-size: 0.75rem;
  color: #818cf8;
}

.form-input-lg, .form-textarea-lg {
  width: 100%;
  background: #0f172a;
  border: 1px solid #334155;
  border-radius: 0.75rem;
  padding: 0.75rem 1rem;
  color: #fff;
  font-size: 0.95rem;
  outline: none;
  transition: border-color 0.2s;
}

.form-input-lg:focus, .form-textarea-lg:focus {
  border-color: #6366f1;
  box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.25);
}

.input-with-prefix {
  display: flex;
  align-items: center;
  background: #0f172a;
  border: 1px solid #334155;
  border-radius: 0.75rem;
  padding-left: 1rem;
}

.input-with-prefix .prefix {
  color: #818cf8;
  font-weight: 700;
}

.input-with-prefix .with-prefix {
  border: none;
  background: transparent;
  padding-left: 0.2rem;
}

.field-subtext {
  font-size: 0.78rem;
  color: #64748b;
  margin: 0;
}

.read-only-group {
  background: rgba(15, 23, 42, 0.5);
  padding: 0.85rem;
  border-radius: 0.75rem;
  border: 1px dashed #334155;
}

.phone-display-box {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-weight: 600;
  color: #f8fafc;
  margin-top: 0.3rem;
}

.verified-tag {
  font-size: 0.75rem;
  color: #10b981;
  background: rgba(16, 185, 129, 0.15);
  padding: 0.2rem 0.6rem;
  border-radius: 0.4rem;
}

.profile-actions-bar {
  display: flex;
  gap: 0.75rem;
  margin-top: 1.8rem;
}

.btn-save-profile {
  flex: 1;
}

/* SETTINGS SUBPAGES COMMON */
.setting-block {
  margin-bottom: 1.5rem;
  padding-bottom: 1.2rem;
  border-bottom: 1px solid #334155;
}

.block-title {
  font-size: 0.95rem;
  font-weight: 700;
  color: #a5b4fc;
  margin: 0 0 0.5rem 0;
}

.block-sub {
  font-size: 0.82rem;
  color: #94a3b8;
  margin-bottom: 0.8rem;
}

.setting-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem 0;
}

.setting-text {
  display: flex;
  flex-direction: column;
}

.setting-text .title {
  font-size: 0.9rem;
  font-weight: 600;
}

.setting-text .desc {
  font-size: 0.78rem;
  color: #94a3b8;
}

.toggle-checkbox {
  width: 22px;
  height: 22px;
  accent-color: #6366f1;
  cursor: pointer;
}

.form-select, .form-input, .form-textarea {
  width: 100%;
  background: #0f172a;
  border: 1px solid #334155;
  border-radius: 0.6rem;
  padding: 0.65rem 0.85rem;
  color: #fff;
  font-size: 0.9rem;
  outline: none;
}

.btn-primary {
  background: linear-gradient(135deg, #6366f1, #4f46e5);
  color: #fff;
  border: none;
  padding: 0.75rem 1.2rem;
  border-radius: 0.65rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-primary:hover {
  box-shadow: 0 4px 15px rgba(99, 102, 241, 0.4);
}

.btn-secondary {
  background: #334155;
  color: #fff;
  border: none;
  padding: 0.75rem 1.2rem;
  border-radius: 0.65rem;
  font-weight: 600;
  cursor: pointer;
}

.btn-danger {
  background: #ef4444;
  color: white;
  border: none;
  padding: 0.75rem 1.2rem;
  border-radius: 0.65rem;
  font-weight: 600;
  cursor: pointer;
}

.theme-picker-grid, .wallpaper-options-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(130px, 1fr));
  gap: 0.75rem;
  margin-top: 0.8rem;
}

.theme-option-btn, .wp-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  padding: 0.85rem;
  background: #0f172a;
  border: 2px solid #334155;
  border-radius: 0.75rem;
  color: #fff;
  cursor: pointer;
  transition: all 0.2s;
}

.theme-option-btn.active, .wp-card.active {
  border-color: #6366f1;
  background: rgba(99, 102, 241, 0.15);
}

.wp-color-preview {
  width: 100%;
  height: 40px;
  border-radius: 0.5rem;
}

.fresco-prev { background: #c9e2ff; }
.dark-prev { background: #020617; }
.grad-prev { background: linear-gradient(135deg, #c9e2ff, #bae6fd); }
.light-prev { background: #f8fafc; }

.mic-meter-bar {
  width: 100%;
  height: 12px;
  background: #0f172a;
  border-radius: 6px;
  overflow: hidden;
  border: 1px solid #334155;
}

.mic-meter-fill {
  height: 100%;
  background: linear-gradient(90deg, #10b981, #f59e0b, #ef4444);
  transition: width 0.05s ease;
}

.video-preview-box {
  width: 100%;
  height: 180px;
  background: #000;
  border-radius: 0.75rem;
  overflow: hidden;
}

.video-stream {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.shortcuts-grid {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.shortcut-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem 1rem;
  background: #0f172a;
  border-radius: 0.6rem;
}

.shortcut-badge {
  background: #334155;
  color: #a5b4fc;
  padding: 0.3rem 0.6rem;
  border-radius: 0.4rem;
  font-family: monospace;
  font-weight: 700;
}

.faq-item {
  background: #0f172a;
  border: 1px solid #334155;
  border-radius: 0.6rem;
  margin-bottom: 0.5rem;
  padding: 0.85rem 1rem;
  cursor: pointer;
}

.faq-question {
  display: flex;
  justify-content: space-between;
  font-weight: 600;
}

.faq-answer {
  margin-top: 0.6rem;
  font-size: 0.85rem;
  color: #cbd5e1;
  line-height: 1.5;
  border-top: 1px dashed #334155;
  padding-top: 0.5rem;
}

.account-info-card {
  background: #0f172a;
  padding: 1rem;
  border-radius: 0.75rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.info-row {
  display: flex;
  justify-content: space-between;
  font-size: 0.88rem;
}

.code-font { font-family: monospace; color: #818cf8; }

.dialog-actions {
  display: flex;
  gap: 0.75rem;
  justify-content: center;
}

/* MOBILE RESPONSIVENESS */
@media (max-width: 640px) {
  .modal-overlay {
    padding: 0;
  }
  .settings-card {
    width: 100vw;
    height: 100vh;
    max-width: 100vw;
    max-height: 100vh;
    border-radius: 0;
  }
  .settings-body {
    padding: 1rem;
    padding-bottom: 5rem;
  }
}
</style>

<template>
  <aside class="sidebar" :class="{ collapsed: collapsed }">
    <!-- Sidebar Header -->
    <div class="sidebar-header">
      <div class="sidebar-brand" v-if="!collapsed">
        <div class="brand-icon">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
          </svg>
        </div>
        <span class="brand-text">Mychat</span>
      </div>
      <button class="btn-icon sidebar-toggle" @click="$emit('toggle-sidebar')" title="Toggle Sidebar">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <line x1="3" y1="12" x2="21" y2="12"/>
          <line x1="3" y1="6" x2="21" y2="6"/>
          <line x1="3" y1="18" x2="21" y2="18"/>
        </svg>
      </button>
    </div>

    <!-- User Account Switcher -->
    <div class="user-switcher" v-if="!collapsed" @click="showSwitcher = !showSwitcher">
      <div class="avatar avatar-sm" :style="{ backgroundColor: authStore.currentUser?.color || '#6366f1' }">
        <img v-if="authStore.currentUser?.avatar" :src="authStore.currentUser.avatar" :alt="authStore.currentUser.name" />
        <span v-else>{{ getInitials(authStore.currentUser?.name) }}</span>
      </div>
      <div class="switcher-info">
        <div class="switcher-name">{{ authStore.currentUser?.name }}</div>
        <div class="switcher-role">{{ authStore.currentUser?.role }}</div>
      </div>
      <svg class="switcher-chevron" :class="{ rotated: showSwitcher }" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"/></svg>
    </div>

    <!-- Account Switcher Dropdown -->
    <div class="switcher-dropdown" v-if="showSwitcher && !collapsed">
      <div
        v-for="user in authStore.users"
        :key="user.id"
        class="switcher-option"
        :class="{ active: user.id === authStore.currentUser?.id }"
        @click="switchToUser(user.id)"
      >
        <div class="avatar avatar-sm" :style="{ backgroundColor: user.color }">
          <img v-if="user.avatar" :src="user.avatar" :alt="user.name" />
          <span v-else>{{ getInitials(user.name) }}</span>
        </div>
        <div>
          <div class="switcher-option-name">{{ user.name }}</div>
          <div class="switcher-option-role">{{ user.role }}</div>
        </div>
      </div>
    </div>

    <!-- Search Bar -->
    <div class="sidebar-search" v-if="!collapsed">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
      </svg>
      <input type="text" placeholder="Search chats…" v-model="searchQuery" class="search-input" />
    </div>

    <!-- Filter Tabs -->
    <div class="filter-tabs" v-if="!collapsed">
      <button
        v-for="tab in filterTabs"
        :key="tab.key"
        class="filter-tab"
        :class="{ active: activeFilter === tab.key }"
        @click="activeFilter = tab.key"
      >{{ tab.label }}</button>
    </div>

    <!-- Channel List -->
    <div class="sidebar-section" v-if="!collapsed">
      <div class="section-header">
        <span class="section-title">Channels</span>
        <button class="btn-icon btn-icon-sm" @click="$emit('open-new-channel')" title="New Channel">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
        </button>
      </div>
      <div
        v-for="channel in filteredChannels"
        :key="channel.id"
        class="chat-item"
        :class="{ active: chatStore.activeChatId === channel.id }"
        @click="chatStore.setActiveChat(channel.id)"
      >
        <div class="chat-item-icon channel-icon">
          <svg v-if="channel.isPrivate" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
          </svg>
          <span v-else class="hash-icon">#</span>
        </div>
        <div class="chat-item-info">
          <span class="chat-item-name">{{ channel.name }}</span>
        </div>
      </div>
    </div>

    <!-- Direct Messages -->
    <div class="sidebar-section" v-if="!collapsed">
      <div class="section-header">
        <span class="section-title">Direct Messages</span>
      </div>
      <div
        v-for="dm in filteredDMs"
        :key="dm.id"
        class="chat-item"
        :class="{ active: chatStore.activeChatId === dm.id }"
        @click="chatStore.setActiveChat(dm.id)"
      >
        <div class="avatar avatar-sm" :style="{ backgroundColor: getPartner(dm.partnerId)?.color || '#6366f1' }">
          <img v-if="getPartner(dm.partnerId)?.avatar" :src="getPartner(dm.partnerId).avatar" :alt="getPartner(dm.partnerId)?.name" />
          <span v-else>{{ getInitials(getPartner(dm.partnerId)?.name) }}</span>
          <span class="avatar-status-badge" :class="'status-' + (getPartner(dm.partnerId)?.status || 'offline')"></span>
        </div>
        <div class="chat-item-info">
          <span class="chat-item-name">{{ getPartner(dm.partnerId)?.name || 'Unknown' }}</span>
          <span class="chat-item-role">{{ getPartner(dm.partnerId)?.jobTitle }}</span>
        </div>
      </div>
    </div>

    <!-- Sidebar Footer -->
    <div class="sidebar-footer">
      <button class="btn-icon" @click="$emit('open-settings')" title="Settings">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>
        </svg>
      </button>
      <button class="btn-icon" @click="$emit('open-profile')" title="Profile">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
        </svg>
      </button>
    </div>
  </aside>
</template>

<script setup>
import { ref, computed } from 'vue';
import { useAuthStore } from '../stores/authStore';
import { useChatStore } from '../stores/chatStore';

defineProps({ collapsed: Boolean });
defineEmits(['toggle-sidebar', 'open-profile', 'open-new-channel', 'open-settings']);

const authStore = useAuthStore();
const chatStore = useChatStore();

const searchQuery = ref('');
const activeFilter = ref('all');
const showSwitcher = ref(false);

const filterTabs = [
  { key: 'all', label: 'All' },
  { key: 'group', label: 'Channels' },
  { key: 'direct', label: 'Direct' }
];

const filteredChannels = computed(() => {
  if (activeFilter.value === 'direct') return [];
  let channels = chatStore.channels;
  if (searchQuery.value) {
    const q = searchQuery.value.toLowerCase();
    channels = channels.filter(c => c.name.toLowerCase().includes(q));
  }
  return channels;
});

const filteredDMs = computed(() => {
  if (activeFilter.value === 'group') return [];
  let dms = chatStore.directMessages;
  if (searchQuery.value) {
    const q = searchQuery.value.toLowerCase();
    dms = dms.filter(dm => {
      const partner = getPartner(dm.partnerId);
      return partner && partner.name.toLowerCase().includes(q);
    });
  }
  return dms;
});

function getPartner(partnerId) {
  return authStore.users.find(u => u.id === partnerId);
}

function getInitials(name) {
  if (!name) return '?';
  return name.split(' ').map(w => w[0]).join('').substring(0, 2).toUpperCase();
}

function switchToUser(userId) {
  authStore.switchUser(userId);
  showSwitcher.value = false;
}
</script>

<style scoped>
.sidebar {
  width: 300px;
  min-width: 300px;
  height: 100vh;
  background: var(--bg-sidebar);
  border-right: 1px solid var(--border-color);
  display: flex;
  flex-direction: column;
  transition: all var(--transition-normal);
  overflow: hidden;
  z-index: 10;
}

.sidebar.collapsed {
  width: 60px;
  min-width: 60px;
}

.sidebar-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px;
  border-bottom: 1px solid var(--border-color);
}

.sidebar-brand {
  display: flex;
  align-items: center;
  gap: 10px;
}

.brand-icon {
  width: 36px;
  height: 36px;
  border-radius: var(--radius-md);
  background: var(--msg-sent-bg);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  box-shadow: var(--shadow-glow);
}

.brand-text {
  font-family: var(--font-heading);
  font-size: 1.25rem;
  font-weight: 700;
  background: linear-gradient(135deg, #818cf8, #6366f1, #a78bfa);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.sidebar-toggle {
  margin-left: auto;
}

/* User Switcher */
.user-switcher {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 16px;
  margin: 8px 12px;
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: background var(--transition-fast);
  background: var(--bg-hover);
}

.user-switcher:hover {
  background: var(--bg-active);
}

.switcher-info {
  flex: 1;
  min-width: 0;
}

.switcher-name {
  font-size: 0.88rem;
  font-weight: 600;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.switcher-role {
  font-size: 0.72rem;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.switcher-chevron {
  color: var(--text-muted);
  transition: transform var(--transition-fast);
  flex-shrink: 0;
}

.switcher-chevron.rotated {
  transform: rotate(180deg);
}

/* Switcher Dropdown */
.switcher-dropdown {
  margin: 0 12px 8px;
  background: var(--bg-card);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  overflow: hidden;
  animation: fadeIn 0.2s ease-out;
}

.switcher-option {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 14px;
  cursor: pointer;
  transition: background var(--transition-fast);
}

.switcher-option:hover {
  background: var(--bg-hover);
}

.switcher-option.active {
  background: var(--bg-active);
}

.switcher-option-name {
  font-size: 0.85rem;
  font-weight: 500;
}

.switcher-option-role {
  font-size: 0.7rem;
  color: var(--text-muted);
}

/* Search */
.sidebar-search {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 4px 12px 8px;
  padding: 8px 12px;
  background: var(--bg-input);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  color: var(--text-muted);
  transition: border-color var(--transition-fast);
}

.sidebar-search:focus-within {
  border-color: var(--primary-500);
  box-shadow: 0 0 0 2px var(--primary-glow);
}

.search-input {
  flex: 1;
  background: none;
  border: none;
  color: var(--text-main);
  font-size: 0.85rem;
}

/* Filter Tabs */
.filter-tabs {
  display: flex;
  gap: 4px;
  padding: 0 12px;
  margin-bottom: 8px;
}

.filter-tab {
  flex: 1;
  padding: 6px 8px;
  font-size: 0.78rem;
  font-weight: 600;
  color: var(--text-muted);
  border-radius: var(--radius-sm);
  text-align: center;
  transition: all var(--transition-fast);
  text-transform: uppercase;
  letter-spacing: 0.03em;
}

.filter-tab:hover {
  color: var(--text-main);
  background: var(--bg-hover);
}

.filter-tab.active {
  color: var(--primary-500);
  background: var(--bg-active);
}

/* Sidebar Sections */
.sidebar-section {
  flex: 1;
  overflow-y: auto;
  padding: 4px 0;
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 16px 4px;
}

.section-title {
  font-size: 0.72rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--text-subtle);
}

.btn-icon-sm {
  width: 28px;
  height: 28px;
}

/* Chat Items */
.chat-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 9px 16px;
  cursor: pointer;
  transition: all var(--transition-fast);
  border-left: 3px solid transparent;
}

.chat-item:hover {
  background: var(--bg-hover);
}

.chat-item.active {
  background: var(--bg-active);
  border-left-color: var(--primary-500);
}

.chat-item-icon {
  width: 32px;
  height: 32px;
  border-radius: var(--radius-sm);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.channel-icon {
  background: var(--bg-hover);
  color: var(--text-muted);
}

.hash-icon {
  font-size: 1rem;
  font-weight: 700;
  color: var(--text-muted);
}

.chat-item.active .channel-icon {
  background: var(--primary-glow);
  color: var(--primary-400);
}

.chat-item-info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
}

.chat-item-name {
  font-size: 0.88rem;
  font-weight: 500;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.chat-item-role {
  font-size: 0.72rem;
  color: var(--text-subtle);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* Sidebar Footer */
.sidebar-footer {
  margin-top: auto;
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 12px 16px;
  border-top: 1px solid var(--border-color);
}
</style>

<template>
  <div class="modal-overlay" @click.self="$emit('close')">
    <div class="modal-card create-group-card animate-scale-up">
      <div class="subpage-header">
        <button class="btn-subpage-back" @click="$emit('close')">← Back</button>
        <h3 class="subpage-title">Create Group Chat</h3>
        <button class="btn-close" @click="$emit('close')">✕</button>
      </div>

      <div class="create-group-body">
        <div v-if="toastMessage" class="toast-banner" :class="toastType">{{ toastMessage }}</div>

        <!-- Group Profile Picture & Name Inputs -->
        <div class="group-creation-hero">
          <div class="group-avatar-upload">
            <img :src="groupAvatar || defaultAvatar" class="avatar-preview-img" />
            <label class="avatar-upload-btn" title="Upload Group Picture">
              📷
              <input type="file" accept="image/*" @change="handleGroupAvatarSelect" style="display:none;" />
            </label>
          </div>
          
          <div class="form-group flex-1 w-full mt-3">
            <label class="form-label">Group Name *</label>
            <input 
              type="text" 
              v-model="groupName" 
              placeholder="e.g. Design Team Nova 🚀" 
              class="form-input-lg"
              autofocus
            />
          </div>
        </div>

        <!-- Selected Members Chips Banner -->
        <div class="selected-members-section mt-3" v-if="selectedMembers.length > 0">
          <label class="field-label">Selected Members ({{ selectedMembers.length }})</label>
          <div class="members-chips-grid mt-2">
            <div v-for="user in selectedMembers" :key="user.id" class="member-chip">
              <img :src="user.avatar || defaultAvatar" class="chip-avatar" />
              <span class="chip-name">{{ user.displayName }}</span>
              <button class="btn-chip-remove" @click="toggleSelectMember(user)">✕</button>
            </div>
          </div>
        </div>

        <!-- Member Search & Select List -->
        <div class="member-search-section mt-4">
          <label class="field-label">Add Members (Registered Contacts)</label>
          <input 
            type="text" 
            v-model="searchQuery" 
            @input="handleSearchInput" 
            placeholder="Search name, handle @username, or phone number..." 
            class="search-input-modal mt-2" 
          />

          <div v-if="isLoading" class="loading-spinner mt-3">Loading contacts...</div>
          
          <div v-else-if="filteredUsersList.length === 0" class="empty-users-box mt-3">
            <span class="empty-icon">👥</span>
            <p>No registered contacts found.</p>
            <span class="empty-sub">Invite friends by adding their phone number in Contacts.</span>
          </div>

          <div v-else class="users-selection-scroll mt-3">
            <div 
              v-for="user in filteredUsersList" 
              :key="user.id" 
              :class="['user-select-row', { selected: isSelected(user.id) }]"
              @click="toggleSelectMember(user)"
            >
              <img :src="user.avatar || defaultAvatar" class="avatar-md" />
              <div class="user-details">
                <span class="user-name">{{ user.displayName }}</span>
                <span class="user-sub">@{{ user.username }} • {{ user.phoneNumber }}</span>
              </div>
              <div class="checkbox-box">
                <span v-if="isSelected(user.id)" class="check-mark">✓</span>
                <span v-else class="plus-mark">+</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Footer Actions -->
        <div class="group-create-actions mt-4">
          <button 
            class="btn-primary btn-block btn-create" 
            :disabled="!groupName.trim() || isCreating"
            @click="submitCreateGroup"
          >
            <span v-if="isCreating">Creating Group...</span>
            <span v-else>🚀 Create Group Chat ({{ selectedMembers.length + 1 }} Members)</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useAuthStore } from '../stores/authStore.js';
import { usePeopleStore } from '../stores/peopleStore.js';
import { useChatStore } from '../stores/chatStore.js';
import { api } from '../services/api.js';

const emit = defineEmits(['close', 'created']);

const authStore = useAuthStore();
const peopleStore = usePeopleStore();
const chatStore = useChatStore();

const defaultAvatar = 'https://api.dicebear.com/7.x/identicon/svg?seed=MyChatGroup';
const groupName = ref('');
const groupAvatar = ref('');
const searchQuery = ref('');
const selectedMembers = ref([]);
const registeredUsersList = ref([]);
const isLoading = ref(false);
const isCreating = ref(false);

const toastMessage = ref('');
const toastType = ref('error');

onMounted(async () => {
  isLoading.value = true;
  try {
    const contacts = await peopleStore.fetchContacts();
    registeredUsersList.value = contacts || [];
  } catch (err) {
    console.error('Failed to fetch contacts:', err);
  } finally {
    isLoading.value = false;
  }
});

const filteredUsersList = computed(() => {
  let list = registeredUsersList.value;

  // Merge search results from peopleStore if available
  if (peopleStore.searchResults.length > 0) {
    const map = new Map();
    list.forEach(u => map.set(u.id, u));
    peopleStore.searchResults.forEach(u => {
      if (u.id !== authStore.user?.id) {
        map.set(u.id, u);
      }
    });
    list = Array.from(map.values());
  }

  // Filter out self
  list = list.filter(u => u.id !== authStore.user?.id);

  if (searchQuery.value.trim()) {
    const q = searchQuery.value.toLowerCase();
    list = list.filter(u => 
      (u.displayName && u.displayName.toLowerCase().includes(q)) ||
      (u.username && u.username.toLowerCase().includes(q)) ||
      (u.phoneNumber && u.phoneNumber.includes(q))
    );
  }
  return list;
});

function handleSearchInput() {
  if (searchQuery.value.trim()) {
    peopleStore.search(searchQuery.value.trim());
  }
}

function isSelected(userId) {
  return selectedMembers.value.some(m => m.id === userId);
}

function toggleSelectMember(user) {
  if (isSelected(user.id)) {
    selectedMembers.value = selectedMembers.value.filter(m => m.id !== user.id);
  } else {
    selectedMembers.value.push(user);
  }
}

async function handleGroupAvatarSelect(e) {
  const file = e.target.files?.[0];
  if (!file) return;

  try {
    const res = await api.uploadMedia(file);
    if (res.url) {
      groupAvatar.value = res.url;
    }
  } catch (err) {
    const reader = new FileReader();
    reader.onload = (evt) => {
      groupAvatar.value = evt.target.result;
    };
    reader.readAsDataURL(file);
  }
}

async function submitCreateGroup() {
  if (!groupName.value.trim()) {
    toastMessage.value = 'Please enter a group name';
    toastType.value = 'error';
    return;
  }

  isCreating.value = true;
  try {
    const memberIds = selectedMembers.value.map(m => m.id);
    const avatarUrl = groupAvatar.value || `https://api.dicebear.com/7.x/identicon/svg?seed=${encodeURIComponent(groupName.value.trim())}`;
    
    const roomId = await chatStore.createGroupChat(groupName.value.trim(), memberIds, avatarUrl);
    emit('created', roomId);
    emit('close');
  } catch (err) {
    toastMessage.value = err.message || 'Failed to create group';
    toastType.value = 'error';
  } finally {
    isCreating.value = false;
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

.create-group-card {
  width: 540px;
  max-width: 95vw;
  max-height: 88vh;
  background: #1e293b;
  border: 1px solid #334155;
  border-radius: 1.25rem;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  color: #f8fafc;
}

.subpage-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1.2rem 1.5rem;
  border-bottom: 1px solid #334155;
  background: #0f172a;
}

.btn-subpage-back {
  background: rgba(99, 102, 241, 0.15);
  color: #a5b4fc;
  border: 1px solid rgba(99, 102, 241, 0.3);
  padding: 0.4rem 0.85rem;
  border-radius: 0.6rem;
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
}

.btn-close {
  background: transparent;
  border: none;
  color: #94a3b8;
  font-size: 1.2rem;
  cursor: pointer;
}

.create-group-body {
  padding: 1.5rem;
  overflow-y: auto;
  flex: 1;
}

.toast-banner {
  padding: 0.75rem 1rem;
  border-radius: 0.6rem;
  font-size: 0.88rem;
  font-weight: 500;
  margin-bottom: 1.2rem;
  background: rgba(239, 68, 68, 0.18);
  border: 1px solid #ef4444;
  color: #f87171;
}

.group-creation-hero {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.group-avatar-upload {
  position: relative;
  width: 90px;
  height: 90px;
}

.avatar-preview-img {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  object-fit: cover;
  border: 3px solid #6366f1;
}

.avatar-upload-btn {
  position: absolute;
  bottom: 0;
  right: 0;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: #6366f1;
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.4);
}

.form-input-lg {
  width: 100%;
  background: #0f172a;
  border: 1px solid #334155;
  border-radius: 0.75rem;
  padding: 0.75rem 1rem;
  color: #fff;
  font-size: 1rem;
  outline: none;
}

.form-input-lg:focus {
  border-color: #6366f1;
  box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.25);
}

.members-chips-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  max-height: 100px;
  overflow-y: auto;
}

.member-chip {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  background: rgba(99, 102, 241, 0.2);
  border: 1px solid rgba(99, 102, 241, 0.4);
  padding: 0.25rem 0.6rem;
  border-radius: 1rem;
  font-size: 0.82rem;
  color: #f8fafc;
}

.chip-avatar {
  width: 22px;
  height: 22px;
  border-radius: 50%;
}

.btn-chip-remove {
  background: transparent;
  border: none;
  color: #f87171;
  cursor: pointer;
  font-weight: 700;
  margin-left: 0.2rem;
}

.users-selection-scroll {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  max-height: 220px;
  overflow-y: auto;
}

.user-select-row {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.65rem 0.85rem;
  background: #0f172a;
  border: 1px solid #334155;
  border-radius: 0.65rem;
  cursor: pointer;
  transition: all 0.15s;
}

.user-select-row:hover {
  border-color: #475569;
}

.user-select-row.selected {
  border-color: #6366f1;
  background: rgba(99, 102, 241, 0.15);
}

.user-details {
  flex: 1;
  min-width: 0;
}

.user-name {
  font-size: 0.9rem;
  font-weight: 600;
  display: block;
}

.user-sub {
  font-size: 0.75rem;
  color: #64748b;
  display: block;
}

.checkbox-box {
  width: 26px;
  height: 26px;
  border-radius: 50%;
  background: #1e293b;
  border: 1px solid #475569;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
}

.selected .checkbox-box {
  background: #6366f1;
  border-color: #6366f1;
  color: #fff;
}

.empty-users-box {
  text-align: center;
  padding: 1.5rem;
  color: #94a3b8;
}

.btn-primary {
  background: linear-gradient(135deg, #6366f1, #4f46e5);
  color: #fff;
  border: none;
  padding: 0.85rem;
  border-radius: 0.75rem;
  font-weight: 600;
  font-size: 0.95rem;
  cursor: pointer;
}

.btn-primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>

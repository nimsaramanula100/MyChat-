<template>
  <div class="modal-overlay" @click.self="$emit('close')">
    <div class="modal-card group-info-card animate-scale-up">
      <div class="subpage-header">
        <button class="btn-subpage-back" @click="$emit('close')">← Back</button>
        <h3 class="subpage-title">Group Info</h3>
        <button class="btn-close" @click="$emit('close')">✕</button>
      </div>

      <div class="group-info-body">
        <div v-if="isLoading" class="loading-box">Loading group details...</div>
        <div v-else-if="errorMsg" class="error-box">{{ errorMsg }}</div>
        <div v-else-if="group" class="group-details-content">
          <!-- Group Hero Section -->
          <div class="group-hero">
            <div class="group-avatar-wrapper">
              <img :src="group.avatar || defaultAvatar" class="group-avatar-img" />
              <label v-if="group.isAdmin" class="avatar-edit-badge" title="Change Group Photo">
                📷
                <input type="file" accept="image/*" @change="handleGroupAvatarChange" style="display:none;" />
              </label>
            </div>

            <!-- Group Name Display & Edit -->
            <div v-if="isEditingName" class="edit-name-box mt-2">
              <input type="text" v-model="editedName" class="form-input" @keyup.enter="saveGroupName" />
              <div class="edit-actions">
                <button class="btn-primary btn-xs" @click="saveGroupName">Save</button>
                <button class="btn-secondary btn-xs" @click="isEditingName = false">Cancel</button>
              </div>
            </div>
            <div v-else class="group-title-row mt-2">
              <h2 class="group-name">{{ group.name }}</h2>
              <button v-if="group.isAdmin" class="btn-icon-xs" @click="isEditingName = true" title="Edit Group Name">✏️</button>
            </div>

            <span class="member-count-badge">{{ group.members?.length || 0 }} Members</span>
          </div>

          <!-- Members Section -->
          <div class="members-section mt-4">
            <div class="members-header">
              <h4>Group Members</h4>
              <button v-if="group.isAdmin" class="btn-primary btn-xs" @click="showAddMemberModal = true">+ Add Members</button>
            </div>

            <div class="members-list mt-2">
              <div v-for="m in group.members" :key="m.id" class="member-item">
                <img :src="m.avatar || defaultAvatar" class="member-avatar" />
                <div class="member-info">
                  <div class="member-name-row">
                    <span class="member-name">{{ m.displayName }}</span>
                    <span :class="['role-tag', m.role === 'admin' ? 'admin' : 'member']">{{ m.role }}</span>
                  </div>
                  <span class="member-sub">@{{ m.username }} • {{ m.phoneNumber }}</span>
                </div>

                <!-- Admin Action to Remove Member -->
                <button 
                  v-if="group.isAdmin && m.id !== authStore.user?.id" 
                  class="btn-xs btn-danger-outline"
                  @click="removeMember(m.id)"
                  title="Remove from group"
                >
                  Remove
                </button>
              </div>
            </div>
          </div>

          <!-- Group Actions -->
          <div class="group-footer-actions mt-4">
            <button class="btn-danger btn-block" @click="leaveCurrentGroup">
              🚪 Leave Group
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Add Member Modal -->
    <div v-if="showAddMemberModal" class="modal-overlay nested-overlay" @click.self="showAddMemberModal = false">
      <div class="modal-card add-member-card">
        <div class="subpage-header">
          <button class="btn-subpage-back" @click="showAddMemberModal = false">← Back</button>
          <h3>Add Members</h3>
          <button class="btn-close" @click="showAddMemberModal = false">✕</button>
        </div>

        <div class="add-member-body">
          <input 
            type="text" 
            v-model="userSearchQuery" 
            @input="handleUserSearch" 
            placeholder="Search registered contacts..." 
            class="search-input-modal mb-3" 
          />

          <div v-if="peopleStore.isLoading" class="loading-spinner">Searching...</div>
          <div v-else-if="availableUsersToAdd.length === 0" class="empty-info">No new users found to add.</div>
          <div v-else class="user-select-list">
            <div 
              v-for="u in availableUsersToAdd" 
              :key="u.id" 
              :class="['user-select-item', { selected: selectedUserIds.includes(u.id) }]"
              @click="toggleUserSelect(u.id)"
            >
              <img :src="u.avatar || defaultAvatar" class="avatar-sm" />
              <div class="user-info">
                <span class="name">{{ u.displayName }}</span>
                <span class="sub">@{{ u.username }} • {{ u.phoneNumber }}</span>
              </div>
              <span class="checkbox-indicator">{{ selectedUserIds.includes(u.id) ? '✓' : '+' }}</span>
            </div>
          </div>

          <button 
            class="btn-primary btn-block mt-3" 
            :disabled="selectedUserIds.length === 0"
            @click="submitAddMembers"
          >
            Add Selected Members ({{ selectedUserIds.length }})
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
import { api } from '../services/api.js';

const props = defineProps({
  roomId: {
    type: String,
    required: true
  }
});

const emit = defineEmits(['close', 'updated', 'left']);

const authStore = useAuthStore();
const peopleStore = usePeopleStore();

const defaultAvatar = 'https://api.dicebear.com/7.x/identicon/svg?seed=MyChatGroup';
const group = ref(null);
const isLoading = ref(true);
const errorMsg = ref('');

const isEditingName = ref(false);
const editedName = ref('');

const showAddMemberModal = ref(false);
const userSearchQuery = ref('');
const selectedUserIds = ref([]);
const registeredContactsList = ref([]);

onMounted(() => {
  fetchGroupDetails();
  fetchContactsForAdd();
});

async function fetchGroupDetails() {
  isLoading.value = true;
  errorMsg.value = '';
  try {
    const res = await api.getGroupInfo(props.roomId);
    group.value = res.group;
    editedName.value = res.group.name;
  } catch (err) {
    errorMsg.value = err.message || 'Failed to load group details';
  } finally {
    isLoading.value = false;
  }
}

async function fetchContactsForAdd() {
  try {
    const contacts = await peopleStore.fetchContacts();
    registeredContactsList.value = contacts || [];
  } catch (e) {}
}

const availableUsersToAdd = computed(() => {
  if (!group.value || !group.value.members) return [];
  const existingIds = new Set(group.value.members.map(m => m.id));
  
  let list = registeredContactsList.value.filter(c => !existingIds.has(c.id));
  if (peopleStore.searchResults.length > 0) {
    const searchFiltered = peopleStore.searchResults.filter(u => !existingIds.has(u.id));
    // Merge search & contacts uniquely
    const map = new Map();
    list.forEach(u => map.set(u.id, u));
    searchFiltered.forEach(u => map.set(u.id, u));
    list = Array.from(map.values());
  }

  if (userSearchQuery.value) {
    const q = userSearchQuery.value.toLowerCase();
    list = list.filter(u => 
      (u.displayName && u.displayName.toLowerCase().includes(q)) ||
      (u.username && u.username.toLowerCase().includes(q)) ||
      (u.phoneNumber && u.phoneNumber.includes(q))
    );
  }
  return list;
});

function handleUserSearch() {
  if (userSearchQuery.value.trim()) {
    peopleStore.search(userSearchQuery.value.trim());
  }
}

function toggleUserSelect(userId) {
  if (selectedUserIds.value.includes(userId)) {
    selectedUserIds.value = selectedUserIds.value.filter(id => id !== userId);
  } else {
    selectedUserIds.value.push(userId);
  }
}

async function handleGroupAvatarChange(e) {
  const file = e.target.files?.[0];
  if (!file) return;

  try {
    const res = await api.uploadMedia(file);
    if (res.url) {
      await api.updateGroupInfo(props.roomId, null, res.url);
      group.value.avatar = res.url;
      emit('updated');
    }
  } catch (err) {
    alert('Failed to upload photo');
  }
}

async function saveGroupName() {
  if (!editedName.value.trim()) return;
  try {
    await api.updateGroupInfo(props.roomId, editedName.value.trim());
    group.value.name = editedName.value.trim();
    isEditingName.value = false;
    emit('updated');
  } catch (err) {
    alert(err.message || 'Failed to update name');
  }
}

async function submitAddMembers() {
  if (selectedUserIds.value.length === 0) return;
  try {
    await api.addGroupMembers(props.roomId, selectedUserIds.value);
    showAddMemberModal.value = false;
    selectedUserIds.value = [];
    await fetchGroupDetails();
    emit('updated');
  } catch (err) {
    alert(err.message || 'Failed to add members');
  }
}

async function removeMember(userId) {
  if (!confirm('Are you sure you want to remove this member?')) return;
  try {
    await api.removeGroupMember(props.roomId, userId);
    await fetchGroupDetails();
    emit('updated');
  } catch (err) {
    alert(err.message || 'Failed to remove member');
  }
}

async function leaveCurrentGroup() {
  if (!confirm('Are you sure you want to leave this group?')) return;
  try {
    await api.leaveGroup(props.roomId);
    emit('left');
    emit('close');
  } catch (err) {
    alert(err.message || 'Failed to leave group');
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

.group-info-card {
  width: 520px;
  max-width: 95vw;
  max-height: 85vh;
  background: #1e293b;
  border: 1px solid #334155;
  border-radius: 1.25rem;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  color: #f8fafc;
}

.add-member-card {
  width: 440px;
  max-width: 90vw;
  background: #1e293b;
  border-radius: 1.25rem;
  overflow: hidden;
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

.group-info-body, .add-member-body {
  padding: 1.5rem;
  overflow-y: auto;
  flex: 1;
}

.group-hero {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.group-avatar-wrapper {
  position: relative;
  width: 90px;
  height: 90px;
}

.group-avatar-img {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  object-fit: cover;
  border: 3px solid #6366f1;
}

.avatar-edit-badge {
  position: absolute;
  bottom: 0;
  right: 0;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: #6366f1;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}

.group-title-row {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.group-name {
  font-size: 1.2rem;
  font-weight: 700;
  margin: 0;
}

.btn-icon-xs {
  background: transparent;
  border: none;
  cursor: pointer;
  font-size: 1rem;
}

.member-count-badge {
  font-size: 0.8rem;
  color: #94a3b8;
  background: #0f172a;
  padding: 0.2rem 0.6rem;
  border-radius: 0.4rem;
  margin-top: 0.4rem;
}

.members-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.members-header h4 {
  font-size: 0.95rem;
  margin: 0;
  color: #a5b4fc;
}

.members-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  max-height: 250px;
  overflow-y: auto;
}

.member-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.6rem 0.85rem;
  background: #0f172a;
  border-radius: 0.65rem;
}

.member-avatar {
  width: 38px;
  height: 38px;
  border-radius: 50%;
  object-fit: cover;
}

.member-info {
  flex: 1;
  min-width: 0;
}

.member-name-row {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.member-name {
  font-size: 0.9rem;
  font-weight: 600;
}

.role-tag {
  font-size: 0.7rem;
  padding: 0.1rem 0.4rem;
  border-radius: 0.3rem;
  text-transform: uppercase;
  font-weight: 700;
}

.role-tag.admin { background: rgba(99, 102, 241, 0.2); color: #818cf8; }
.role-tag.member { background: rgba(148, 163, 184, 0.15); color: #94a3b8; }

.member-sub {
  font-size: 0.75rem;
  color: #64748b;
  display: block;
}

.btn-danger-outline {
  background: rgba(239, 68, 68, 0.15);
  color: #f87171;
  border: 1px solid rgba(239, 68, 68, 0.3);
  padding: 0.25rem 0.6rem;
  border-radius: 0.4rem;
  cursor: pointer;
}

.user-select-list {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
  max-height: 220px;
  overflow-y: auto;
}

.user-select-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.6rem 0.85rem;
  background: #0f172a;
  border: 1px solid #334155;
  border-radius: 0.65rem;
  cursor: pointer;
}

.user-select-item.selected {
  border-color: #6366f1;
  background: rgba(99, 102, 241, 0.15);
}

.user-select-item .user-info {
  flex: 1;
}

.user-select-item .name {
  font-size: 0.9rem;
  font-weight: 600;
  display: block;
}

.user-select-item .sub {
  font-size: 0.75rem;
  color: #64748b;
}

.checkbox-indicator {
  font-weight: 700;
  color: #6366f1;
}
</style>

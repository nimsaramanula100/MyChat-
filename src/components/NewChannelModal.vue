<template>
  <div class="modal-overlay" @click.self="$emit('close')">
    <div class="modal-content">
      <div class="modal-header">
        <h3>Create New Channel</h3>
        <button class="btn-icon" @click="$emit('close')">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>
      </div>
      <div class="modal-body">
        <div class="form-group">
          <label class="form-label">Channel Name</label>
          <input type="text" class="form-input" v-model="channelName" placeholder="e.g. frontend-roles" />
        </div>
        <div class="form-group">
          <label class="form-label">Description</label>
          <textarea class="form-textarea form-input" rows="3" v-model="channelDesc" placeholder="What is this channel about?"></textarea>
        </div>
        <div class="form-group">
          <label class="form-label">
            <input type="checkbox" v-model="isPrivate" style="margin-right: 6px;" />
            Private Channel
          </label>
        </div>
        <div class="form-group">
          <label class="form-label">Add Members</label>
          <div class="member-select">
            <label v-for="user in authStore.otherUsers" :key="user.id" class="member-option">
              <input type="checkbox" :value="user.id" v-model="selectedMembers" />
              <div class="avatar avatar-sm" :style="{ backgroundColor: user.color }">
                <img v-if="user.avatar" :src="user.avatar" :alt="user.name" />
                <span v-else>{{ user.name[0] }}</span>
              </div>
              <span>{{ user.name }}</span>
            </label>
          </div>
        </div>
      </div>
      <div class="modal-footer">
        <button class="btn-secondary" @click="$emit('close')">Cancel</button>
        <button class="btn-primary" @click="createChannel" :disabled="!channelName.trim()">Create Channel</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useAuthStore } from '../stores/authStore';
import { useChatStore } from '../stores/chatStore';

const emit = defineEmits(['close']);
const authStore = useAuthStore();
const chatStore = useChatStore();

const channelName = ref('');
const channelDesc = ref('');
const isPrivate = ref(false);
const selectedMembers = ref([]);

function createChannel() {
  if (!channelName.value.trim()) return;
  chatStore.createGroupChannel({
    name: channelName.value,
    description: channelDesc.value,
    isPrivate: isPrivate.value,
    members: selectedMembers.value,
    jobContext: null
  });
  emit('close');
}
</script>

<style scoped>
.member-select {
  display: flex;
  flex-direction: column;
  gap: 6px;
  max-height: 200px;
  overflow-y: auto;
}

.member-option {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 10px;
  border-radius: var(--radius-sm);
  cursor: pointer;
  font-size: 0.88rem;
  transition: background var(--transition-fast);
}

.member-option:hover {
  background: var(--bg-hover);
}

.member-option input[type="checkbox"] {
  accent-color: var(--primary-500);
}
</style>

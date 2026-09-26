<template>
  <div class="message-bubble-wrapper" :class="{ own: isOwn }">
    <!-- Avatar -->
    <div class="msg-avatar" v-if="!isOwn">
      <div class="avatar avatar-sm" :style="{ backgroundColor: sender?.color || '#6366f1' }">
        <img v-if="sender?.avatar" :src="sender.avatar" :alt="sender.name" />
        <span v-else>{{ getInitials(sender?.name) }}</span>
      </div>
    </div>

    <div class="msg-content-col">
      <!-- Sender Name + Time -->
      <div class="msg-meta">
        <span class="msg-sender" v-if="!isOwn">{{ sender?.name || 'Unknown' }}</span>
        <span class="msg-role-badge" v-if="!isOwn && sender?.role" :style="{ background: roleBgColor, color: roleColor }">
          {{ sender.role }}
        </span>
        <span class="msg-time">{{ formatTime(message.timestamp) }}</span>
      </div>

      <!-- Message Body -->
      <div class="msg-bubble" :class="{ 'msg-own': isOwn }">
        <p class="msg-text" v-if="message.content">{{ message.content }}</p>

        <!-- Attachments -->
        <div class="msg-attachments" v-if="message.attachments && message.attachments.length > 0">
          <div v-for="att in message.attachments" :key="att.id" class="attachment-card">
            <img v-if="isImage(att)" :src="att.url" :alt="att.name" class="attachment-image" />
            <div v-else class="attachment-file">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
              <div class="attachment-info">
                <span class="attachment-name">{{ att.name }}</span>
                <span class="attachment-size">{{ att.size }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Reactions -->
      <div class="msg-reactions" v-if="hasReactions">
        <button
          v-for="(users, emoji) in message.reactions"
          :key="emoji"
          class="reaction-pill"
          :class="{ active: isReactedByMe(users) }"
          @click="$emit('toggle-reaction', { messageId: message.id, emoji })"
        >
          <span>{{ emoji }}</span>
          <span class="reaction-count">{{ users.length }}</span>
        </button>
        <button class="reaction-add-btn" @click="showReactionPicker = !showReactionPicker">+</button>
        <div class="reaction-picker" v-if="showReactionPicker">
          <button v-for="e in quickEmojis" :key="e" class="emoji-btn-sm" @click="addReaction(e)">{{ e }}</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { useAuthStore } from '../stores/authStore';

const props = defineProps({
  message: Object,
  isOwn: Boolean
});

const emit = defineEmits(['toggle-reaction']);

const authStore = useAuthStore();
const showReactionPicker = ref(false);

const quickEmojis = ['👍', '❤️', '🔥', '🚀', '😂', '💡', '👏', '🎉'];

const sender = computed(() => {
  return authStore.users.find(u => u.id === props.message.senderId);
});

const hasReactions = computed(() => {
  return props.message.reactions && Object.keys(props.message.reactions).length > 0;
});

const roleColor = computed(() => {
  const role = sender.value?.role;
  if (role === 'Candidate') return 'var(--role-candidate)';
  if (role === 'Employer') return 'var(--role-employer)';
  if (role === 'Recruiter') return 'var(--role-recruiter)';
  return 'var(--text-muted)';
});

const roleBgColor = computed(() => {
  const role = sender.value?.role;
  if (role === 'Candidate') return 'var(--role-candidate-bg)';
  if (role === 'Employer') return 'var(--role-employer-bg)';
  if (role === 'Recruiter') return 'var(--role-recruiter-bg)';
  return 'var(--bg-hover)';
});

function getInitials(name) {
  if (!name) return '?';
  return name.split(' ').map(w => w[0]).join('').substring(0, 2).toUpperCase();
}

function formatTime(ts) {
  if (!ts) return '';
  const d = new Date(ts);
  const now = new Date();
  const diffDays = Math.floor((now - d) / (1000 * 60 * 60 * 24));

  const time = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  if (diffDays === 0) return time;
  if (diffDays === 1) return `Yesterday ${time}`;
  return `${d.toLocaleDateString([], { month: 'short', day: 'numeric' })} ${time}`;
}

function isImage(att) {
  return att.type?.startsWith('image/') || att.category === 'image';
}

function isReactedByMe(users) {
  return users?.includes(authStore.currentUser?.id);
}

function addReaction(emoji) {
  emit('toggle-reaction', { messageId: props.message.id, emoji });
  showReactionPicker.value = false;
}
</script>

<style scoped>
.message-bubble-wrapper {
  display: flex;
  gap: 10px;
  align-items: flex-start;
  animation: fadeIn 0.2s ease-out;
  padding: 4px 0;
}

.message-bubble-wrapper.own {
  flex-direction: row-reverse;
}

.msg-avatar {
  flex-shrink: 0;
  margin-top: 4px;
}

.msg-content-col {
  max-width: 65%;
  min-width: 0;
  display: flex;
  flex-direction: column;
}

.message-bubble-wrapper.own .msg-content-col {
  align-items: flex-end;
}

.msg-meta {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 3px;
  flex-wrap: wrap;
}

.msg-sender {
  font-size: 0.82rem;
  font-weight: 600;
  color: var(--text-main);
}

.msg-role-badge {
  font-size: 0.62rem;
  font-weight: 700;
  padding: 1px 6px;
  border-radius: var(--radius-full);
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.msg-time {
  font-size: 0.7rem;
  color: var(--text-subtle);
}

.msg-bubble {
  background: var(--msg-recv-bg);
  color: var(--msg-recv-text);
  padding: 10px 14px;
  border-radius: var(--radius-md) var(--radius-md) var(--radius-md) 4px;
  box-shadow: var(--shadow-sm);
  position: relative;
  word-wrap: break-word;
}

.msg-bubble.msg-own {
  background: var(--msg-sent-bg);
  color: var(--msg-sent-text);
  border-radius: var(--radius-md) var(--radius-md) 4px var(--radius-md);
}

.msg-text {
  font-size: 0.9rem;
  line-height: 1.55;
  white-space: pre-wrap;
}

/* Attachments */
.msg-attachments {
  margin-top: 8px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.attachment-image {
  max-width: 300px;
  max-height: 200px;
  border-radius: var(--radius-sm);
  object-fit: cover;
  cursor: pointer;
  transition: transform var(--transition-fast);
}

.attachment-image:hover {
  transform: scale(1.02);
}

.attachment-file {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 12px;
  background: var(--bg-hover);
  border-radius: var(--radius-sm);
  border: 1px solid var(--border-color);
}

.msg-own .attachment-file {
  background: rgba(255, 255, 255, 0.15);
  border-color: rgba(255, 255, 255, 0.2);
}

.attachment-info {
  display: flex;
  flex-direction: column;
}

.attachment-name {
  font-size: 0.82rem;
  font-weight: 500;
}

.attachment-size {
  font-size: 0.7rem;
  opacity: 0.7;
}

/* Reactions */
.msg-reactions {
  display: flex;
  gap: 4px;
  margin-top: 4px;
  flex-wrap: wrap;
  align-items: center;
  position: relative;
}

.reaction-add-btn {
  width: 26px;
  height: 26px;
  border-radius: var(--radius-full);
  background: var(--bg-hover);
  border: 1px dashed var(--border-color);
  color: var(--text-subtle);
  font-size: 0.9rem;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all var(--transition-fast);
}

.reaction-add-btn:hover {
  background: var(--bg-active);
  color: var(--primary-400);
  border-style: solid;
}

.reaction-count {
  font-size: 0.72rem;
  font-weight: 600;
}

.reaction-picker {
  position: absolute;
  bottom: 100%;
  left: 0;
  background: var(--bg-card);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  padding: 6px;
  display: flex;
  gap: 2px;
  box-shadow: var(--shadow-md);
  animation: fadeIn 0.15s ease-out;
  z-index: 10;
}

.emoji-btn-sm {
  width: 30px;
  height: 30px;
  font-size: 1rem;
  border-radius: var(--radius-sm);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  background: none;
  border: none;
  transition: all var(--transition-fast);
}

.emoji-btn-sm:hover {
  background: var(--bg-hover);
  transform: scale(1.2);
}
</style>

<template>
  <main class="chat-area">
    <!-- Chat Header -->
    <header class="chat-header glass-panel">
      <button class="btn-icon mobile-menu-btn" @click="$emit('toggle-sidebar')">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
      </button>
      <div class="chat-header-info" v-if="chatStore.activeChat">
        <div class="chat-header-top">
          <h2 class="chat-title">
            <span v-if="chatStore.activeChat.isGroup" class="hash-prefix">#</span>
            {{ chatStore.activeChat.name }}
          </h2>
          <div class="chat-header-badges">
            <span v-if="chatStore.activeChat.isGroup && chatStore.activeChat.isPrivate" class="badge badge-private">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
              Private
            </span>
            <span v-if="chatStore.activeChat.jobContext" class="badge badge-job">
              {{ chatStore.activeChat.jobContext.title }}
            </span>
          </div>
        </div>
        <p class="chat-desc" v-if="chatStore.activeChat.description">{{ chatStore.activeChat.description }}</p>
      </div>
      <div class="chat-header-actions">
        <button class="btn-icon" @click="$emit('open-profile')" title="Info">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
        </button>
      </div>
    </header>

    <!-- Messages Area -->
    <div class="messages-container" ref="messagesContainer">
      <div class="messages-list">
        <div v-if="chatStore.activeMessages.length === 0" class="empty-state">
          <div class="empty-icon">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
          </div>
          <h3>Start the conversation</h3>
          <p>Send a message to begin chatting!</p>
        </div>

        <MessageBubble
          v-for="msg in chatStore.activeMessages"
          :key="msg.id"
          :message="msg"
          :isOwn="msg.senderId === authStore.currentUser?.id"
          @toggle-reaction="handleReaction"
        />
      </div>

      <!-- Typing Indicator -->
      <div class="typing-indicator" v-if="typingText">
        <div class="typing-dots">
          <span></span><span></span><span></span>
        </div>
        <span class="typing-text">{{ typingText }}</span>
      </div>
    </div>

    <!-- Message Input -->
    <div class="message-input-area glass-panel">
      <!-- File Upload Preview -->
      <div class="file-preview-bar" v-if="pendingFiles.length > 0">
        <div class="file-preview-item" v-for="(file, idx) in pendingFiles" :key="idx">
          <span class="file-preview-name">{{ file.name }}</span>
          <button class="file-preview-remove" @click="pendingFiles.splice(idx, 1)">×</button>
        </div>
      </div>
      <div class="input-row">
        <button class="btn-icon" @click="triggerFileUpload" title="Attach File">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/></svg>
        </button>
        <input type="file" ref="fileInput" multiple style="display:none" @change="handleFileSelect" />
        <div class="input-wrapper">
          <input
            id="message-input"
            type="text"
            class="message-input"
            :placeholder="'Message ' + (chatStore.activeChat?.name || 'here') + '…'"
            v-model="messageText"
            @keydown.enter="sendMessage"
            @input="handleTyping"
          />
        </div>
        <!-- Emoji Quick Pick -->
        <div class="emoji-picker-wrap">
          <button class="btn-icon" @click="showEmojiPicker = !showEmojiPicker" title="Emoji">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/><line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/></svg>
          </button>
          <div class="emoji-dropdown" v-if="showEmojiPicker">
            <button v-for="e in quickEmojis" :key="e" class="emoji-btn" @click="insertEmoji(e)">{{ e }}</button>
          </div>
        </div>
        <button class="btn-send" @click="sendMessage" :disabled="!canSend" title="Send">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
        </button>
      </div>
    </div>
  </main>
</template>

<script setup>
import { ref, computed, watch, nextTick } from 'vue';
import { useAuthStore } from '../stores/authStore';
import { useChatStore } from '../stores/chatStore';
import { processUploadedFile } from '../services/fileService';
import MessageBubble from './MessageBubble.vue';

defineEmits(['open-profile', 'toggle-sidebar']);

const authStore = useAuthStore();
const chatStore = useChatStore();

const messageText = ref('');
const pendingFiles = ref([]);
const showEmojiPicker = ref(false);
const messagesContainer = ref(null);
const fileInput = ref(null);

const quickEmojis = ['😀', '❤️', '👍', '🔥', '🚀', '🎉', '💡', '👏', '😂', '🤔', '✅', '💯'];

let typingTimeout = null;

const canSend = computed(() => messageText.value.trim().length > 0 || pendingFiles.value.length > 0);

const typingText = computed(() => {
  const chatId = chatStore.activeChatId;
  const typers = chatStore.typingUsers[chatId];
  if (!typers) return '';
  const names = Object.values(typers).filter(n => n !== authStore.currentUser?.name);
  if (names.length === 0) return '';
  if (names.length === 1) return `${names[0]} is typing…`;
  return `${names.join(', ')} are typing…`;
});

watch(() => chatStore.activeMessages.length, () => {
  nextTick(() => scrollToBottom());
});

watch(() => chatStore.activeChatId, () => {
  nextTick(() => scrollToBottom());
});

function scrollToBottom() {
  if (messagesContainer.value) {
    messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight;
  }
}

function handleTyping() {
  chatStore.sendTypingStatus(true);
  clearTimeout(typingTimeout);
  typingTimeout = setTimeout(() => chatStore.sendTypingStatus(false), 2000);
}

async function sendMessage() {
  if (!canSend.value) return;
  
  let attachments = [];
  for (const file of pendingFiles.value) {
    try {
      const att = await processUploadedFile(file);
      attachments.push(att);
    } catch (e) {
      console.warn('File processing failed', e);
    }
  }

  chatStore.sendMessage({
    content: messageText.value,
    attachments,
    jobContext: chatStore.activeChat?.jobContext || null
  });

  messageText.value = '';
  pendingFiles.value = [];
  showEmojiPicker.value = false;
  chatStore.sendTypingStatus(false);
}

function triggerFileUpload() {
  fileInput.value?.click();
}

function handleFileSelect(event) {
  const files = Array.from(event.target.files);
  pendingFiles.value.push(...files);
  event.target.value = '';
}

function insertEmoji(emoji) {
  messageText.value += emoji;
  showEmojiPicker.value = false;
}

function handleReaction({ messageId, emoji }) {
  chatStore.toggleReaction(messageId, emoji);
}
</script>

<style scoped>
.chat-area {
  flex: 1;
  display: flex;
  flex-direction: column;
  height: 100vh;
  min-width: 0;
  background: var(--bg-chat);
  position: relative;
}

/* Chat Header */
.chat-header {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 14px 20px;
  border-bottom: 1px solid var(--border-color);
  z-index: 5;
  flex-shrink: 0;
}

.mobile-menu-btn {
  display: none;
}

.chat-header-info {
  flex: 1;
  min-width: 0;
}

.chat-header-top {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.chat-title {
  font-size: 1.05rem;
  font-weight: 700;
  display: flex;
  align-items: center;
  gap: 4px;
}

.hash-prefix {
  color: var(--primary-400);
  font-weight: 800;
}

.chat-header-badges {
  display: flex;
  gap: 6px;
}

.badge-private {
  background: rgba(244, 63, 94, 0.15);
  color: var(--accent-rose);
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 3px 8px;
  border-radius: var(--radius-full);
  font-size: 0.7rem;
  font-weight: 600;
}

.badge-job {
  background: rgba(99, 102, 241, 0.15);
  color: var(--primary-400);
  padding: 3px 10px;
  border-radius: var(--radius-full);
  font-size: 0.7rem;
  font-weight: 600;
}

.chat-desc {
  font-size: 0.8rem;
  color: var(--text-muted);
  margin-top: 2px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.chat-header-actions {
  display: flex;
  gap: 4px;
}

/* Messages Container */
.messages-container {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
  display: flex;
  flex-direction: column;
}

.messages-list {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

/* Empty State */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  flex: 1;
  gap: 12px;
  color: var(--text-subtle);
  padding: 40px;
  text-align: center;
}

.empty-icon {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  background: var(--bg-hover);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 8px;
  animation: pulseGlow 3s infinite;
}

.empty-state h3 {
  font-size: 1.1rem;
  color: var(--text-muted);
}

.empty-state p {
  font-size: 0.85rem;
}

/* Typing Indicator */
.typing-indicator {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  font-size: 0.8rem;
  color: var(--text-muted);
  animation: fadeIn 0.2s ease-out;
}

.typing-dots {
  display: flex;
  gap: 3px;
}

.typing-dots span {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--primary-400);
  animation: typingBounce 1.2s infinite;
}

.typing-dots span:nth-child(2) { animation-delay: 0.2s; }
.typing-dots span:nth-child(3) { animation-delay: 0.4s; }

/* Message Input Area */
.message-input-area {
  padding: 12px 20px;
  border-top: 1px solid var(--border-color);
  flex-shrink: 0;
}

.file-preview-bar {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  margin-bottom: 8px;
}

.file-preview-item {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 4px 10px;
  background: var(--bg-active);
  border-radius: var(--radius-sm);
  font-size: 0.78rem;
  color: var(--primary-400);
}

.file-preview-remove {
  font-size: 1rem;
  color: var(--text-muted);
  cursor: pointer;
  background: none;
  border: none;
  line-height: 1;
}

.input-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.input-wrapper {
  flex: 1;
}

.message-input {
  width: 100%;
  padding: 10px 16px;
  background: var(--bg-input);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-lg);
  color: var(--text-main);
  font-size: 0.92rem;
  transition: all var(--transition-fast);
}

.message-input:focus {
  border-color: var(--primary-500);
  box-shadow: 0 0 0 2px var(--primary-glow);
}

.message-input::placeholder {
  color: var(--text-subtle);
}

/* Emoji Picker */
.emoji-picker-wrap {
  position: relative;
}

.emoji-dropdown {
  position: absolute;
  bottom: 100%;
  right: 0;
  margin-bottom: 8px;
  background: var(--bg-card);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  padding: 8px;
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: 4px;
  box-shadow: var(--shadow-md);
  animation: fadeIn 0.2s ease-out;
  z-index: 20;
}

.emoji-btn {
  width: 36px;
  height: 36px;
  font-size: 1.2rem;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--radius-sm);
  transition: background var(--transition-fast);
  cursor: pointer;
  background: none;
  border: none;
}

.emoji-btn:hover {
  background: var(--bg-hover);
  transform: scale(1.15);
}

/* Send Button */
.btn-send {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: var(--msg-sent-bg);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all var(--transition-fast);
  box-shadow: var(--shadow-sm);
  cursor: pointer;
  border: none;
  flex-shrink: 0;
}

.btn-send:hover:not(:disabled) {
  transform: scale(1.08);
  box-shadow: var(--shadow-glow);
}

.btn-send:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

@media (max-width: 768px) {
  .mobile-menu-btn {
    display: flex;
  }
}
</style>

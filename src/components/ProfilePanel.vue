<template>
  <div class="profile-panel animate-slide-right">
    <div class="profile-panel-header">
      <h3>Profile Details</h3>
      <button class="btn-icon" @click="$emit('close')">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
      </button>
    </div>
    <div class="profile-panel-body" v-if="profileUser">
      <!-- Avatar -->
      <div class="profile-avatar-section">
        <div class="avatar avatar-xl" :style="{ backgroundColor: profileUser.color }">
          <img v-if="profileUser.avatar" :src="profileUser.avatar" :alt="profileUser.name" />
          <span v-else>{{ getInitials(profileUser.name) }}</span>
        </div>
        <span class="avatar-status-badge large" :class="'status-' + profileUser.status"></span>
      </div>

      <h2 class="profile-name">{{ profileUser.name }}</h2>
      <p class="profile-job-title">{{ profileUser.jobTitle }}</p>
      <span class="badge" :style="{ background: roleBgColor, color: roleColor }">{{ profileUser.role }}</span>

      <!-- Bio -->
      <div class="profile-section">
        <h4 class="profile-section-title">About</h4>
        <p class="profile-bio">{{ profileUser.bio }}</p>
      </div>

      <!-- Info Grid -->
      <div class="profile-info-grid">
        <div class="profile-info-item">
          <span class="info-label">Company</span>
          <span class="info-value">{{ profileUser.company }}</span>
        </div>
        <div class="profile-info-item">
          <span class="info-label">Location</span>
          <span class="info-value">{{ profileUser.location }}</span>
        </div>
        <div class="profile-info-item" v-if="profileUser.salaryExpectation && profileUser.salaryExpectation !== 'N/A'">
          <span class="info-label">Salary</span>
          <span class="info-value">{{ profileUser.salaryExpectation }}</span>
        </div>
        <div class="profile-info-item">
          <span class="info-label">Status</span>
          <span class="info-value status-tag">{{ profileUser.statusTag }}</span>
        </div>
      </div>

      <!-- Skills -->
      <div class="profile-section" v-if="profileUser.skills && profileUser.skills.length">
        <h4 class="profile-section-title">Skills</h4>
        <div class="profile-skills">
          <span v-for="skill in profileUser.skills" :key="skill" class="skill-tag">{{ skill }}</span>
        </div>
      </div>

      <!-- Action: Start DM -->
      <div class="profile-actions" v-if="profileUser.id !== authStore.currentUser?.id">
        <button class="btn-primary" @click="startDM">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
          Send Message
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { useAuthStore } from '../stores/authStore';
import { useChatStore } from '../stores/chatStore';

const emit = defineEmits(['close']);
const authStore = useAuthStore();
const chatStore = useChatStore();

const profileUser = computed(() => {
  const active = chatStore.activeChat;
  if (active && !active.isGroup && active.partner) {
    return active.partner;
  }
  return authStore.currentUser;
});

const roleColor = computed(() => {
  const role = profileUser.value?.role;
  if (role === 'Candidate') return 'var(--role-candidate)';
  if (role === 'Employer') return 'var(--role-employer)';
  if (role === 'Recruiter') return 'var(--role-recruiter)';
  return 'var(--text-muted)';
});

const roleBgColor = computed(() => {
  const role = profileUser.value?.role;
  if (role === 'Candidate') return 'var(--role-candidate-bg)';
  if (role === 'Employer') return 'var(--role-employer-bg)';
  if (role === 'Recruiter') return 'var(--role-recruiter-bg)';
  return 'var(--bg-hover)';
});

function getInitials(name) {
  if (!name) return '?';
  return name.split(' ').map(w => w[0]).join('').substring(0, 2).toUpperCase();
}

function startDM() {
  if (profileUser.value) {
    chatStore.startDirectMessage(profileUser.value.id);
    emit('close');
  }
}
</script>

<style scoped>
.profile-panel {
  width: 320px;
  min-width: 320px;
  height: 100vh;
  background: var(--bg-sidebar);
  border-left: 1px solid var(--border-color);
  display: flex;
  flex-direction: column;
  overflow-y: auto;
  z-index: 10;
}

.profile-panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  border-bottom: 1px solid var(--border-color);
}

.profile-panel-header h3 {
  font-size: 0.95rem;
}

.profile-panel-body {
  padding: 24px 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

.profile-avatar-section {
  position: relative;
  margin-bottom: 8px;
}

.avatar-status-badge.large {
  width: 16px;
  height: 16px;
  border-width: 3px;
}

.profile-name {
  font-size: 1.2rem;
  font-weight: 700;
  text-align: center;
}

.profile-job-title {
  font-size: 0.85rem;
  color: var(--text-muted);
  text-align: center;
}

.profile-section {
  width: 100%;
  margin-top: 20px;
}

.profile-section-title {
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--text-subtle);
  margin-bottom: 8px;
}

.profile-bio {
  font-size: 0.85rem;
  color: var(--text-muted);
  line-height: 1.6;
}

.profile-info-grid {
  width: 100%;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  margin-top: 20px;
}

.profile-info-item {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.info-label {
  font-size: 0.7rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--text-subtle);
}

.info-value {
  font-size: 0.85rem;
  color: var(--text-main);
  font-weight: 500;
}

.status-tag {
  color: var(--status-interviewing);
}

.profile-skills {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.skill-tag {
  padding: 4px 10px;
  background: var(--bg-hover);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-full);
  font-size: 0.78rem;
  color: var(--text-muted);
  font-weight: 500;
}

.profile-actions {
  width: 100%;
  margin-top: 24px;
}

.profile-actions .btn-primary {
  width: 100%;
}
</style>

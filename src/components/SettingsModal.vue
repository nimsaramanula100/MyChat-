<template>
  <div class="modal-overlay" @click.self="$emit('close')">
    <div class="modal-content">
      <div class="modal-header">
        <h3>Settings</h3>
        <button class="btn-icon" @click="$emit('close')">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>
      </div>
      <div class="modal-body">
        <!-- Theme Toggle -->
        <div class="settings-item">
          <div class="settings-label">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
            <span>Dark Mode</span>
          </div>
          <label class="toggle-switch">
            <input type="checkbox" v-model="darkMode" @change="toggleTheme" />
            <span class="toggle-slider"></span>
          </label>
        </div>

        <!-- Firebase Configuration Section -->
        <div class="settings-section">
          <h4 class="settings-section-title">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>
            Firebase Connection
          </h4>
          <p class="settings-hint">Connect your Firebase project for cloud sync & real-time features across devices.</p>

          <div class="firebase-status" :class="{ connected: isFirebaseConnected }">
            <span class="status-dot"></span>
            <span>{{ isFirebaseConnected ? 'Connected to Firebase' : 'Demo Mode (Local Only)' }}</span>
          </div>

          <div class="form-group">
            <label class="form-label">API Key</label>
            <input type="text" class="form-input" v-model="fbConfig.apiKey" placeholder="AIzaSy..." />
          </div>
          <div class="form-group">
            <label class="form-label">Auth Domain</label>
            <input type="text" class="form-input" v-model="fbConfig.authDomain" placeholder="your-app.firebaseapp.com" />
          </div>
          <div class="form-group">
            <label class="form-label">Project ID</label>
            <input type="text" class="form-input" v-model="fbConfig.projectId" placeholder="your-project-id" />
          </div>
          <div class="form-group">
            <label class="form-label">Storage Bucket</label>
            <input type="text" class="form-input" v-model="fbConfig.storageBucket" placeholder="your-app.appspot.com" />
          </div>
          <div class="form-group">
            <label class="form-label">Messaging Sender ID</label>
            <input type="text" class="form-input" v-model="fbConfig.messagingSenderId" placeholder="123456789" />
          </div>
          <div class="form-group">
            <label class="form-label">App ID</label>
            <input type="text" class="form-input" v-model="fbConfig.appId" placeholder="1:123456789:web:abc123" />
          </div>

          <div class="firebase-actions">
            <button class="btn-primary" @click="connectFirebase" :disabled="!canConnect">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>
              {{ isFirebaseConnected ? 'Reconnect' : 'Connect Firebase' }}
            </button>
            <button class="btn-secondary" v-if="isFirebaseConnected" @click="disconnectFirebase">Disconnect</button>
          </div>

          <div class="firebase-error" v-if="firebaseError">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
            {{ firebaseError }}
          </div>
        </div>

        <!-- Clear Data -->
        <div class="settings-item danger">
          <div class="settings-label">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
            <span>Clear All Chat Data</span>
          </div>
          <button class="btn-danger-sm" @click="clearData">Clear</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { initFirebase, saveFirebaseConfig, getStoredFirebaseConfig } from '../config/firebase';

defineEmits(['close']);

const darkMode = ref(document.body.classList.contains('dark-theme'));

const fbConfig = ref({
  apiKey: '',
  authDomain: '',
  projectId: '',
  storageBucket: '',
  messagingSenderId: '',
  appId: ''
});

const isFirebaseConnected = ref(false);
const firebaseError = ref('');

const canConnect = computed(() => {
  return fbConfig.value.apiKey && fbConfig.value.projectId;
});

onMounted(() => {
  const saved = getStoredFirebaseConfig();
  if (saved) {
    fbConfig.value = { ...fbConfig.value, ...saved };
    const result = initFirebase(saved);
    isFirebaseConnected.value = result.isFirebaseConfigured;
  }
});

function toggleTheme() {
  if (darkMode.value) {
    document.body.classList.add('dark-theme');
    document.body.classList.remove('light-theme');
  } else {
    document.body.classList.remove('dark-theme');
    document.body.classList.add('light-theme');
  }
  localStorage.setItem('mychat_theme', darkMode.value ? 'dark' : 'light');
}

function connectFirebase() {
  firebaseError.value = '';
  const config = { ...fbConfig.value };
  const result = initFirebase(config);

  if (result.isFirebaseConfigured) {
    saveFirebaseConfig(config);
    isFirebaseConnected.value = true;
  } else {
    firebaseError.value = result.error || 'Invalid Firebase configuration. Please check your credentials.';
    isFirebaseConnected.value = false;
  }
}

function disconnectFirebase() {
  saveFirebaseConfig(null);
  isFirebaseConnected.value = false;
  fbConfig.value = {
    apiKey: '',
    authDomain: '',
    projectId: '',
    storageBucket: '',
    messagingSenderId: '',
    appId: ''
  };
}

function clearData() {
  if (confirm('Are you sure you want to clear all chat data? This cannot be undone.')) {
    localStorage.removeItem('mychat_channels');
    localStorage.removeItem('mychat_dms');
    localStorage.removeItem('mychat_messages');
    localStorage.removeItem('mychat_users');
    localStorage.removeItem('mychat_current_user_id');
    window.location.reload();
  }
}
</script>

<style scoped>
.settings-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 0;
  border-bottom: 1px solid var(--border-color);
}

.settings-item.danger .settings-label span {
  color: var(--accent-rose);
}

.settings-label {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 0.9rem;
  font-weight: 500;
  color: var(--text-main);
}

/* Toggle Switch */
.toggle-switch {
  position: relative;
  width: 44px;
  height: 24px;
  display: inline-block;
}

.toggle-switch input { display: none; }

.toggle-slider {
  position: absolute;
  inset: 0;
  background: var(--bg-hover);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-full);
  cursor: pointer;
  transition: all var(--transition-normal);
}

.toggle-slider::before {
  content: '';
  position: absolute;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: var(--text-muted);
  top: 2px;
  left: 3px;
  transition: all var(--transition-normal);
}

.toggle-switch input:checked + .toggle-slider {
  background: var(--primary-500);
  border-color: var(--primary-600);
}

.toggle-switch input:checked + .toggle-slider::before {
  transform: translateX(19px);
  background: white;
}

/* Firebase Section */
.settings-section {
  margin-top: 20px;
  padding-top: 16px;
  border-top: 1px solid var(--border-color);
}

.settings-section-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.85rem;
  font-weight: 700;
  color: var(--text-main);
  margin-bottom: 8px;
}

.settings-hint {
  font-size: 0.8rem;
  color: var(--text-subtle);
  margin-bottom: 16px;
  line-height: 1.5;
}

.firebase-status {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 14px;
  border-radius: var(--radius-md);
  background: var(--bg-hover);
  font-size: 0.82rem;
  font-weight: 500;
  color: var(--text-muted);
  margin-bottom: 16px;
}

.firebase-status .status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--accent-amber);
}

.firebase-status.connected .status-dot {
  background: var(--accent-emerald);
  box-shadow: 0 0 8px rgba(16, 185, 129, 0.5);
}

.firebase-status.connected {
  color: var(--accent-emerald);
}

.firebase-actions {
  display: flex;
  gap: 10px;
  margin-top: 8px;
}

.firebase-error {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-top: 12px;
  padding: 8px 12px;
  background: rgba(244, 63, 94, 0.12);
  border-radius: var(--radius-sm);
  color: var(--accent-rose);
  font-size: 0.8rem;
}

.btn-danger-sm {
  padding: 6px 14px;
  border-radius: var(--radius-sm);
  background: rgba(244, 63, 94, 0.15);
  color: var(--accent-rose);
  font-size: 0.82rem;
  font-weight: 600;
  cursor: pointer;
  border: 1px solid rgba(244, 63, 94, 0.3);
  transition: all var(--transition-fast);
}

.btn-danger-sm:hover {
  background: rgba(244, 63, 94, 0.25);
}
</style>

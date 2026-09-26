<template>
  <div class="modal-overlay" @click.self="$emit('cancel')">
    <div class="modal-card preview-card animate-scale-up">
      <div class="modal-header">
        <h3>Attachment Preview</h3>
        <button class="btn-close" @click="$emit('cancel')">✕</button>
      </div>

      <div class="preview-body">
        <div v-if="toastMsg" class="toast-banner" :class="toastType">{{ toastMsg }}</div>

        <!-- Preview Area based on file type -->
        <div class="file-display-box">
          <!-- Image Preview -->
          <div v-if="fileType === 'image'" class="image-preview-container">
            <img :src="filePreviewUrl" class="img-preview" />
          </div>

          <!-- Video Preview -->
          <div v-else-if="fileType === 'video'" class="video-preview-container">
            <video :src="filePreviewUrl" controls class="vid-preview"></video>
          </div>

          <!-- Audio Preview -->
          <div v-else-if="fileType === 'audio'" class="audio-preview-container">
            <div class="audio-card-box">
              <span class="audio-icon">🎵</span>
              <div class="audio-info">
                <span class="filename">{{ file?.name }}</span>
                <span class="filesize">{{ formatFileSize(file?.size) }}</span>
              </div>
            </div>
            <audio :src="filePreviewUrl" controls class="audio-controls mt-2"></audio>
          </div>

          <!-- Document Preview Card -->
          <div v-else class="document-preview-container">
            <div class="doc-card-box">
              <span class="doc-type-badge" :class="docExtClass">{{ docExtension }}</span>
              <div class="doc-info">
                <span class="doc-filename">{{ file?.name }}</span>
                <span class="doc-filesize">{{ formatFileSize(file?.size) }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Caption Text Area -->
        <div class="form-group mt-3">
          <input 
            type="text" 
            v-model="caption" 
            placeholder="Add a caption..." 
            class="caption-input"
            @keyup.enter="handleSend"
            autofocus
          />
        </div>

        <!-- Actions -->
        <div class="preview-actions-bar mt-3">
          <button class="btn-secondary" @click="$emit('cancel')" :disabled="isUploading">Cancel</button>
          <button class="btn-primary flex-1" @click="handleSend" :disabled="isUploading">
            <span v-if="isUploading">Uploading Media...</span>
            <span v-else>Send Attachment ⚡</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';

const props = defineProps({
  file: {
    type: File,
    required: true
  }
});

const emit = defineEmits(['send', 'cancel']);

const caption = ref('');
const filePreviewUrl = ref('');
const isUploading = ref(false);
const toastMsg = ref('');
const toastType = ref('error');

const fileType = computed(() => {
  if (!props.file) return 'document';
  const mime = props.file.type || '';
  if (mime.startsWith('image/')) return 'image';
  if (mime.startsWith('video/')) return 'video';
  if (mime.startsWith('audio/')) return 'audio';
  return 'document';
});

const docExtension = computed(() => {
  if (!props.file || !props.file.name) return 'FILE';
  const parts = props.file.name.split('.');
  return parts.length > 1 ? parts.pop().toUpperCase() : 'FILE';
});

const docExtClass = computed(() => {
  const ext = docExtension.value.toLowerCase();
  if (ext === 'pdf') return 'pdf-badge';
  if (['doc', 'docx'].includes(ext)) return 'doc-badge';
  if (['xls', 'xlsx', 'csv'].includes(ext)) return 'xls-badge';
  if (['ppt', 'pptx'].includes(ext)) return 'ppt-badge';
  return 'file-badge';
});

onMounted(() => {
  if (props.file) {
    filePreviewUrl.value = URL.createObjectURL(props.file);
  }
});

function formatFileSize(bytes) {
  if (!bytes) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

function handleSend() {
  if (props.file && props.file.size > 50 * 1024 * 1024) {
    toastMsg.value = 'File size exceeds 50MB limit!';
    return;
  }
  emit('send', {
    file: props.file,
    caption: caption.value,
    type: fileType.value
  });
}
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  inset: 0;
  background-color: rgba(0, 0, 0, 0.8);
  backdrop-filter: blur(12px);
  z-index: 1400;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
}

.preview-card {
  width: 480px;
  max-width: 95vw;
  background: #1e293b;
  border: 1px solid #334155;
  border-radius: 1.25rem;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.6);
  overflow: hidden;
  color: #f8fafc;
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem 1.25rem;
  border-bottom: 1px solid #334155;
  background: #0f172a;
}

.modal-header h3 {
  font-size: 1.05rem;
  font-weight: 700;
  margin: 0;
}

.btn-close {
  background: transparent;
  border: none;
  color: #94a3b8;
  font-size: 1.2rem;
  cursor: pointer;
}

.preview-body {
  padding: 1.25rem;
}

.toast-banner {
  padding: 0.6rem 0.85rem;
  border-radius: 0.5rem;
  font-size: 0.85rem;
  margin-bottom: 1rem;
  background: rgba(239, 68, 68, 0.2);
  color: #f87171;
  border: 1px solid #ef4444;
}

.file-display-box {
  display: flex;
  align-items: center;
  justify-content: center;
  background: #0f172a;
  border-radius: 0.75rem;
  min-height: 200px;
  max-height: 320px;
  overflow: hidden;
  padding: 0.75rem;
}

.img-preview {
  max-width: 100%;
  max-height: 280px;
  object-fit: contain;
  border-radius: 0.5rem;
}

.vid-preview {
  max-width: 100%;
  max-height: 280px;
  border-radius: 0.5rem;
}

.audio-preview-container, .document-preview-container {
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.audio-card-box, .doc-card-box {
  display: flex;
  align-items: center;
  gap: 1rem;
  background: #1e293b;
  padding: 1rem 1.25rem;
  border-radius: 0.75rem;
  border: 1px solid #334155;
  width: 100%;
}

.audio-icon {
  font-size: 2.2rem;
}

.audio-info, .doc-info {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.filename, .doc-filename {
  font-weight: 600;
  font-size: 0.95rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  color: #fff;
}

.filesize, .doc-filesize {
  font-size: 0.8rem;
  color: #94a3b8;
}

.doc-type-badge {
  padding: 0.5rem 0.8rem;
  border-radius: 0.5rem;
  font-weight: 800;
  font-size: 0.9rem;
  color: #fff;
}

.pdf-badge { background: #ef4444; }
.doc-badge { background: #3b82f6; }
.xls-badge { background: #10b981; }
.ppt-badge { background: #f59e0b; }
.file-badge { background: #6366f1; }

.audio-controls {
  width: 100%;
}

.caption-input {
  width: 100%;
  background: #0f172a;
  border: 1px solid #334155;
  border-radius: 0.75rem;
  padding: 0.75rem 1rem;
  color: #fff;
  font-size: 0.95rem;
  outline: none;
}

.caption-input:focus {
  border-color: #6366f1;
}

.preview-actions-bar {
  display: flex;
  gap: 0.75rem;
}

.btn-primary {
  background: linear-gradient(135deg, #6366f1, #4f46e5);
  color: #fff;
  border: none;
  padding: 0.75rem 1.2rem;
  border-radius: 0.65rem;
  font-weight: 600;
  cursor: pointer;
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
</style>

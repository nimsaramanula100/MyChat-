<template>
  <div class="lightbox-overlay" @click.self="$emit('close')" @keydown.esc="$emit('close')" tabindex="0">
    <div class="lightbox-top-bar">
      <div class="lightbox-info">
        <span class="lightbox-title">{{ title || 'Media View' }}</span>
      </div>
      <div class="lightbox-actions">
        <a :href="mediaUrl" download target="_blank" class="btn-lightbox-action" title="Download Media">
          📥 Download
        </a>
        <button class="btn-lightbox-close" @click="$emit('close')" title="Close">✕</button>
      </div>
    </div>

    <div class="lightbox-content">
      <img v-if="isVideo" style="display:none;" />
      <video v-if="isVideo" :src="mediaUrl" controls autoplay class="lightbox-media"></video>
      <img v-else :src="mediaUrl" class="lightbox-media lightbox-img" alt="Enlarged media" />
    </div>

    <div v-if="caption" class="lightbox-caption-bar">
      <p>{{ caption }}</p>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  mediaUrl: {
    type: String,
    required: true
  },
  title: String,
  caption: String,
  type: String
});

defineEmits(['close']);

const isVideo = computed(() => {
  if (props.type === 'video') return true;
  if (props.mediaUrl) {
    const ext = props.mediaUrl.split('.').pop().toLowerCase();
    return ['mp4', 'webm', 'mov', 'avi'].includes(ext);
  }
  return false;
});
</script>

<style scoped>
.lightbox-overlay {
  position: fixed;
  inset: 0;
  background-color: rgba(0, 0, 0, 0.92);
  backdrop-filter: blur(16px);
  z-index: 2000;
  display: flex;
  flex-direction: column;
  outline: none;
  animation: fadeIn 0.2s ease-out;
}

.lightbox-top-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem 1.5rem;
  background: rgba(15, 23, 42, 0.8);
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  z-index: 2001;
}

.lightbox-title {
  font-weight: 600;
  font-size: 1.05rem;
  color: #f8fafc;
}

.lightbox-actions {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.btn-lightbox-action {
  background: rgba(99, 102, 241, 0.2);
  color: #a5b4fc;
  border: 1px solid rgba(99, 102, 241, 0.4);
  padding: 0.5rem 1rem;
  border-radius: 0.5rem;
  text-decoration: none;
  font-size: 0.85rem;
  font-weight: 600;
  transition: all 0.2s;
}

.btn-lightbox-action:hover {
  background: #6366f1;
  color: #fff;
}

.btn-lightbox-close {
  background: rgba(255, 255, 255, 0.1);
  color: #fff;
  border: none;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  font-size: 1.2rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.2s;
}

.btn-lightbox-close:hover {
  background: #ef4444;
}

.lightbox-content {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1.5rem;
  overflow: hidden;
}

.lightbox-media {
  max-width: 92vw;
  max-height: 82vh;
  object-fit: contain;
  border-radius: 0.75rem;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.7);
}

.lightbox-img {
  cursor: zoom-in;
  transition: transform 0.25s ease-out;
}

.lightbox-caption-bar {
  padding: 1rem 1.5rem;
  background: rgba(15, 23, 42, 0.9);
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  text-align: center;
  color: #e2e8f0;
  font-size: 0.95rem;
}
</style>

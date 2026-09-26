<template>
  <div class="modal-overlay" @click.self="$emit('cancel')">
    <div class="modal-card animate-scale-up">
      <div class="modal-header">
        <h3>📊 Create Poll</h3>
        <button class="btn-close" @click="$emit('cancel')">✕</button>
      </div>

      <div class="modal-body">
        <div class="form-group">
          <label class="input-label">Poll Question</label>
          <input 
            type="text" 
            v-model="question" 
            placeholder="Ask a question..." 
            class="poll-input"
            autofocus
          />
        </div>

        <div class="form-group mt-3">
          <label class="input-label">Options</label>
          <div class="options-list">
            <div v-for="(opt, idx) in options" :key="idx" class="option-row">
              <input 
                type="text" 
                v-model="options[idx]" 
                :placeholder="'Option ' + (idx + 1)" 
                class="poll-input"
              />
              <button 
                v-if="options.length > 2" 
                class="btn-remove-opt" 
                @click="removeOption(idx)"
                title="Remove Option"
              >✕</button>
            </div>
          </div>
          
          <button 
            v-if="options.length < 6" 
            class="btn-add-opt mt-2" 
            @click="addOption"
          >
            + Add Option
          </button>
        </div>

        <div v-if="errorMsg" class="error-banner mt-3">{{ errorMsg }}</div>

        <div class="modal-actions mt-4">
          <button class="btn-secondary" @click="$emit('cancel')">Cancel</button>
          <button class="btn-primary flex-1" @click="handleCreate">Create & Send Poll 📊</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';

const emit = defineEmits(['create', 'cancel']);

const question = ref('');
const options = ref(['', '']);
const errorMsg = ref('');

function addOption() {
  if (options.value.length < 6) {
    options.value.push('');
  }
}

function removeOption(idx) {
  if (options.value.length > 2) {
    options.value.splice(idx, 1);
  }
}

function handleCreate() {
  if (!question.value.trim()) {
    errorMsg.value = 'Please enter a poll question!';
    return;
  }
  const validOpts = options.value.map(o => o.trim()).filter(Boolean);
  if (validOpts.length < 2) {
    errorMsg.value = 'Please provide at least 2 options!';
    return;
  }

  emit('create', {
    question: question.value.trim(),
    options: validOpts.map((opt, i) => ({ id: `opt_${i}`, text: opt, votes: [] }))
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

.modal-card {
  width: 460px;
  max-width: 95vw;
  background: #1e293b;
  border: 1px solid #334155;
  border-radius: 1.25rem;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.6);
  color: #f8fafc;
  overflow: hidden;
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem 1.25rem;
  background: #0f172a;
  border-bottom: 1px solid #334155;
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

.modal-body {
  padding: 1.25rem;
}

.input-label {
  font-size: 0.85rem;
  font-weight: 600;
  color: #94a3b8;
  margin-bottom: 0.4rem;
  display: block;
}

.poll-input {
  width: 100%;
  padding: 0.75rem 1rem;
  background: #0f172a;
  border: 1px solid #334155;
  border-radius: 0.75rem;
  color: #fff;
  font-size: 0.95rem;
  outline: none;
}

.poll-input:focus {
  border-color: #6366f1;
}

.options-list {
  display: flex;
  flex-direction: column;
  gap: 0.55rem;
}

.option-row {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.btn-remove-opt {
  background: rgba(239, 68, 68, 0.2);
  color: #f87171;
  border: 1px solid rgba(239, 68, 68, 0.4);
  width: 36px;
  height: 36px;
  border-radius: 0.5rem;
  cursor: pointer;
}

.btn-add-opt {
  width: 100%;
  background: rgba(99, 102, 241, 0.15);
  color: #a5b4fc;
  border: 1px dashed rgba(99, 102, 241, 0.4);
  padding: 0.6rem;
  border-radius: 0.75rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-add-opt:hover {
  background: rgba(99, 102, 241, 0.3);
  color: #fff;
}

.error-banner {
  padding: 0.6rem;
  background: rgba(239, 68, 68, 0.2);
  color: #f87171;
  border: 1px solid #ef4444;
  border-radius: 0.5rem;
  font-size: 0.85rem;
}

.modal-actions {
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

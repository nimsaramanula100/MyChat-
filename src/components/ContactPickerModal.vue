<template>
  <div class="modal-overlay" @click.self="$emit('cancel')">
    <div class="modal-card animate-scale-up">
      <div class="modal-header">
        <h3>👤 Share Contact</h3>
        <button class="btn-close" @click="$emit('cancel')">✕</button>
      </div>

      <div class="modal-body">
        <input 
          type="text" 
          v-model="search" 
          placeholder="Search contacts by name or phone..." 
          class="search-input-modal"
        />

        <div class="contacts-list mt-3">
          <div v-if="filteredContacts.length === 0" class="empty-sub text-center py-4">
            No matching contacts found
          </div>

          <div 
            v-for="c in filteredContacts" 
            :key="c.id" 
            class="contact-select-item"
            @click="selectContact(c)"
          >
            <div class="avatar avatar-md">
              <img :src="c.avatar" :alt="c.display_name" />
            </div>
            <div class="contact-details">
              <span class="contact-name">{{ c.display_name }}</span>
              <span class="contact-phone">{{ c.phone_number }}</span>
            </div>
            <button class="btn-primary btn-xs">Select 👤</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { usePeopleStore } from '../stores/peopleStore';

const peopleStore = usePeopleStore();
const search = ref('');

const emit = defineEmits(['select', 'cancel']);

onMounted(() => {
  peopleStore.fetchContacts();
});

const filteredContacts = computed(() => {
  const q = search.value.toLowerCase().trim();
  if (!q) return peopleStore.contacts;
  return peopleStore.contacts.filter(c => 
    (c.display_name && c.display_name.toLowerCase().includes(q)) ||
    (c.phone_number && c.phone_number.includes(q)) ||
    (c.username && c.username.toLowerCase().includes(q))
  );
});

function selectContact(contact) {
  emit('select', {
    id: contact.id,
    displayName: contact.display_name,
    username: contact.username,
    phoneNumber: contact.phone_number,
    avatar: contact.avatar
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
  width: 440px;
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

.search-input-modal {
  width: 100%;
  padding: 0.75rem 1rem;
  background: #0f172a;
  border: 1px solid #334155;
  border-radius: 0.75rem;
  color: #fff;
  font-size: 0.95rem;
  outline: none;
}

.search-input-modal:focus {
  border-color: #6366f1;
}

.contacts-list {
  max-height: 320px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.contact-select-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem;
  background: #0f172a;
  border: 1px solid #334155;
  border-radius: 0.75rem;
  cursor: pointer;
  transition: all 0.2s;
}

.contact-select-item:hover {
  background: #334155;
  border-color: #6366f1;
}

.contact-details {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.contact-name {
  font-weight: 600;
  font-size: 0.9rem;
  color: #fff;
}

.contact-phone {
  font-size: 0.8rem;
  color: #94a3b8;
}

.avatar-md img {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  object-fit: cover;
}

.btn-primary {
  background: #6366f1;
  color: white;
  border: none;
  padding: 0.4rem 0.8rem;
  border-radius: 0.5rem;
  font-size: 0.8rem;
  font-weight: 600;
  cursor: pointer;
}
</style>

import { defineStore } from 'pinia';
import { api } from '../services/api.js';

export const usePeopleStore = defineStore('people', {
  state: () => ({
    nearbyPeople: [],
    searchResults: [],
    contacts: [],
    blockedUsers: [],
    isLocationEnabled: true,
    isLoading: false,
    selectedUserProfile: null
  }),

  actions: {
    async fetchNearbyPeople() {
      this.isLoading = true;
      try {
        const res = await api.getNearbyPeople();
        this.isLocationEnabled = res.enabled;
        this.nearbyPeople = res.people || [];
        return res;
      } finally {
        this.isLoading = false;
      }
    },

    async updateLocation(lat, lon, locName) {
      await api.updateLocation(lat, lon, locName);
      await this.fetchNearbyPeople();
    },

    async search(query) {
      if (!query || query.trim().length === 0) {
        this.searchResults = [];
        return;
      }
      this.isLoading = true;
      try {
        const res = await api.searchUsers(query);
        this.searchResults = res.users;
      } finally {
        this.isLoading = false;
      }
    },

    async fetchContacts() {
      const res = await api.getContacts();
      this.contacts = res.contacts;
      return res.contacts;
    },

    async addContact(userId, alias = '') {
      await api.addContact(userId, alias);
      await this.fetchContacts();
    },

    async reportUser(userId, category, description) {
      return await api.reportUser(userId, category, description);
    },

    async blockUser(userId) {
      await api.blockUser(userId);
      await this.fetchBlockedUsers();
    },

    async unblockUser(userId) {
      await api.unblockUser(userId);
      await this.fetchBlockedUsers();
    },

    async fetchBlockedUsers() {
      const res = await api.getBlockedUsers();
      this.blockedUsers = res.blocked;
      return res.blocked;
    }
  }
});

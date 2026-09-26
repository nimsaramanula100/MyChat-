import { defineStore } from 'pinia';
import { api } from '../services/api.js';

export const useAdminStore = defineStore('admin', {
  state: () => ({
    stats: null,
    users: [],
    reports: [],
    isLoading: false
  }),

  actions: {
    async fetchStats() {
      this.stats = await api.getAdminStats();
    },

    async fetchUsers() {
      const res = await api.getUsersList();
      this.users = res.users;
    },

    async toggleSuspend(userId) {
      await api.toggleUserSuspend(userId);
      await this.fetchUsers();
    },

    async fetchReports() {
      const res = await api.getReports();
      this.reports = res.reports;
    },

    async updateReportStatus(reportId, status) {
      await api.updateReportStatus(reportId, status);
      await this.fetchReports();
    }
  }
});

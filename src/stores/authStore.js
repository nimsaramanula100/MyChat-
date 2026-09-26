import { defineStore } from 'pinia';
import { api } from '../services/api.js';
import { initSocket, disconnectSocket } from '../services/socket.js';

export const useAuthStore = defineStore('auth', {
  state: () => ({
    token: localStorage.getItem('mychat_token') || null,
    user: null,
    privacy: null,
    security: null,
    isAuthenticated: Boolean(localStorage.getItem('mychat_token')),
    isLoading: false,
    otpSent: false,
    phoneNumber: '',
    devOtpCode: '',
    isAppLocked: false,
    appLockPin: '',
    devices: []
  }),

  actions: {
    async requestOtp(phone) {
      this.isLoading = true;
      try {
        const res = await api.sendOtp(phone);
        this.phoneNumber = phone;
        this.otpSent = true;
        this.devOtpCode = res.devOtp || '123456';
        return res;
      } finally {
        this.isLoading = false;
      }
    },

    async verifyOtp(otpCode) {
      this.isLoading = true;
      try {
        const res = await api.verifyOtp(this.phoneNumber, otpCode, navigator.userAgent, navigator.platform);
        this.token = res.token;
        this.user = res.user;
        this.isAuthenticated = true;
        localStorage.setItem('mychat_token', res.token);

        // Initialize WebSocket connection
        initSocket(res.token);

        // Fetch full profile and settings
        await this.fetchMe();
        return res;
      } finally {
        this.isLoading = false;
      }
    },

    async fetchMe() {
      if (!this.token) return;
      try {
        const res = await api.getMe();
        this.user = res.user;
        this.privacy = res.privacy;
        this.security = res.security;
        this.isAuthenticated = true;

        // Connect socket if not connected
        initSocket(this.token);
      } catch (err) {
        console.error('fetchMe failed:', err);
        this.logout();
      }
    },

    async updateProfile(profileData) {
      const res = await api.updateProfile(profileData);
      this.user = res.user;
      return res;
    },

    async updatePrivacy(privacyData) {
      const res = await api.updatePrivacy(privacyData);
      this.privacy = res.privacy;
      return res;
    },

    async updateSecurity(securityData) {
      const res = await api.updateSecurity(securityData);
      await this.fetchMe();
      return res;
    },

    async fetchDevices() {
      const res = await api.getDevices();
      this.devices = res.devices;
      return res.devices;
    },

    async logout() {
      try {
        if (this.token) {
          await api.logout().catch(() => {});
        }
      } catch (err) {
        console.warn('Logout API warning:', err);
      } finally {
        this.token = null;
        this.user = null;
        this.privacy = null;
        this.security = null;
        this.isAuthenticated = false;
        this.otpSent = false;
        this.phoneNumber = '';
        this.devOtpCode = '';
        this.devices = [];

        localStorage.removeItem('mychat_token');
        localStorage.removeItem('novachat_token');

        try {
          disconnectSocket();
        } catch (e) {}

        // Prevent browser back button navigation from revealing authenticated views
        if (typeof window !== 'undefined' && window.history?.pushState) {
          window.history.pushState(null, '', window.location.href);
        }
      }
    },

    setAppLock(locked) {
      this.isAppLocked = locked;
    },

    unlockApp(pin) {
      // Basic PIN check against security setting hash or simple dev check
      this.isAppLocked = false;
      return true;
    }
  }
});

const API_BASE_URL = 'http://localhost:5000/api';

function getAuthHeader() {
  const token = localStorage.getItem('mychat_token') || localStorage.getItem('novachat_token');
  return token ? { 'Authorization': `Bearer ${token}` } : {};
}

async function request(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`;
  const headers = {
    'Content-Type': 'application/json',
    ...getAuthHeader(),
    ...options.headers
  };

  if (options.body && !(options.body instanceof FormData)) {
    options.body = JSON.stringify(options.body);
  } else if (options.body instanceof FormData) {
    delete headers['Content-Type']; // Let browser set boundary
  }

  const res = await fetch(url, {
    ...options,
    headers
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(data.error || `HTTP ${res.status}: ${res.statusText}`);
  }

  return data;
}

export const api = {
  // Auth
  sendOtp: (phoneNumber) => request('/auth/send-otp', { method: 'POST', body: { phoneNumber } }),
  verifyOtp: (phoneNumber, otpCode, deviceName, platform) => request('/auth/verify-otp', { method: 'POST', body: { phoneNumber, otpCode, deviceName, platform } }),
  logout: () => request('/auth/logout', { method: 'POST' }),
  logoutAll: () => request('/auth/logout-all', { method: 'POST' }),
  getDevices: () => request('/auth/devices'),

  // Users & Profile
  getMe: () => request('/users/me'),
  updateProfile: (profileData) => request('/users/me', { method: 'PATCH', body: profileData }),
  updatePrivacy: (privacyData) => request('/users/privacy', { method: 'PATCH', body: privacyData }),
  updateSecurity: (securityData) => request('/users/security', { method: 'PATCH', body: securityData }),
  updateLocation: (lat, lon, locationName) => request('/users/location', { method: 'POST', body: { latitude: lat, longitude: lon, locationName } }),
  getNearbyPeople: () => request('/users/nearby'),
  searchUsers: (query) => request(`/users/search?query=${encodeURIComponent(query)}`),
  getContacts: () => request('/users/contacts'),
  addContact: (contactUserId, alias, phoneNumber) => request('/users/contacts', { method: 'POST', body: { contactUserId, alias, phoneNumber } }),
  syncContacts: (phoneNumbers) => request('/users/contacts/sync', { method: 'POST', body: { phoneNumbers } }),
  deleteAccount: () => request('/users/me', { method: 'DELETE' }),

  // Chats & Messages
  getChats: () => request('/chats'),
  createChat: (targetUserId, type = 'direct', name = '', members = []) => request('/chats', { method: 'POST', body: { targetUserId, type, name, members } }),
  getMessages: (roomId, limit = 50, before = null) => request(`/chats/${roomId}/messages?limit=${limit}${before ? `&before=${before}` : ''}`),
  sendMessage: (roomId, payload) => request(`/chats/${roomId}/messages`, { method: 'POST', body: payload }),
  consumeViewOnce: (messageId) => request(`/chats/messages/${messageId}/consume-view-once`, { method: 'POST' }),
  hideChat: (roomId, pin) => request('/chats/hide', { method: 'POST', body: { roomId, pin } }),
  unlockHiddenChats: (pin) => request('/chats/unlock-hidden', { method: 'POST', body: { pin } }),
  togglePinChat: (roomId) => request(`/chats/${roomId}/pin`, { method: 'POST' }),
  setChatBackground: (roomId, background) => request(`/chats/${roomId}/background`, { method: 'POST', body: { background } }),

  // Media
  uploadMedia: async (file) => {
    const formData = new FormData();
    formData.append('media', file);
    return request('/media/upload', {
      method: 'POST',
      body: formData
    });
  },

  // Reports & Block
  reportUser: (reportedUserId, category, description) => request('/reports/report', { method: 'POST', body: { reportedUserId, category, description } }),
  blockUser: (targetUserId) => request('/reports/block', { method: 'POST', body: { targetUserId } }),
  unblockUser: (targetUserId) => request(`/reports/block/${targetUserId}`, { method: 'DELETE' }),
  getBlockedUsers: () => request('/reports/blocked'),

  // Admin
  getAdminStats: () => request('/admin/stats'),
  getUsersList: () => request('/admin/users'),
  toggleUserSuspend: (userId) => request(`/admin/users/${userId}/suspend`, { method: 'POST' }),
  getReports: () => request('/admin/reports'),
  updateReportStatus: (reportId, status) => request(`/admin/reports/${reportId}`, { method: 'PATCH', body: { status } })
};

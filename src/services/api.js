import { API_BASE_URL } from '../config/backend.js';

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

  let res;
  try {
    res = await fetch(url, {
      ...options,
      headers
    });
  } catch (error) {
    if (error instanceof TypeError) {
      throw new Error(`Could not reach the API at ${url}. Check the backend URL, server status, and CORS configuration.`, { cause: error });
    }
    throw error;
  }

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(data.error || `HTTP ${res.status}: ${res.statusText}`);
  }

  return data;
}

export const api = {
  // Auth
  register: (email, password, displayName) => request('/auth/register', { method: 'POST', body: { email, password, displayName } }),
  login: (email, password) => request('/auth/login', { method: 'POST', body: { email, password } }),
  logout: () => request('/auth/logout', { method: 'POST' }),
  logoutAll: () => request('/auth/logout-all', { method: 'POST' }),
  getDevices: () => request('/auth/devices'),

  // Users & Profile
  getMe: () => request('/users/me'),
  updateProfile: (profileData) => request('/users/me', { method: 'PATCH', body: profileData }),
  updatePrivacy: (privacyData) => request('/users/privacy', { method: 'PATCH', body: privacyData }),
  updateSecurity: (securityData) => request('/users/security', { method: 'PATCH', body: securityData }),
  searchUsers: (query) => request(`/users/search?query=${encodeURIComponent(query)}`),
  getContacts: () => request('/users/contacts'),
  addContact: (contactUserId, alias, phoneNumber) => request('/users/contacts', { method: 'POST', body: { contactUserId, alias, phoneNumber } }),
  syncContacts: (phoneNumbers) => request('/users/contacts/sync', { method: 'POST', body: { phoneNumbers } }),
  deleteAccount: () => request('/users/me', { method: 'DELETE' }),

  // Chats & Messages
  getChats: () => request('/chats'),
  createChat: (targetUserId, type = 'direct', name = '', members = [], avatar = '') => request('/chats', { method: 'POST', body: { targetUserId, type, name, members, avatar } }),
  getGroupInfo: (roomId) => request(`/chats/${roomId}/group-info`),
  updateGroupInfo: (roomId, name, avatar) => request(`/chats/${roomId}/group-info`, { method: 'PATCH', body: { name, avatar } }),
  addGroupMembers: (roomId, members) => request(`/chats/${roomId}/members`, { method: 'POST', body: { members } }),
  removeGroupMember: (roomId, targetUserId) => request(`/chats/${roomId}/members/${targetUserId}`, { method: 'DELETE' }),
  leaveGroup: (roomId) => request(`/chats/${roomId}/leave`, { method: 'POST' }),
  getMessages: (roomId, limit = 50, before = null) => request(`/chats/${roomId}/messages?limit=${limit}${before ? `&before=${before}` : ''}`),
  sendMessage: (roomId, payload) => request(`/chats/${roomId}/messages`, { method: 'POST', body: payload }),
  consumeViewOnce: (messageId) => request(`/chats/messages/${messageId}/consume-view-once`, { method: 'POST' }),
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

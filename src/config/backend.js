const configuredServerUrl = import.meta.env.VITE_API_URL?.trim();

export const SERVER_URL = (
  configuredServerUrl || ''
).replace(/\/+$/, '');

export const API_BASE_URL = `${SERVER_URL}/api`;
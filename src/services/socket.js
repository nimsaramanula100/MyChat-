import { io } from 'socket.io-client';

let socket = null;
const eventListeners = new Map();

export function initSocket(token) {
  if (socket) {
    socket.disconnect();
  }

  const socketUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
  socket = io(socketUrl, {
    auth: { token },
    transports: ['websocket', 'polling']
  });

  socket.on('connect', () => {
    console.log('⚡ Socket connected:', socket.id);
  });

  socket.on('disconnect', (reason) => {
    console.log('⚡ Socket disconnected:', reason);
  });

  // Re-attach registered listeners
  eventListeners.forEach((callbacks, event) => {
    callbacks.forEach(cb => socket.on(event, cb));
  });

  return socket;
}

export function getSocket() {
  return socket;
}

export function onSocketEvent(event, callback) {
  if (!eventListeners.has(event)) {
    eventListeners.set(event, []);
  }
  eventListeners.get(event).push(callback);

  if (socket) {
    socket.on(event, callback);
  }
}

export function offSocketEvent(event, callback) {
  if (eventListeners.has(event)) {
    const list = eventListeners.get(event).filter(cb => cb !== callback);
    eventListeners.set(event, list);
  }
  if (socket) {
    socket.off(event, callback);
  }
}

export function emitSocketEvent(event, data, callback) {
  if (socket && socket.connected) {
    socket.emit(event, data, callback);
  } else {
    console.warn('Socket not connected. Event queued/ignored:', event);
  }
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}

import { io } from 'socket.io-client';

let socket = null;

/**
 * Returns a singleton authenticated Socket.io connection. Reuses the same
 * connection across the exam flow rather than reconnecting per component.
 */
export function getSocket() {
  if (socket && socket.connected) return socket;

  const token = localStorage.getItem('gstprep_token');
  const baseUrl = (import.meta.env.VITE_API_URL || '/api').replace(/\/api\/?$/, '');

  socket = io(baseUrl, {
    auth: { token },
    transports: ['websocket', 'polling'],
    autoConnect: true,
  });

  return socket;
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}

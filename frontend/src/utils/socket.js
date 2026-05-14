// utils/socket.js
import { io } from 'socket.io-client';

const SOCKET_URL = 'http://192.168.1.102:5000';

export const socket = io(SOCKET_URL, {
  autoConnect: false,
  transports: ['polling', 'websocket'],
  reconnection: true,
  reconnectionAttempts: 10,
  reconnectionDelay: 1000
});

// Track which user rooms we've joined to avoid duplicates
const joinedUserRooms = new Set();

export const connectSocket = (userId) => {
  // Connect socket if not already connected
  if (!socket.connected) {
    socket.connect();
  }

  // ✅ ALWAYS attempt to join user room if userId provided
  if (userId && !joinedUserRooms.has(userId)) {
    const room = `user_${userId}`;

    if (socket.connected) {
      // Socket already connected → join room immediately
      socket.emit('join_user_room', { user_id: userId });
      joinedUserRooms.add(userId);
      console.log(`✅ Joined room: ${room}`);
    } else {
      // Socket not connected yet → join when connect event fires
      const handleConnect = () => {
        socket.emit('join_user_room', { user_id: userId });
        joinedUserRooms.add(userId);
        console.log(`✅ Joined room on connect: ${room}`);
        socket.off('connect', handleConnect); // Clean up
      };
      socket.on('connect', handleConnect);
    }
  }
};

export const disconnectSocket = (userId) => {
  if (userId) {
    socket.emit('leave_user_room', { user_id: userId });
    joinedUserRooms.delete(userId);
  }
  socket.disconnect();
};

export const isSocketConnected = () => socket.connected;
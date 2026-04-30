import { io } from 'socket.io-client';

const SOCKET_URL = 'http://127.0.0.1:5000';

export const socket = io(SOCKET_URL, {
  autoConnect: false,
  transports: ['websocket', 'polling']
});

export const connectSocket = (userId) => {
  if (!socket.connected) {
    socket.connect();

    socket.on('connect', () => {
      console.log('✅ WebSocket Connected');

      if (userId) {
        socket.emit('join_user_room', { user_id: userId });
      }
    });

    socket.on('disconnect', () => {
      console.log('❌ WebSocket Disconnected');
    });

    socket.on('connection_response', (data) => {
      console.log('Server says:', data.message);
    });
  }
};

export const disconnectSocket = (userId) => {
  if (userId) {
    socket.emit('leave_user_room', { user_id: userId });
  }
  socket.disconnect();
};
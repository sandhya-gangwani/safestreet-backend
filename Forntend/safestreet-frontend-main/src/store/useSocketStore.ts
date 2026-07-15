import { create } from 'zustand';
import { io, Socket } from 'socket.io-client';

interface SocketState {
  socket: Socket | null;
  isConnected: boolean;
  connect: () => void;
  disconnect: () => void;
}

export const useSocketStore = create<SocketState>((set, get) => ({
  socket: null,
  isConnected: false,
  connect: () => {
    const { socket } = get();
    if (socket?.connected) return;

    // Connect to the incidents namespace
    const newSocket = io('http://localhost:3000/api/incidents', {
      withCredentials: true,
      transports: ['websocket'],
    });

    newSocket.on('connect', () => {
      set({ isConnected: true });
    });

    newSocket.on('disconnect', () => {
      set({ isConnected: false });
    });

    // Listen for new incidents globally
    newSocket.on('new-incident', (incident) => {
      console.log('New incident received via WebSocket:', incident);
    });

    set({ socket: newSocket });
  },
  disconnect: () => {
    const { socket } = get();
    if (socket) {
      socket.disconnect();
      set({ socket: null, isConnected: false });
    }
  },
}));

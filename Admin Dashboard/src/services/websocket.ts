import { io, Socket } from 'socket.io-client';
import type { WebSocketMessage, Ride, Puller, DashboardStats } from '../types';

const WS_URL = import.meta.env.VITE_WS_URL || 'http://localhost:8000';
const USE_MOCK = import.meta.env.VITE_USE_MOCK_DATA === 'true';

type EventCallback = (data: any) => void;

class WebSocketService {
  private socket: Socket | null = null;
  private connected: boolean = false;
  private eventHandlers: Map<string, EventCallback[]> = new Map();
  private mockInterval: NodeJS.Timeout | null = null;

  connect(token: string): void {
    if (USE_MOCK) {
      this.connectMock();
      return;
    }

    if (this.socket?.connected) {
      console.log('WebSocket already connected');
      return;
    }

    this.socket = io(WS_URL, {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
    });

    this.socket.on('connect', () => {
      console.log('WebSocket connected');
      this.connected = true;
      this.emit('connection_status', { connected: true });
    });

    this.socket.on('disconnect', () => {
      console.log('WebSocket disconnected');
      this.connected = false;
      this.emit('connection_status', { connected: false });
    });

    this.socket.on('error', (error) => {
      console.error('WebSocket error:', error);
      this.emit('error', error);
    });

    // Real-time event handlers
    this.socket.on('ride_update', (data: Ride) => {
      this.emit('ride_update', data);
    });

    this.socket.on('puller_location', (data: Puller) => {
      this.emit('puller_location', data);
    });

    this.socket.on('stats_update', (data: DashboardStats) => {
      this.emit('stats_update', data);
    });

    this.socket.on('review_created', (data: any) => {
      this.emit('review_created', data);
    });

    this.socket.on('user_status', (data: any) => {
      this.emit('user_status', data);
    });
  }

  private connectMock(): void {
    console.log('Using mock WebSocket');
    this.connected = true;
    this.emit('connection_status', { connected: true });

    // Simulate real-time updates
    this.mockInterval = setInterval(() => {
      // Simulate puller location updates
      const mockPullerId = `plr_00${Math.floor(Math.random() * 5) + 1}`;
      this.emit('puller_location', {
        id: mockPullerId,
        location: {
          latitude: 0.33 + Math.random() * 0.03,
          longitude: 32.57 + Math.random() * 0.05,
        },
        timestamp: new Date().toISOString(),
      });

      // Randomly emit stats updates
      if (Math.random() > 0.7) {
        this.emit('stats_update', {
          activeRides: Math.floor(Math.random() * 10) + 20,
          onlinePullers: Math.floor(Math.random() * 20) + 70,
        });
      }
    }, 3000);
  }

  disconnect(): void {
    if (this.mockInterval) {
      clearInterval(this.mockInterval);
      this.mockInterval = null;
    }

    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }

    this.connected = false;
    this.eventHandlers.clear();
  }

  on(event: string, callback: EventCallback): void {
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, []);
    }
    this.eventHandlers.get(event)!.push(callback);
  }

  off(event: string, callback: EventCallback): void {
    const handlers = this.eventHandlers.get(event);
    if (handlers) {
      const index = handlers.indexOf(callback);
      if (index > -1) {
        handlers.splice(index, 1);
      }
    }
  }

  private emit(event: string, data: any): void {
    const handlers = this.eventHandlers.get(event);
    if (handlers) {
      handlers.forEach((handler) => handler(data));
    }
  }

  send(event: string, data: any): void {
    if (USE_MOCK) {
      console.log('Mock WebSocket send:', event, data);
      return;
    }

    if (this.socket?.connected) {
      this.socket.emit(event, data);
    } else {
      console.error('Cannot send message: WebSocket not connected');
    }
  }

  isConnected(): boolean {
    return this.connected;
  }
}

export const websocketService = new WebSocketService();
export default websocketService;


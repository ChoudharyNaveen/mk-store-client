/**
 * Socket.IO Service
 * Manages WebSocket connection for real-time notifications
 */

import { io, Socket } from 'socket.io-client';
import config from '../config/env';

class SocketService {
  private socket: Socket | null = null;
  private isConnected = false;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectTimeout: NodeJS.Timeout | null = null;
  private connectionParams: {
    token: string;
    userId: number;
    userType: string;
    vendorId?: number | null;
    branchId?: number | null;
  } | null = null;

  connect(token: string, userId: number, userType: string, vendorId?: number | null, branchId?: number | null): Socket | null {
    // Store connection parameters for reconnection
    this.connectionParams = { token, userId, userType, vendorId, branchId };

    // If already connected, just return the socket
    if (this.socket?.connected) {
      return this.socket;
    }

    // If socket exists but not connected, disconnect it first
    if (this.socket) {
      this.socket.removeAllListeners();
      this.socket.disconnect();
      this.socket = null;
    }

    // Extract base URL from API URL (remove /api suffix if present)
    const baseUrl = config.apiBaseUrl.replace(/\/api$/, '');
    
    this.socket = io(baseUrl, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: this.maxReconnectAttempts,
      timeout: 20000,
      auth: {
        token,
      },
    });

    this.setupEventHandlers(userId, userType, vendorId, branchId);

    return this.socket;
  }

  private setupEventHandlers(
    userId: number,
    userType: string,
    vendorId?: number | null,
    branchId?: number | null
  ): void {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      console.log('Socket connected:', this.socket?.id);
      this.isConnected = true;
      this.reconnectAttempts = 0;
      
      // Authenticate with user details
      this.socket?.emit('authenticate', {
        userId,
        userType,
        vendorId: vendorId || null,
        branchId: branchId || null,
      });
    });

    this.socket.on('authenticated', (data: unknown) => {
      console.log('Socket authenticated:', data);
    });

    this.socket.on('disconnect', (reason: string) => {
      console.log('Socket disconnected. Reason:', reason);
      this.isConnected = false;

      // Only attempt manual reconnection if it wasn't intentional
      if (reason === 'io server disconnect') {
        // Server disconnected the socket, need to reconnect manually
        this.handleReconnect();
      } else if (reason === 'io client disconnect') {
        // Client disconnected intentionally, don't reconnect
        console.log('Client disconnected intentionally');
      } else {
        // Connection lost, will auto-reconnect
        console.log('Connection lost, attempting to reconnect...');
      }
    });

    this.socket.on('reconnect', (attemptNumber: number) => {
      console.log('Socket reconnected after', attemptNumber, 'attempts');
      this.isConnected = true;
      this.reconnectAttempts = 0;
      
      // Re-authenticate after reconnection
      if (this.connectionParams) {
        this.socket?.emit('authenticate', {
          userId: this.connectionParams.userId,
          userType: this.connectionParams.userType,
          vendorId: this.connectionParams.vendorId || null,
          branchId: this.connectionParams.branchId || null,
        });
      }
    });

    this.socket.on('reconnect_attempt', (attemptNumber: number) => {
      console.log('Reconnection attempt', attemptNumber);
      this.reconnectAttempts = attemptNumber;
    });

    this.socket.on('reconnect_error', (error: unknown) => {
      console.error('Reconnection error:', error);
    });

    this.socket.on('reconnect_failed', () => {
      console.error('Reconnection failed after', this.maxReconnectAttempts, 'attempts');
      // Try manual reconnection after a delay
      this.handleReconnect();
    });

    this.socket.on('error', (error: unknown) => {
      console.error('Socket error:', error);
      // Don't disconnect on error, let it handle reconnection
    });

    this.socket.on('connect_error', (error: Error) => {
      console.error('Socket connection error:', error.message);
      // Connection will automatically retry
    });
  }

  private handleReconnect(): void {
    if (!this.connectionParams) return;
    
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
    }

    // Wait before attempting reconnection
    this.reconnectTimeout = setTimeout(() => {
      if (this.reconnectAttempts < this.maxReconnectAttempts) {
        console.log('Attempting manual reconnection...');
        this.connect(
          this.connectionParams!.token,
          this.connectionParams!.userId,
          this.connectionParams!.userType,
          this.connectionParams!.vendorId,
          this.connectionParams!.branchId
        );
      }
    }, 3000);
  }

  disconnect(): void {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }

    if (this.socket) {
      this.socket.removeAllListeners();
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
      this.connectionParams = null;
      this.reconnectAttempts = 0;
    }
  }

  onNotification(callback: (notification: unknown) => void): void {
    if (this.socket) {
      this.socket.on('notification', callback);
    }
  }

  offNotification(callback: (notification: unknown) => void): void {
    if (this.socket) {
      this.socket.off('notification', callback);
    }
  }

  markNotificationRead(notificationId: number): void {
    if (this.socket) {
      this.socket.emit('mark_notification_read', { notificationId });
    }
  }

  getSocket(): Socket | null {
    return this.socket;
  }

  getIsConnected(): boolean {
    return this.isConnected;
  }
}

export default new SocketService();

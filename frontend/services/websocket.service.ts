/**
 * WebSocket Service
 *
 * Manages real-time WebSocket connection for location updates
 * Connection: wss://linda/ws?userId={userId}
 */

import { WS_URL } from '@/constants/config';
import type {
  WSClientMessage,
  WSServerMessage,
  WSFriendLocation,
  WSSync,
  User,
} from '@/types';

type ConnectionStatus = 'disconnected' | 'connecting' | 'connected';

class WebSocketService {
  private ws: WebSocket | null = null;
  private userId: string | null = null;
  private status: ConnectionStatus = 'disconnected';
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000; // Start with 1 second

  // Event listeners
  private onConnectedCallback: ((userId: string) => void) | null = null;
  private onFriendLocationCallback: ((friend: Omit<User, 'nationality' | 'gender'>) => void) | null = null;
  private onSyncCallback: ((friends: Omit<User, 'nationality' | 'gender'>[]) => void) | null = null;
  private onDisconnectedCallback: (() => void) | null = null;
  private onErrorCallback: ((error: string) => void) | null = null;

  /**
   * Connect to WebSocket server
   */
  connect(userId: string): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.status === 'connected' && this.userId === userId) {
        resolve();
        return;
      }

      this.userId = userId;
      this.status = 'connecting';

      // Convert HTTP URL to WebSocket URL
      const url = `${WS_URL}?userId=${userId}`;

      console.log('📡 Connecting to WebSocket:', url);

      try {
        this.ws = new WebSocket(url);

        let resolved = false;

        this.ws.onopen = () => {
          console.log('✅ WebSocket opened');
          this.status = 'connected';
          this.reconnectAttempts = 0;

          // Don't resolve until we get the first message (connected confirmation)
          // This prevents the promise from resolving before the connection is stable
        };

        this.ws.onmessage = (event) => {
          const data = this.handleMessage(event.data);

          // Resolve on first successful message (connected confirmation)
          if (!resolved && data?.type === 'connected') {
            resolved = true;
            resolve();
          }
        };

        this.ws.onerror = (error) => {
          console.error('❌ WebSocket error:', error);
          this.status = 'disconnected';
          this.onErrorCallback?.('WebSocket connection error');

          // Only reject if we haven't resolved yet
          if (!resolved) {
            resolved = true;
            reject(error);
          }
        };

        this.ws.onclose = (event) => {
          console.log('🔌 WebSocket closed. Code:', event.code, 'Reason:', event.reason);
          this.status = 'disconnected';
          this.ws = null;
          this.onDisconnectedCallback?.();

          // Only attempt reconnect if we had successfully connected before
          if (resolved) {
            this.attemptReconnect();
          }
        };
      } catch (error) {
        console.error('❌ Failed to create WebSocket:', error);
        this.status = 'disconnected';
        this.onErrorCallback?.('Failed to create WebSocket connection');
        reject(error);
      }
    });
  }

  /**
   * Disconnect from WebSocket server
   */
  disconnect(): void {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.status = 'disconnected';
    this.userId = null;
    this.reconnectAttempts = 0;
  }

  /**
   * Send location update to server
   */
  sendLocationUpdate(
    latitude: number,
    longitude: number,
    city?: string,
    country?: string
  ): void {
    const message: WSClientMessage = {
      type: 'location_update',
      latitude,
      longitude,
      city,
      country,
    };
    this.send(message);
  }

  /**
   * Send ping to keep connection alive
   */
  sendPing(): void {
    this.send({ type: 'ping' });
  }

  /**
   * Get current connection status
   */
  getStatus(): ConnectionStatus {
    return this.status;
  }

  /**
   * Check if connected
   */
  isConnected(): boolean {
    return this.status === 'connected' && this.ws !== null;
  }

  // Event listener setters
  onConnected(callback: (userId: string) => void): void {
    this.onConnectedCallback = callback;
  }

  onFriendLocation(callback: (friend: Omit<User, 'nationality' | 'gender'>) => void): void {
    this.onFriendLocationCallback = callback;
  }

  onSync(callback: (friends: Omit<User, 'nationality' | 'gender'>[]) => void): void {
    this.onSyncCallback = callback;
  }

  onDisconnected(callback: () => void): void {
    this.onDisconnectedCallback = callback;
  }

  onError(callback: (error: string) => void): void {
    this.onErrorCallback = callback;
  }

  /**
   * Send message to server
   */
  private send(message: WSClientMessage): void {
    if (!this.ws || this.status !== 'connected') {
      console.warn('⚠️ WebSocket not connected, cannot send message');
      return;
    }

    try {
      this.ws.send(JSON.stringify(message));
    } catch (error) {
      console.error('❌ Failed to send message:', error);
      this.onErrorCallback?.('Failed to send message');
    }
  }

  /**
   * Handle incoming message from server
   */
  private handleMessage(data: string): WSServerMessage | null {
    try {
      const message: WSServerMessage = JSON.parse(data);

      switch (message.type) {
        case 'connected':
          console.log('🔗 Connected to server:', message.userId);
          this.onConnectedCallback?.(message.userId);
          break;

        case 'friend_location':
          console.log('📍 Friend location update:', message.userId);
          this.onFriendLocationCallback?.(message);
          break;

        case 'sync':
          console.log('🔄 Initial sync:', message.friends.length, 'friends');
          this.onSyncCallback?.(message.friends);
          break;

        case 'pong':
          console.log('🏓 Pong received');
          break;

        default:
          console.warn('⚠️ Unknown message type:', message);
      }

      return message;
    } catch (error) {
      console.error('❌ Failed to parse message:', error);
      this.onErrorCallback?.('Failed to parse server message');
      return null;
    }
  }

  /**
   * Attempt to reconnect with exponential backoff
   */
  private attemptReconnect(): void {
    if (!this.userId || this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.log('❌ Max reconnect attempts reached');
      this.onErrorCallback?.('Max reconnect attempts reached');
      return;
    }

    this.reconnectAttempts++;
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);

    console.log(
      `🔄 Attempting reconnect ${this.reconnectAttempts}/${this.maxReconnectAttempts} in ${delay}ms`
    );

    setTimeout(() => {
      if (this.userId) {
        this.connect(this.userId).catch((error) => {
          console.error('❌ Reconnect failed:', error);
        });
      }
    }, delay);
  }
}

// Export singleton instance
export const websocketService = new WebSocketService();

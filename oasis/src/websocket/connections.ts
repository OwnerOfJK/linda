import { WebSocket } from 'ws';

/**
 * Manages WebSocket connections for all users
 */
export class WebSocketConnectionManager {
  private connections = new Map<string, WebSocket>();

  /**
   * Store a WebSocket connection for a user
   */
  set(userId: string, ws: WebSocket): void {
    this.connections.set(userId, ws);
    console.log(`🔌 WebSocket connected: ${userId} (total: ${this.connections.size})`);
  }

  /**
   * Get a WebSocket connection for a user
   */
  get(userId: string): WebSocket | undefined {
    return this.connections.get(userId);
  }

  /**
   * Remove a WebSocket connection for a user
   */
  delete(userId: string): void {
    this.connections.delete(userId);
    console.log(`👋 WebSocket disconnected: ${userId} (total: ${this.connections.size})`);
  }

  /**
   * Get the total number of active connections
   */
  getSize(): number {
    return this.connections.size;
  }

  /**
   * Broadcast message to specific users
   */
  broadcastToUsers(userIds: string[], message: any): void {
    const messageStr = JSON.stringify(message);
    let sentCount = 0;
    let notConnectedCount = 0;

    userIds.forEach((userId) => {
      const ws = this.connections.get(userId);
      if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(messageStr);
        sentCount++;
        console.log(`✅ [Broadcast] Sent to ${userId}`);
      } else {
        notConnectedCount++;
        console.log(`⚠️ [Broadcast] Friend ${userId} is not connected`);
      }
    });

    console.log(`📤 [Broadcast] Summary - Sent to ${sentCount} users, ${notConnectedCount} not connected`);
  }
}

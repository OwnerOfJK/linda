import { WebSocketServer, WebSocket } from 'ws';
import http from 'http';
import url from 'url';
import type { LocationService } from '../services/location.service';
import type { FriendshipService } from '../services/friendship.service';
import { WebSocketConnectionManager } from './connections';
import { handleLocationUpdate } from './handlers';

/**
 * Setup WebSocket server with location and friendship services
 */
export function setupWebSocket(
  server: http.Server,
  locationService: LocationService,
  friendshipService: FriendshipService
): WebSocketConnectionManager {
  const wss = new WebSocketServer({ server });
  const wsManager = new WebSocketConnectionManager();

  wss.on('connection', (ws: WebSocket, req: http.IncomingMessage) => {
    // Parse userId from query params
    const parsedUrl = url.parse(req.url || '', true);
    const userId = parsedUrl.query.userId as string;

    if (!userId) {
      ws.close(1008, 'userId required');
      return;
    }

    console.log(`🔌 WebSocket connection request from: ${userId}`);

    // Store connection
    wsManager.set(userId, ws);

    // Send connected confirmation
    ws.send(JSON.stringify({ type: 'connected', userId }));

    // Send initial sync with friends' locations
    const friendsLocations = locationService.getFriendsLocationsWithPrivacy(userId);
    ws.send(JSON.stringify({ type: 'sync', friends: friendsLocations }));

    // Handle incoming messages
    ws.on('message', (data: Buffer) => {
      try {
        const rawMessage = data.toString();
        console.log(`📥 [WebSocket] Received message from ${userId}:`, rawMessage.substring(0, 150));

        const message = JSON.parse(rawMessage);
        console.log(`📥 [WebSocket] Parsed message type:`, message.type);

        switch (message.type) {
          case 'location_update':
            handleLocationUpdate(userId, message, locationService, friendshipService, wsManager, ws);
            break;

          case 'ping':
            ws.send(JSON.stringify({ type: 'pong' }));
            break;

          default:
            console.log(`⚠️ Unknown message type: ${message.type}`);
        }
      } catch (error) {
        console.error('Error handling message:', error);
      }
    });

    // Handle disconnect
    ws.on('close', () => {
      wsManager.delete(userId);
    });

    // Handle error
    ws.on('error', (error) => {
      console.error(`❌ WebSocket error for ${userId}:`, error);
      wsManager.delete(userId);
    });
  });

  return wsManager;
}

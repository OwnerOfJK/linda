import { WebSocket } from 'ws';
import type { LocationService } from '../services/location.service';
import type { FriendshipService } from '../services/friendship.service';
import type { WebSocketConnectionManager } from './connections';

/**
 * Handle location update message from client
 */
export function handleLocationUpdate(
  userId: string,
  message: any,
  locationService: LocationService,
  friendshipService: FriendshipService,
  wsManager: WebSocketConnectionManager,
  ws: WebSocket
): void {
  const { latitude, longitude, city, country } = message;

  if (latitude === undefined || longitude === undefined) {
    console.warn(`⚠️ [Location Update] Invalid coordinates from ${userId}`);
    ws.send(JSON.stringify({ type: 'error', message: 'latitude and longitude required' }));
    return;
  }

  console.log(`📍 [Location Update] Received from ${userId}:`, {
    latitude,
    longitude,
    city,
    country,
  });

  // Update location in database
  locationService.updateLocation(userId, latitude, longitude, city, country);
  console.log(`✅ [Location Update] Database updated for ${userId}`);

  // Broadcast to friends
  console.log(`📤 [Location Update] Broadcasting to friends of ${userId}...`);
  broadcastLocationToFriends(userId, locationService, friendshipService, wsManager);
}

/**
 * Broadcast location update to all friends of a user
 */
export function broadcastLocationToFriends(
  userId: string,
  locationService: LocationService,
  friendshipService: FriendshipService,
  wsManager: WebSocketConnectionManager
): void {
  console.log(`📤 [Broadcast] Starting broadcast for ${userId}`);

  const locationData = locationService.getLocationForBroadcast(userId);
  if (!locationData) {
    return;
  }

  const { user, location, latitude, longitude } = locationData;

  // Get friend IDs
  const friendIds = friendshipService.getFriendIds(userId);
  console.log(`📤 [Broadcast] User ${userId} has ${friendIds.length} friends`);

  if (friendIds.length === 0) {
    console.log(`ℹ️ [Broadcast] No friends to broadcast to`);
    return;
  }

  // Create message
  const message = {
    type: 'friend_location',
    userId: user.userId,
    name: user.name,
    privacy_level: user.privacy_level,
    latitude,
    longitude,
    city: location.city || 'Unknown',
    country: location.country || 'Unknown',
    timestamp: location.updated_at,
  };

  console.log(`📤 [Broadcast] Message to send:`, JSON.stringify(message).substring(0, 150));

  // Broadcast to friends
  wsManager.broadcastToUsers(friendIds, message);
}

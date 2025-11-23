import { Router, Request, Response } from 'express';
import type { LocationService } from '../services/location.service';
import type { FriendshipService } from '../services/friendship.service';
import type { WebSocketConnectionManager } from '../websocket/connections';
import { broadcastLocationToFriends } from '../websocket/handlers';

export function createLocationRoutes(
  locationService: LocationService,
  friendshipService: FriendshipService,
  wsManager: WebSocketConnectionManager
) {
  const router = Router();

  // POST /users/:userId/location - Update location (also broadcasts via WebSocket)
  router.post('/:userId/location', (req: Request, res: Response) => {
    try {
      const { userId } = req.params;
      const { latitude, longitude, city, country } = req.body;

      if (latitude === undefined || longitude === undefined) {
        return res.status(400).json({ error: 'latitude and longitude are required' });
      }

      // Upsert location
      locationService.updateLocation(userId, latitude, longitude, city, country);

      // Broadcast to friends via WebSocket
      broadcastLocationToFriends(userId, locationService, friendshipService, wsManager);

      res.json({ success: true });
    } catch (error) {
      console.error('Error updating location:', error);
      res.status(500).json({ error: 'Database error' });
    }
  });

  return router;
}

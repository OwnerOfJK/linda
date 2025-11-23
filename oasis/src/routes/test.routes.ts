import { Router, Request, Response } from 'express';
import type { LocationService } from '../services/location.service';
import type { FriendshipService } from '../services/friendship.service';
import type { UserService } from '../services/user.service';
import type { WebSocketConnectionManager } from '../websocket/connections';
import { broadcastLocationToFriends } from '../websocket/handlers';

export function createTestRoutes(
  locationService: LocationService,
  friendshipService: FriendshipService,
  userService: UserService,
  wsManager: WebSocketConnectionManager
) {
  const router = Router();

  // POST /test/simulate-friend-move - Test endpoint to simulate friend location update
  router.post('/simulate-friend-move', (req: Request, res: Response) => {
    try {
      const { userId } = req.body;

      if (!userId) {
        return res.status(400).json({ error: 'userId is required' });
      }

      // Check if user exists
      const user = userService.getUser(userId);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      // Random test locations
      const testLocations = [
        { latitude: 40.7128, longitude: -74.006, city: 'New York', country: 'USA' },
        { latitude: 51.5074, longitude: -0.1278, city: 'London', country: 'UK' },
        { latitude: 48.8566, longitude: 2.3522, city: 'Paris', country: 'France' },
        { latitude: 35.6762, longitude: 139.6503, city: 'Tokyo', country: 'Japan' },
        { latitude: -33.8688, longitude: 151.2093, city: 'Sydney', country: 'Australia' },
      ];

      const randomLocation = testLocations[Math.floor(Math.random() * testLocations.length)];

      // Update location
      locationService.updateLocation(
        userId,
        randomLocation.latitude,
        randomLocation.longitude,
        randomLocation.city,
        randomLocation.country
      );

      console.log(`🧪 TEST: Updated ${userId} location to ${randomLocation.city}`);

      // Broadcast to friends via WebSocket
      broadcastLocationToFriends(userId, locationService, friendshipService, wsManager);

      res.json({
        success: true,
        userId,
        location: randomLocation,
        message: `${userId} moved to ${randomLocation.city}, ${randomLocation.country}`,
      });
    } catch (error) {
      console.error('Error simulating friend move:', error);
      res.status(500).json({ error: 'Database error' });
    }
  });

  return router;
}

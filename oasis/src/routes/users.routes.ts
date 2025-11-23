import { Router, Request, Response } from 'express';
import type { UserService } from '../services/user.service';
import type { LocationService } from '../services/location.service';
import type { WebSocketConnectionManager } from '../websocket/connections';

export function createUserRoutes(
  userService: UserService,
  locationService: LocationService,
  wsManager: WebSocketConnectionManager
) {
  const router = Router();

  // POST /users/register
  router.post('/register', (req: Request, res: Response) => {
    try {
      const { userId, name, nationality, gender, actionNullifier } = req.body;

      if (!userId || !name) {
        return res.status(400).json({ error: 'userId and name are required' });
      }

      // Optional: Verify actionNullifier via Celo RPC
      // TODO: Implement Self Protocol verification when needed
      if (actionNullifier) {
        console.log('📝 ActionNullifier received:', actionNullifier);
      }

      const user = userService.registerUser(userId, name, nationality, gender);

      res.json({
        userId: user.userId,
        name: user.name,
        nationality: user.nationality,
        gender: user.gender,
        privacy_level: user.privacy_level,
        verified: Boolean(user.verified),
        created_at: user.created_at,
      });
    } catch (error) {
      if (error instanceof Error && error.message === 'User already exists') {
        return res.status(400).json({ error: error.message });
      }
      console.error('Error registering user:', error);
      res.status(500).json({ error: 'Database error' });
    }
  });

  // GET /users/:userId
  router.get('/:userId', (req: Request, res: Response) => {
    try {
      const { userId } = req.params;
      const user = userService.getUser(userId);

      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      const location = locationService.getLocation(userId);

      res.json({
        userId: user.userId,
        name: user.name,
        nationality: user.nationality,
        gender: user.gender,
        privacy_level: user.privacy_level,
        latitude: location?.latitude || null,
        longitude: location?.longitude || null,
        city: location?.city || '',
        country: location?.country || '',
        timestamp: location?.updated_at || null,
      });
    } catch (error) {
      console.error('Error fetching user:', error);
      res.status(500).json({ error: 'Database error' });
    }
  });

  // PUT /users/:userId/privacy
  router.put('/:userId/privacy', (req: Request, res: Response) => {
    try {
      const { userId } = req.params;
      const { privacy_level } = req.body;

      if (!privacy_level || !['none', 'city', 'realtime'].includes(privacy_level)) {
        return res
          .status(400)
          .json({ error: 'Invalid privacy_level. Must be "none", "city", or "realtime"' });
      }

      const user = userService.getUser(userId);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      userService.updatePrivacyLevel(userId, privacy_level);

      // If privacy is set to 'none', notify friends to remove marker
      if (privacy_level === 'none') {
        const friendshipService = (router as any).friendshipService; // Access via shared context
        if (friendshipService) {
          const friendIds = friendshipService.getFriendIds(userId);

          const removeMessage = {
            type: 'friend_location',
            userId: userId,
            name: user.name,
            privacy_level: 'none',
            latitude: null,
            longitude: null,
            city: null,
            country: null,
            timestamp: new Date().toISOString(),
          };

          wsManager.broadcastToUsers(friendIds, removeMessage);
        }
      }

      res.json({ success: true, privacy_level });
    } catch (error) {
      if (error instanceof Error && error.message === 'User not found') {
        return res.status(404).json({ error: error.message });
      }
      console.error('Error updating privacy:', error);
      res.status(500).json({ error: 'Database error' });
    }
  });

  return router;
}

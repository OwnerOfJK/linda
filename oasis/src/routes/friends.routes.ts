import { Router, Request, Response } from 'express';
import type { FriendshipService } from '../services/friendship.service';
import type { UserService } from '../services/user.service';
import type { LocationService } from '../services/location.service';

export function createFriendsRoutes(
  friendshipService: FriendshipService,
  userService: UserService,
  locationService: LocationService
) {
  const router = Router();

  // GET /users/:userId/friends - Get friends list with city
  router.get('/:userId/friends', (req: Request, res: Response) => {
    try {
      const { userId } = req.params;
      const friends = friendshipService.getFriendsWithLocation(userId);
      res.json(friends);
    } catch (error) {
      console.error('Error fetching friends:', error);
      res.status(500).json({ error: 'Database error' });
    }
  });

  // GET /users/:userId/friends/locations - Get friends' locations (with privacy)
  router.get('/:userId/friends/locations', (req: Request, res: Response) => {
    try {
      const { userId } = req.params;
      const locations = locationService.getFriendsLocationsWithPrivacy(userId);
      res.json(locations);
    } catch (error) {
      console.error('Error fetching friends locations:', error);
      res.status(500).json({ error: 'Database error' });
    }
  });

  // POST /users/:userId/friends - Add friend (bidirectional)
  router.post('/:userId/friends', (req: Request, res: Response) => {
    try {
      const { userId } = req.params;
      const { friendId } = req.body;

      if (!friendId) {
        return res.status(400).json({ error: 'friendId is required' });
      }

      if (userId === friendId) {
        return res.status(400).json({ error: 'Cannot add yourself as friend' });
      }

      // Check both users exist
      const user = userService.getUser(userId);
      const friend = userService.getUser(friendId);

      if (!user || !friend) {
        return res.status(404).json({ error: 'User not found' });
      }

      // Add bidirectional friendship
      friendshipService.addFriend(userId, friendId);

      res.json({ success: true });
    } catch (error) {
      console.error('Error adding friend:', error);
      res.status(500).json({ error: 'Database error' });
    }
  });

  // DELETE /users/:userId/friends/:friendId - Remove friend (bidirectional)
  router.delete('/:userId/friends/:friendId', (req: Request, res: Response) => {
    try {
      const { userId, friendId } = req.params;

      // Delete both directions
      friendshipService.removeFriend(userId, friendId);

      res.json({ success: true });
    } catch (error) {
      console.error('Error removing friend:', error);
      res.status(500).json({ error: 'Database error' });
    }
  });

  return router;
}

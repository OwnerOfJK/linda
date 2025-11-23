import { Router } from 'express';
import Database from 'better-sqlite3';
import { createUserRoutes } from './users.routes';
import { createLocationRoutes } from './location.routes';
import { createFriendsRoutes } from './friends.routes';
import { createTestRoutes } from './test.routes';
import { createAdminRoutes } from './admin.routes';
import type { UserService } from '../services/user.service';
import type { LocationService } from '../services/location.service';
import type { FriendshipService } from '../services/friendship.service';
import type { WebSocketConnectionManager } from '../websocket/connections';

export function createRoutes(
  userService: UserService,
  locationService: LocationService,
  friendshipService: FriendshipService,
  wsManager: WebSocketConnectionManager,
  db: Database.Database
) {
  const router = Router();

  // User routes
  router.use('/users', createUserRoutes(userService, locationService, wsManager));

  // Location routes (nested under /users/:userId/location)
  router.use('/users', createLocationRoutes(locationService, friendshipService, wsManager));

  // Friends routes (nested under /users/:userId/friends)
  router.use('/users', createFriendsRoutes(friendshipService, userService, locationService));

  // Test routes
  router.use('/test', createTestRoutes(locationService, friendshipService, userService, wsManager));

  // Admin routes
  router.use('/admin', createAdminRoutes(db));

  return router;
}

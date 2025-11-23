/**
 * Location Service
 *
 * Note: Location updates are handled via WebSocket (see websocket.service.ts)
 * This service only provides REST endpoints for fetching location data
 */

import { api } from './api';
import type { User } from '@/types';

// Get all friends' locations (respecting privacy levels)
export const getFriendsLocations = async (userId: string): Promise<Partial<User>[]> => {
  // TODO: Implement when backend is ready
  console.log('👥 getFriendsLocations:', userId);
  throw new Error('Backend not ready');
  // return api.get(`/users/${userId}/friends/locations`);
};

/**
 * Location Service
 */

import { api } from './api';

// Update user's location
export const updateLocation = async (userId: string, location: any) => {
  // TODO: Implement when backend is ready
  console.log('📍 updateLocation:', userId, location);
  throw new Error('Backend not ready');
  // return api.post(`/users/${userId}/location`, location);
};

// Get user's location
export const getLocation = async (userId: string) => {
  // TODO: Implement when backend is ready
  console.log('🗺️ getLocation:', userId);
  throw new Error('Backend not ready');
  // return api.get(`/users/${userId}/location`);
};

// Get all friends' locations
export const getFriendsLocations = async (userId: string) => {
  // TODO: Implement when backend is ready
  console.log('👥 getFriendsLocations:', userId);
  throw new Error('Backend not ready');
  // return api.get(`/users/${userId}/friends/locations`);
};

// Get specific friend's location
export const getFriendLocation = async (userId: string, friendId: string) => {
  // TODO: Implement when backend is ready
  console.log('👤 getFriendLocation:', userId, friendId);
  throw new Error('Backend not ready');
  // return api.get(`/users/${userId}/friends/${friendId}/location`);
};

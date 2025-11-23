/**
 * User Service
 */

import { api } from './api';
import type { PrivacyLevel, User } from '@/types';

// Get user profile
export const getProfile = async (userId: string): Promise<User> => {
  // TODO: Implement when backend is ready
  console.log('👤 getProfile:', userId);
  throw new Error('Backend not ready');
  // return api.get(`/users/${userId}`);
};

// Update privacy level
export const updatePrivacy = async (userId: string, privacy_level: PrivacyLevel) => {
  // TODO: Implement when backend is ready
  console.log('🔒 updatePrivacy:', userId, privacy_level);
  throw new Error('Backend not ready');
  // return api.put(`/users/${userId}/privacy`, { privacy_level });
};

// Get user's friends (returns friends with basic info and city)
export const getFriends = async (userId: string): Promise<Partial<User>[]> => {
  // TODO: Implement when backend is ready
  console.log('👥 getFriends:', userId);
  throw new Error('Backend not ready');
  // return api.get(`/users/${userId}/friends`);
};

// Add friend (creates bidirectional friendship)
export const addFriend = async (userId: string, friendId: string) => {
  // TODO: Implement when backend is ready
  console.log('➕ addFriend:', userId, friendId);
  throw new Error('Backend not ready');
  // return api.post(`/users/${userId}/friends`, { friendId });
};

// Remove friend (deletes bidirectional friendship)
export const removeFriend = async (userId: string, friendId: string) => {
  // TODO: Implement when backend is ready
  console.log('➖ removeFriend:', userId, friendId);
  throw new Error('Backend not ready');
  // return api.delete(`/users/${userId}/friends/${friendId}`);
};

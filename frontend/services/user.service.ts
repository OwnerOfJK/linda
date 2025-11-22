/**
 * User Service
 */

import { api } from './api';
import type { SharingLevel } from '@/types';

// Get user profile
export const getProfile = async (userId: string) => {
  // TODO: Implement when backend is ready
  console.log('👤 getProfile:', userId);
  throw new Error('Backend not ready');
  // return api.get(`/users/${userId}`);
};

// Update user profile
export const updateProfile = async (userId: string, data: any) => {
  // TODO: Implement when backend is ready
  console.log('✏️ updateProfile:', userId, data);
  throw new Error('Backend not ready');
  // return api.put(`/users/${userId}`, data);
};

// Update sharing level
export const updateSharingLevel = async (userId: string, level: SharingLevel) => {
  // TODO: Implement when backend is ready
  console.log('🔒 updateSharingLevel:', userId, level);
  throw new Error('Backend not ready');
  // return api.put(`/users/${userId}/sharing-level`, { level });
};

// Get user's friends
export const getFriends = async (userId: string) => {
  // TODO: Implement when backend is ready
  console.log('👥 getFriends:', userId);
  throw new Error('Backend not ready');
  // return api.get(`/users/${userId}/friends`);
};

// Add friend
export const addFriend = async (userId: string, friendId: string) => {
  // TODO: Implement when backend is ready
  console.log('➕ addFriend:', userId, friendId);
  throw new Error('Backend not ready');
  // return api.post(`/users/${userId}/friends`, { friendId });
};

// Remove friend
export const removeFriend = async (userId: string, friendId: string) => {
  // TODO: Implement when backend is ready
  console.log('➖ removeFriend:', userId, friendId);
  throw new Error('Backend not ready');
  // return api.delete(`/users/${userId}/friends/${friendId}`);
};

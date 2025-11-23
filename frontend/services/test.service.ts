/**
 * Test Service - For development/testing only
 */

import { api } from './api';

// Simulate a friend moving to a random location
// This will update the backend and broadcast via WebSocket
export const simulateFriendMove = async (friendUserId: string) => {
  console.log('🧪 TEST: Simulating friend move for:', friendUserId);
  return api.post('/test/simulate-friend-move', { userId: friendUserId });
};

// Start friend simulation (creates 30 mock friends that move around)
// This runs the simulate-friends.js script on the backend
export const startFriendSimulation = async (userId: string) => {
  console.log('🧪 ADMIN: Starting friend simulation for:', userId);
  return api.post('/admin/simulate', { userId });
};

// Clear all mock friends from database
export const clearMockFriends = async () => {
  console.log('🧹 ADMIN: Clearing mock friends...');
  return api.post('/admin/clear-mock-friends', {});
};

// Reset entire database (use with caution!)
export const resetDatabase = async () => {
  console.log('🧹 ADMIN: Resetting database...');
  return api.post('/admin/reset-database', {});
};

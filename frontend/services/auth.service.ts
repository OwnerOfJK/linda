/**
 * Authentication Service
 */

import { api } from './api';

// Verify Self Protocol authentication
export const verifySelfAuth = async (params: any) => {
  // TODO: Implement when backend is ready
  console.log('🔐 verifySelfAuth:', params);
  throw new Error('Backend not ready');
  // return api.post('/auth/verify', { params });
};

// Refresh session token
export const refreshSession = async (token: string) => {
  // TODO: Implement when backend is ready
  console.log('🔄 refreshSession');
  throw new Error('Backend not ready');
  // return api.post('/auth/refresh', { token });
};

// Logout user
export const logout = async (userId: string) => {
  // TODO: Implement when backend is ready
  console.log('👋 logout:', userId);
  throw new Error('Backend not ready');
  // return api.post('/auth/logout', { userId });
};

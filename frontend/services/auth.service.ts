/**
 * Authentication Service
 */

import { api } from './api';
import type { RegisterUserPayload } from '@/types';

// Register a new user with Self Protocol verification
export const registerUser = async (payload: RegisterUserPayload) => {
  // TODO: Implement when backend is ready
  console.log('🔐 registerUser:', payload);
  throw new Error('Backend not ready');
  // return api.post('/users/register', payload);
};

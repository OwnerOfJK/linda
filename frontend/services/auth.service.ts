/**
 * Authentication Service
 */

import { api } from './api';
import type { RegisterUserPayload } from '@/types';

// Register a new user with Self Protocol verification
export const registerUser = async (payload: RegisterUserPayload) => {
  console.log('🔐 registerUser:', payload);
  return api.post('/users/register', payload);
};

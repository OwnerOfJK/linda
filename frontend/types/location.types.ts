/**
 * Location-related types
 * WebSocket protocol types that extend User
 */

import type { User } from './user.types';

// Simple permission status
export type LocationPermissionStatus = 'granted' | 'denied';

// WebSocket Client Messages
export interface WSLocationUpdate {
  type: 'location_update';
  latitude: number;
  longitude: number;
  city?: string;
  country?: string;
}

export interface WSPing {
  type: 'ping';
}

export type WSClientMessage = WSLocationUpdate | WSPing;

// WebSocket Server Messages
export interface WSFriendLocation extends Omit<User, 'nationality' | 'gender'> {
  type: 'friend_location';
}

export interface WSSync {
  type: 'sync';
  friends: Array<Omit<User, 'nationality' | 'gender'>>;
}

export interface WSConnected {
  type: 'connected';
  userId: string;
}

export interface WSPong {
  type: 'pong';
}

export type WSServerMessage = WSFriendLocation | WSSync | WSConnected | WSPong;

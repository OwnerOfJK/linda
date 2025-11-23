/**
 * Type definitions for Linda ROFL Backend
 */

export type PrivacyLevel = 'none' | 'city' | 'realtime';

export interface User {
  userId: string;
  name: string;
  nationality?: string;
  gender?: string;
  verified: number;
  privacy_level: PrivacyLevel;
  created_at: string;
  updated_at: string;
}

export interface Location {
  userId: string;
  latitude: number;
  longitude: number;
  city: string | null;
  country: string | null;
  updated_at: string;
}

export interface Friendship {
  id: number;
  userId: string;
  friendId: string;
  created_at: string;
}

export interface FriendLocation {
  userId: string;
  name: string;
  privacy_level: PrivacyLevel;
  latitude: number | null;
  longitude: number | null;
  city: string;
  country: string;
  timestamp: string;
}

export interface CityCoordinates {
  lat: number;
  lon: number;
}

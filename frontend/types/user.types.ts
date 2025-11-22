/**
 * User-related types
 */

import type { LocationData } from './location.types';

// Sharing privacy level
export type SharingLevel = 'city' | 'realtime';

// User object
export interface User {
  id: string;
  name?: string;
  sharingLevel: SharingLevel | null;
  location: LocationData | null;
}

// User context interface
export interface UserContextType {
  sharingLevel: SharingLevel | null;
  setSharingLevel: (level: SharingLevel) => void;
  userLocation: LocationData | null;
  setUserLocation: (
    latitude: number,
    longitude: number,
    city?: string,
    country?: string
  ) => void;
}

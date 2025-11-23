/**
 * Map-related types
 */

import type { User } from './index';

// Map region for MapView
export interface Region {
  latitude: number;
  longitude: number;
  latitudeDelta: number;
  longitudeDelta: number;
}

// Pooled marker for grouped friends
export interface PooledMarker {
  id: string;
  latitude: number;
  longitude: number;
  city: string;
  country: string;
  friends: User[];
  count: number;
}

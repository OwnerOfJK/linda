/**
 * User-related types
 * Flat structure matching backend format
 */

// Privacy level for location sharing
export type PrivacyLevel = 'none' | 'city' | 'realtime';

// User object (matches backend format - flat structure, snake_case)
export interface User {
  userId: string;
  name: string;
  nationality?: string;
  gender?: string;
  privacy_level: PrivacyLevel;
  latitude: number | null;
  longitude: number | null;
  city: string;
  country: string;
  timestamp?: string;
}

// User context interface
export interface UserContextType {
  userId: string | null;
  privacy_level: PrivacyLevel | null;
  setPrivacyLevel: (level: PrivacyLevel) => Promise<void>;
  latitude: number | null;
  longitude: number | null;
  city: string | null;
  country: string | null;
  setUserLocation: (
    latitude: number,
    longitude: number,
    city?: string,
    country?: string
  ) => void;
}

// Registration payload
export interface RegisterUserPayload {
  userId: string;
  name: string;
  nationality?: string;
  gender?: string;
  actionNullifier?: string;
}

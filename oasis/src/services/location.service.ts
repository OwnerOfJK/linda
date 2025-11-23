import Database from 'better-sqlite3';
import type { Location, User, FriendLocation } from '../types';
import { getCityCoordinates } from '../utils/geocoding';

export class LocationService {
  constructor(private db: Database.Database) {}

  /**
   * Update user's location
   */
  updateLocation(
    userId: string,
    latitude: number,
    longitude: number,
    city?: string,
    country?: string
  ): void {
    this.db
      .prepare(
        `
      INSERT INTO locations (userId, latitude, longitude, city, country)
      VALUES (?, ?, ?, ?, ?)
      ON CONFLICT(userId) DO UPDATE SET
        latitude = ?,
        longitude = ?,
        city = ?,
        country = ?,
        updated_at = datetime('now')
    `
      )
      .run(
        userId,
        latitude,
        longitude,
        city || null,
        country || null,
        latitude,
        longitude,
        city || null,
        country || null
      );
  }

  /**
   * Get user's location
   */
  getLocation(userId: string): Location | null {
    const location = this.db
      .prepare('SELECT * FROM locations WHERE userId = ?')
      .get(userId) as Location | undefined;
    return location || null;
  }

  /**
   * Get friends' locations with privacy enforcement
   */
  getFriendsLocationsWithPrivacy(userId: string): FriendLocation[] {
    const stmt = this.db.prepare(`
      SELECT
        u.userId,
        u.name,
        u.privacy_level,
        l.latitude,
        l.longitude,
        l.city,
        l.country,
        l.updated_at as timestamp
      FROM friendships f
      JOIN users u ON f.friendId = u.userId
      LEFT JOIN locations l ON u.userId = l.userId
      WHERE f.userId = ?
    `);

    const friends = stmt.all(userId) as any[];

    return friends
      .filter((friend) => friend.privacy_level !== 'none')
      .map((friend) => {
        let latitude = null;
        let longitude = null;

        if (friend.privacy_level === 'realtime') {
          latitude = friend.latitude;
          longitude = friend.longitude;
        } else if (friend.privacy_level === 'city') {
          const cityCoords = getCityCoordinates(friend.city, friend.country);
          if (cityCoords) {
            latitude = cityCoords.lat;
            longitude = cityCoords.lon;
          }
        }

        return {
          userId: friend.userId,
          name: friend.name,
          privacy_level: friend.privacy_level,
          latitude,
          longitude,
          city: friend.city || 'Unknown',
          country: friend.country || 'Unknown',
          timestamp: friend.timestamp || new Date().toISOString(),
        };
      });
  }

  /**
   * Get location data for broadcasting (with privacy enforcement)
   */
  getLocationForBroadcast(userId: string): {
    user: User;
    location: Location;
    latitude: number | null;
    longitude: number | null;
  } | null {
    const user = this.db
      .prepare('SELECT * FROM users WHERE userId = ?')
      .get(userId) as User | undefined;

    if (!user) {
      console.warn(`⚠️ [Broadcast] User ${userId} not found in database`);
      return null;
    }

    if (user.privacy_level === 'none') {
      console.log(`🚫 [Broadcast] User ${userId} has location sharing disabled`);
      return null;
    }

    const location = this.db
      .prepare('SELECT * FROM locations WHERE userId = ?')
      .get(userId) as Location | undefined;

    if (!location) {
      console.warn(`⚠️ [Broadcast] No location found for ${userId}`);
      return null;
    }

    // Determine coordinates based on privacy level
    let latitude = null;
    let longitude = null;

    if (user.privacy_level === 'realtime') {
      latitude = location.latitude;
      longitude = location.longitude;
      console.log(`📍 [Broadcast] Privacy level: realtime - sending exact coordinates`);
    } else if (user.privacy_level === 'city') {
      const cityCoords = getCityCoordinates(location.city, location.country);
      if (cityCoords) {
        latitude = cityCoords.lat;
        longitude = cityCoords.lon;
        console.log(`📍 [Broadcast] Privacy level: city - sending city center coordinates`);
      } else {
        console.warn(`⚠️ [Broadcast] City coordinates not found for ${location.city}, ${location.country}`);
      }
    }

    return { user, location, latitude, longitude };
  }
}

import React, { createContext, useContext, useState, useEffect, ReactNode, useRef } from 'react';
import type { User } from '@/types';
import { websocketService, locationService, notificationService } from '@/services';
import { getStorageItemAsync } from '@/hooks/useStorageState';
import { getDistance } from '@/utils/getDistance';
import { useUser } from './UserContext';

interface FriendsContextType {
  friends: User[];
  refreshFriends: () => Promise<void>;
}

const FriendsContext = createContext<FriendsContextType | undefined>(undefined);

export const FriendsProvider = ({ children }: { children: ReactNode }) => {
  const [friends, setFriends] = useState<User[]>([]);
  const { latitude: userLat, longitude: userLon } = useUser();

  // Track last notification time for each friend (1-minute interval)
  const lastNotificationTimeRef = useRef<Record<string, number>>({});

  // Track last user location check to avoid re-checking on every render
  const lastUserLocationCheckRef = useRef<{ lat: number | null; lon: number | null }>({ lat: null, lon: null });

  // Function to check proximity and send notification if needed
  const checkProximityAndNotify = (friendUserId: string, friendName: string, friendLat: number | null | undefined, friendLon: number | null | undefined) => {
    // Check proximity if both user and friend have real-time coordinates
    if (
      userLat !== null &&
      userLon !== null &&
      friendLat !== null &&
      friendLat !== undefined &&
      friendLon !== null &&
      friendLon !== undefined
    ) {
      const distance = getDistance(userLat, userLon, friendLat, friendLon);
      console.log(`📏 [Proximity] Distance to ${friendName}: ${distance}km`);

      // Proximity threshold: 100km
      const PROXIMITY_THRESHOLD_KM = 100;

      if (distance <= PROXIMITY_THRESHOLD_KM) {
        const now = Date.now();
        const lastNotificationTime = lastNotificationTimeRef.current[friendUserId] || 0;
        const timeSinceLastNotification = now - lastNotificationTime;

        // Notification interval: 1 minute (in milliseconds)
        const NOTIFICATION_INTERVAL_MS = 1 * 60 * 1000; // 1 minute

        // Send notification if 1 minute has passed since last notification
        if (timeSinceLastNotification >= NOTIFICATION_INTERVAL_MS) {
          console.log(`🔔 [Proximity] ${friendName} is nearby! Sending notification...`);
          notificationService.sendProximity(friendName || 'A friend', distance);
          lastNotificationTimeRef.current[friendUserId] = now;
        } else {
          const minutesRemaining = Math.ceil((NOTIFICATION_INTERVAL_MS - timeSinceLastNotification) / (60 * 1000));
          console.log(`⏳ [Proximity] ${friendName} is nearby, but notification cooldown active (${minutesRemaining} minutes remaining)`);
        }
      }
    }
  };

  // Fetch friends from backend
  const refreshFriends = async () => {
    try {
      const userId = await getStorageItemAsync('userId');
      if (!userId) {
        console.log('⚠️ No userId found, cannot fetch friends');
        return;
      }

      console.log('🔄 [FriendsContext] Fetching friends from backend...');
      const friendsLocations = await locationService.getFriendsLocations(userId);
      console.log('✅ [FriendsContext] Fetched friends:', friendsLocations.length, 'friends');
      setFriends(friendsLocations as User[]);
    } catch (error) {
      console.error('❌ [FriendsContext] Failed to fetch friends:', error);
    }
  };

  // Request notification permissions on mount
  useEffect(() => {
    notificationService.requestPermissions();
  }, []);

  // Fetch friends on mount
  useEffect(() => {
    refreshFriends();
  }, []);

  // Listen to WebSocket friend location updates - direct pass-through, no conversion
  useEffect(() => {
    console.log('🎧 [FriendsContext] Setting up WebSocket listeners...');

    websocketService.onFriendLocation((friend) => {
      console.log('📍 [FriendsContext] Friend location update received:', friend.userId, friend.name);

      // Check proximity and notify
      checkProximityAndNotify(friend.userId, friend.name || 'A friend', friend.latitude, friend.longitude);

      setFriends((prev) => {
        const existingFriend = prev.find((f) => f.userId === friend.userId);
        if (!existingFriend) {
          console.log('⚠️ [FriendsContext] Friend not in list, adding:', friend.userId);
          // Add friend if not in list
          return [...prev, friend as User];
        }
        // Update existing friend
        return prev.map((f) => (f.userId === friend.userId ? { ...f, ...friend } : f));
      });
    });

    websocketService.onSync((friendsData) => {
      console.log('🔄 [FriendsContext] Sync received with', friendsData.length, 'friends');
      // Replace all friends with synced data from server
      setFriends(friendsData as User[]);
    });

    console.log('✅ [FriendsContext] WebSocket listeners registered');
  }, []);

  // Check proximity when user's location changes (bidirectional notifications)
  useEffect(() => {
    if (userLat === null || userLon === null) {
      return; // User location not available yet
    }

    // Only check if location actually changed (avoid re-running on friends updates)
    const lastCheck = lastUserLocationCheckRef.current;
    if (lastCheck.lat === userLat && lastCheck.lon === userLon) {
      return; // Location hasn't changed
    }

    console.log('📍 [Proximity] User location changed, checking all friends...');
    lastUserLocationCheckRef.current = { lat: userLat, lon: userLon };

    // Check proximity to all friends
    friends.forEach((friend) => {
      checkProximityAndNotify(friend.userId, friend.name || 'A friend', friend.latitude, friend.longitude);
    });
  }, [userLat, userLon, friends]);

  return (
    <FriendsContext.Provider value={{ friends, refreshFriends }}>
      {children}
    </FriendsContext.Provider>
  );
};

export const useFriends = () => {
  const context = useContext(FriendsContext);
  if (context === undefined) {
    throw new Error('useFriends must be used within a FriendsProvider');
  }
  return context;
};

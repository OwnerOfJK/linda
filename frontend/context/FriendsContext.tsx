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

  // Track which friends have been notified (to avoid spam)
  const notifiedFriendsRef = useRef<Record<string, boolean>>({});

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

      // Check proximity if both user and friend have real-time coordinates
      if (
        userLat !== null &&
        userLon !== null &&
        friend.latitude !== null &&
        friend.latitude !== undefined &&
        friend.longitude !== null &&
        friend.longitude !== undefined
      ) {
        const distance = getDistance(userLat, userLon, friend.latitude, friend.longitude);
        console.log(`📏 [Proximity] Distance to ${friend.name}: ${distance}km`);

        // Proximity threshold: 1km
        const PROXIMITY_THRESHOLD_KM = 1;

        if (distance <= PROXIMITY_THRESHOLD_KM) {
          // Check if we haven't already notified about this friend
          if (!notifiedFriendsRef.current[friend.userId]) {
            console.log(`🔔 [Proximity] ${friend.name} is nearby! Sending notification...`);
            notificationService.sendProximity(friend.name || 'A friend', distance);
            notifiedFriendsRef.current[friend.userId] = true;
          }
        } else {
          // Reset notification flag if friend moves away
          if (notifiedFriendsRef.current[friend.userId]) {
            console.log(`🔕 [Proximity] ${friend.name} moved away, resetting notification flag`);
            notifiedFriendsRef.current[friend.userId] = false;
          }
        }
      }

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

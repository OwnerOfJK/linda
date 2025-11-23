import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import type { User } from '@/types';
import { websocketService, locationService } from '@/services';
import { getStorageItemAsync } from '@/hooks/useStorageState';

interface FriendsContextType {
  friends: User[];
  refreshFriends: () => Promise<void>;
}

const FriendsContext = createContext<FriendsContextType | undefined>(undefined);

export const FriendsProvider = ({ children }: { children: ReactNode }) => {
  const [friends, setFriends] = useState<User[]>([]);

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
      console.log('📋 [FriendsContext] Friends data:', JSON.stringify(friendsLocations, null, 2));
      setFriends(friendsLocations as User[]);
    } catch (error) {
      console.error('❌ [FriendsContext] Failed to fetch friends:', error);
    }
  };

  // Fetch friends on mount
  useEffect(() => {
    refreshFriends();
  }, []);

  // Listen to WebSocket friend location updates - direct pass-through, no conversion
  useEffect(() => {
    console.log('🎧 [FriendsContext] Setting up WebSocket listeners...');

    websocketService.onFriendLocation((friend) => {
      console.log('📍 [FriendsContext] Friend location update received:', friend.userId, friend.name);
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
      console.log('📋 [FriendsContext] Sync data:', JSON.stringify(friendsData, null, 2));
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

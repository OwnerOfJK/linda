import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import type { User } from '@/types';
import { websocketService, locationService } from '@/services';
import { getStorageItemAsync } from '@/hooks/useStorageState';

interface FriendsContextType {
  friends: User[];
  addFriend: (friend: User) => void;
  removeFriend: (friendId: string) => void;
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

      console.log('🔄 Fetching friends from backend...');
      const friendsLocations = await locationService.getFriendsLocations(userId);
      console.log('✅ Fetched friends:', friendsLocations);
      setFriends(friendsLocations as User[]);
    } catch (error) {
      console.error('❌ Failed to fetch friends:', error);
    }
  };

  // Fetch friends on mount
  useEffect(() => {
    refreshFriends();
  }, []);

  // Listen to WebSocket friend location updates - direct pass-through, no conversion
  useEffect(() => {
    websocketService.onFriendLocation((friend) => {
      setFriends((prev) =>
        prev.map((f) => (f.userId === friend.userId ? { ...f, ...friend } : f))
      );
    });

    websocketService.onSync((friendsData) => {
      // Replace all friends with synced data from server
      setFriends(friendsData as User[]);
    });
  }, []);

  const addFriend = (friend: User) => {
    setFriends((prev) => [...prev, friend]);
  };

  const removeFriend = (friendId: string) => {
    setFriends((prev) => prev.filter((f) => f.userId !== friendId));
  };

  return (
    <FriendsContext.Provider value={{ friends, addFriend, removeFriend, refreshFriends }}>
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

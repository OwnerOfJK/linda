import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import type { User } from '@/types';
import { websocketService } from '@/services';

interface FriendsContextType {
  friends: User[];
  addFriend: (friend: User) => void;
  removeFriend: (friendId: string) => void;
}

const FriendsContext = createContext<FriendsContextType | undefined>(undefined);

// Mock data for MVP - flat structure matching backend
const MOCK_FRIENDS: User[] = [
  {
    userId: '1',
    name: 'Alice Johnson',
    privacy_level: 'realtime',
    latitude: 40.7128,
    longitude: -74.006,
    city: 'New York',
    country: 'USA',
  },
  {
    userId: '2',
    name: 'Bob Smith',
    privacy_level: 'city',
    latitude: 51.5074,
    longitude: -0.1278,
    city: 'London',
    country: 'UK',
  },
  {
    userId: '3',
    name: 'Carol White',
    privacy_level: 'realtime',
    latitude: 48.8566,
    longitude: 2.3522,
    city: 'Paris',
    country: 'France',
  },
  {
    userId: '4',
    name: 'David Lee',
    privacy_level: 'city',
    latitude: 35.6762,
    longitude: 139.6503,
    city: 'Tokyo',
    country: 'Japan',
  },
];

export const FriendsProvider = ({ children }: { children: ReactNode }) => {
  const [friends, setFriends] = useState<User[]>(MOCK_FRIENDS);

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
    <FriendsContext.Provider value={{ friends, addFriend, removeFriend }}>
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

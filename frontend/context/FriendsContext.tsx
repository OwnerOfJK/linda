import React, { createContext, useContext, useState, ReactNode } from 'react';
import type { User } from '@/types';

interface FriendsContextType {
  friends: User[];
  addFriend: (friend: User) => void;
  removeFriend: (friendId: string) => void;
}

const FriendsContext = createContext<FriendsContextType | undefined>(undefined);

// Mock data for MVP
const MOCK_FRIENDS: User[] = [
  {
    id: '1',
    name: 'Alice Johnson',
    sharingLevel: 'realtime',
    location: {
      latitude: 40.7128,
      longitude: -74.006,
      city: 'New York',
      country: 'USA',
    },
  },
  {
    id: '2',
    name: 'Bob Smith',
    sharingLevel: 'city',
    location: {
      latitude: 51.5074,
      longitude: -0.1278,
      city: 'London',
      country: 'UK',
    },
  },
  {
    id: '3',
    name: 'Carol White',
    sharingLevel: 'realtime',
    location: {
      latitude: 48.8566,
      longitude: 2.3522,
      city: 'Paris',
      country: 'France',
    },
  },
  {
    id: '4',
    name: 'David Lee',
    sharingLevel: 'city',
    location: {
      latitude: 35.6762,
      longitude: 139.6503,
      city: 'Tokyo',
      country: 'Japan',
    },
  },
];

export const FriendsProvider = ({ children }: { children: ReactNode }) => {
  const [friends, setFriends] = useState<User[]>(MOCK_FRIENDS);

  const addFriend = (friend: User) => {
    setFriends((prev) => [...prev, friend]);
  };

  const removeFriend = (friendId: string) => {
    setFriends((prev) => prev.filter((f) => f.id !== friendId));
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

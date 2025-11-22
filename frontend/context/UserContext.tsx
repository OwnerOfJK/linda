import React, { createContext, useContext, useState, ReactNode } from 'react';
import type { SharingLevel, LocationData, UserContextType } from '@/types';

// Re-export types for backward compatibility
export type { SharingLevel, UserContextType };

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider = ({ children }: { children: ReactNode }) => {
  const [sharingLevel, setSharingLevel] = useState<SharingLevel | null>(null);
  const [userLocation, setUserLocationState] = useState<LocationData | null>(null);

  const setUserLocation = (
    latitude: number,
    longitude: number,
    city?: string,
    country?: string
  ) => {
    setUserLocationState({
      latitude,
      longitude,
      city,
      country,
    });
  };

  return (
    <UserContext.Provider
      value={{
        sharingLevel,
        setSharingLevel,
        userLocation,
        setUserLocation,
      }}
    >
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};

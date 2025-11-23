import React, { createContext, useContext, useState, ReactNode } from 'react';
import type { PrivacyLevel, UserContextType } from '@/types';
import { websocketService } from '@/services';

// Re-export types for backward compatibility
export type { PrivacyLevel, UserContextType };

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider = ({ children }: { children: ReactNode }) => {
  const [privacy_level, setPrivacyLevel] = useState<PrivacyLevel | null>(null);
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [city, setCity] = useState<string | null>(null);
  const [country, setCountry] = useState<string | null>(null);

  const setUserLocation = (
    lat: number,
    lon: number,
    cityName?: string,
    countryName?: string
  ) => {
    setLatitude(lat);
    setLongitude(lon);
    setCity(cityName || null);
    setCountry(countryName || null);

    // Send location update via WebSocket if connected
    if (websocketService.isConnected()) {
      websocketService.sendLocationUpdate(lat, lon, cityName, countryName);
    }
  };

  return (
    <UserContext.Provider
      value={{
        privacy_level,
        setPrivacyLevel,
        latitude,
        longitude,
        city,
        country,
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

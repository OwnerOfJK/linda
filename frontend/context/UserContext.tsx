import React, { createContext, useContext, useState, useEffect, ReactNode, useRef } from 'react';
import * as Location from 'expo-location';
import type { PrivacyLevel, UserContextType } from '@/types';
import { websocketService, userService } from '@/services';
import { getStorageItemAsync } from '@/hooks/useStorageState';

// Re-export types for backward compatibility
export type { PrivacyLevel, UserContextType };

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider = ({ children }: { children: ReactNode }) => {
  const [privacy_level, setPrivacyLevelState] = useState<PrivacyLevel | null>(null);
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [city, setCity] = useState<string | null>(null);
  const [country, setCountry] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const locationSubscriptionRef = useRef<Location.LocationSubscription | null>(null);

  // Wrapper function that updates both local state AND backend
  const setPrivacyLevel = async (newPrivacyLevel: PrivacyLevel) => {
    // Update local state immediately for responsive UI
    setPrivacyLevelState(newPrivacyLevel);

    // Update backend
    if (userId) {
      try {
        console.log('🔒 Updating privacy level in backend:', newPrivacyLevel);
        await userService.updatePrivacy(userId, newPrivacyLevel);
        console.log('✅ Privacy level updated in backend');
      } catch (error) {
        console.error('❌ Failed to update privacy level in backend:', error);
        // Optionally: revert local state on error
        // setPrivacyLevelState(privacy_level);
      }
    } else {
      console.warn('⚠️ Cannot update privacy: userId not set');
    }
  };

  // Load userId from storage and initialize WebSocket connection
  useEffect(() => {
    async function initializeUser() {
      try {
        const storedUserId = await getStorageItemAsync('userId');
        if (storedUserId) {
          setUserId(storedUserId);

          // Fetch user profile to get privacy level
          try {
            const userProfile = await userService.getProfile(storedUserId);
            console.log('✅ Loaded user profile:', userProfile);
            setPrivacyLevelState(userProfile.privacy_level);
          } catch (error) {
            console.error('❌ Failed to load user profile:', error);
            // Set default privacy level if fetch fails
            setPrivacyLevelState('city');
          }

          // Connect WebSocket
          await websocketService.connect(storedUserId);
          console.log('✅ WebSocket initialized for user:', storedUserId);
        }
      } catch (error) {
        console.error('❌ Failed to initialize user:', error);
      }
    }

    initializeUser();

    // Setup WebSocket event listeners
    websocketService.onConnected((connectedUserId) => {
      console.log('🔗 WebSocket connected:', connectedUserId);
    });

    websocketService.onDisconnected(() => {
      console.log('🔌 WebSocket disconnected');
    });

    websocketService.onError((error) => {
      // Don't spam error logs for expected reconnection behavior
      if (error.includes('Max reconnect attempts')) {
        console.warn('⚠️ WebSocket connection lost. Will retry when possible.');
      } else {
        console.error('❌ WebSocket error:', error);
      }
    });

    // Cleanup on unmount
    return () => {
      websocketService.disconnect();
    };
  }, []);

  // Automatic location tracking
  useEffect(() => {
    let isMounted = true;

    async function startLocationTracking() {
      console.log('🔍 [Location Tracking] Checking if we should start tracking...');
      console.log('🔍 [Location Tracking] userId:', userId);

      if (!userId) {
        console.warn('⚠️ [Location Tracking] Cannot start - userId is not set');
        return;
      }

      try {
        console.log('🔍 [Location Tracking] Requesting location permissions...');
        // Request foreground permissions
        const { status } = await Location.requestForegroundPermissionsAsync();
        console.log('🔍 [Location Tracking] Permission status:', status);

        if (status !== 'granted') {
          console.warn('⚠️ Location permission not granted - status:', status);
          return;
        }

        console.log('📍 Starting automatic location tracking...');
        console.log('📍 Config: timeInterval=5000ms, distanceInterval=1m');

        // Start watching location with updates every 5 seconds
        // or when user moves more than 1 meter
        const subscription = await Location.watchPositionAsync(
          {
            accuracy: Location.Accuracy.High,
            timeInterval: 5000, // Update every 5 seconds
            distanceInterval: 1, // Or when moved 1 meter
          },
          async (location) => {
            if (!isMounted) {
              console.log('⚠️ [Location Update] Component unmounted, skipping update');
              return;
            }

            const { latitude: lat, longitude: lon } = location.coords;
            console.log('📍 [Location Update] Raw location received:', { lat, lon, timestamp: new Date().toISOString() });

            // Reverse geocode to get city/country
            try {
              const [geocode] = await Location.reverseGeocodeAsync({ latitude: lat, longitude: lon });
              const cityName = geocode?.city || geocode?.subregion || undefined;
              const countryName = geocode?.country || undefined;

              console.log('📍 [Location Update] Geocoded:', { lat, lon, city: cityName, country: countryName });

              // Update local state
              setLatitude(lat);
              setLongitude(lon);
              setCity(cityName || null);
              setCountry(countryName || null);

              // Send to backend via WebSocket
              const wsConnected = websocketService.isConnected();
              console.log('📍 [Location Update] WebSocket connected:', wsConnected);

              if (wsConnected) {
                console.log('📤 [Location Update] Sending location to backend via WebSocket');
                websocketService.sendLocationUpdate(lat, lon, cityName, countryName);
              } else {
                console.warn('⚠️ [Location Update] WebSocket not connected - location update NOT sent to backend');
              }
            } catch (error) {
              console.error('❌ Failed to reverse geocode:', error);
              // Still update location even if geocoding fails
              setLatitude(lat);
              setLongitude(lon);

              const wsConnected = websocketService.isConnected();
              console.log('📍 [Location Update] WebSocket connected (no geocode):', wsConnected);

              if (wsConnected) {
                console.log('📤 [Location Update] Sending location to backend via WebSocket (no city/country)');
                websocketService.sendLocationUpdate(lat, lon);
              } else {
                console.warn('⚠️ [Location Update] WebSocket not connected - location update NOT sent to backend');
              }
            }
          }
        );

        locationSubscriptionRef.current = subscription;
        console.log('✅ Automatic location tracking started');
      } catch (error) {
        console.error('❌ Failed to start location tracking:', error);
      }
    }

    startLocationTracking();

    // Cleanup on unmount
    return () => {
      isMounted = false;
      if (locationSubscriptionRef.current) {
        locationSubscriptionRef.current.remove();
        locationSubscriptionRef.current = null;
        console.log('🛑 Automatic location tracking stopped');
      }
    };
  }, [userId]);

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
        userId,
        privacy_level: privacy_level,
        setPrivacyLevel: setPrivacyLevel,
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

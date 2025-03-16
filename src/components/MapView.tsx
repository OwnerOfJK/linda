/// <reference types="google.maps" />
'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/lib/supabase/client';
import Image from 'next/image';

// City type definition
interface City {
  id: string;
  name: string;
  country: string;
  lat: number;
  lng: number;
}

// Current user location definition
interface CurrentUserLocation {
  id: string;
  name: string | null;
  profile_picture_url: string | null;
  city: City;
}

// Friend location definition
interface FriendLocation {
  id: string;
  name: string | null;
  profile_picture_url: string | null;
  city: City;
}

// Cluster of friends in the same city
interface FriendCluster {
  cityId: string;
  cityName: string;
  countryName: string;
  lat: number;
  lng: number;
  friends: {
    id: string;
    name: string | null;
    profile_picture_url: string | null;
  }[];
}

// Raw friend data from Supabase query
interface FriendResponse {
  friend: {
    id: string;
    name: string | null;
    profile_picture_url: string | null;
    city: City | City[] | null;
  };
}

export default function MapView() {
  const mapRef = useRef<google.maps.Map | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCluster, setSelectedCluster] = useState<FriendCluster | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const [currentUser, setCurrentUser] = useState<CurrentUserLocation | null>(null);
  const [zoomLevel, setZoomLevel] = useState<number>(2);
  const [markerRefs, setMarkerRefs] = useState<{[key: string]: google.maps.marker.AdvancedMarkerElement | google.maps.Marker}>({});
  const [mapInitialized, setMapInitialized] = useState(false);
  const lastClustersRef = useRef<FriendCluster[]>([]);
  const addMarkersToMapRef = useRef<(clusters: FriendCluster[]) => void>(() => {});
  const userDataFetchedRef = useRef<boolean>(false);
  
  // Calculate marker size based on zoom level
  const getMarkerSize = useCallback((isCluster: boolean, isCurrent: boolean) => {
    const baseSize = isCurrent ? 50 : 40;
    const clusterBonus = isCluster ? 10 : 0;
    
    // Scale markers based on zoom level
    const zoomFactor = Math.max(0.8, Math.min(1.5, zoomLevel / 5));
    
    return Math.round((baseSize + clusterBonus) * zoomFactor);
  }, [zoomLevel]);
  
  // Add markers to the map for each friend cluster
  const addMarkersToMap = useCallback((clusters: FriendCluster[]) => {
    if (!mapRef.current || !window.google) {
      console.log('Cannot add markers - map or Google not initialized');
      return;
    }
    
    console.log('Adding markers to map. Current user:', currentUser?.id);
    console.log('Friend clusters:', clusters.length);
    
    // Clear existing markers to prevent duplicates
    console.log('Clearing existing markers:', Object.keys(markerRefs).length);
    Object.values(markerRefs).forEach(marker => {
      if ('setMap' in marker) {
        marker.setMap(null);
      }
    });
    
    const map = mapRef.current;
    const newMarkerRefs: {[key: string]: google.maps.marker.AdvancedMarkerElement | google.maps.Marker} = {};
    
    // FORCE using standard markers until we can fix the Advanced Markers issue
    const useAdvancedMarkers = false;
    
    console.log('Forcing standard markers for reliability');
    
    // Add your location marker if available
    if (currentUser && currentUser.city) {
      console.log('Adding current user marker at:', currentUser.city.lat, currentUser.city.lng);
      
      try {
        // Create user marker
        const markerSize = getMarkerSize(false, true);
        console.log('Current user marker size:', markerSize);
        
        // Use standard marker for guaranteed visibility
        const myMarker = new window.google.maps.Marker({
          position: { lat: currentUser.city.lat, lng: currentUser.city.lng },
          map,
          title: `You are here: ${currentUser.city.name}, ${currentUser.city.country}`,
          icon: {
            url: 'https://maps.google.com/mapfiles/ms/icons/green-dot.png',
            scaledSize: new window.google.maps.Size(markerSize, markerSize)
          },
          zIndex: 1000,
          // Adding a label for extra visibility
          label: {
            text: 'You',
            color: 'white',
            fontWeight: 'bold'
          },
          // Force animation to make marker more noticeable
          animation: window.google.maps.Animation.DROP
        });
        console.log('Standard marker created for user with label');
        
        // Center map on your location if no friends are shown
        if (clusters.length === 0) {
          console.log('No friends to show, centering on user location');
          map.setCenter({ lat: currentUser.city.lat, lng: currentUser.city.lng });
          map.setZoom(5); // Closer zoom when only showing your location
          setZoomLevel(5);
        }
        
        // Add click event to show your details
        myMarker.addListener('click', () => {
          console.log('User marker clicked');
          
          setSelectedCluster({
            cityId: currentUser.city.id,
            cityName: currentUser.city.name,
            countryName: currentUser.city.country,
            lat: currentUser.city.lat,
            lng: currentUser.city.lng,
            friends: [{
              id: currentUser.id,
              name: currentUser.name,
              profile_picture_url: currentUser.profile_picture_url
            }]
          });
        });
        
        newMarkerRefs[`user-${currentUser.id}`] = myMarker;
        console.log('User marker added to refs with key:', `user-${currentUser.id}`);
      } catch (err) {
        console.error('Error creating user marker:', err);
      }
    } else {
      console.warn('Current user or city data missing, cannot create marker');
      console.log('Current user:', currentUser);
    }
    
    // Add friend markers
    clusters.forEach(cluster => {
      try {
        // Create standard marker for clusters with guaranteed visibility
        let icon: google.maps.Icon;
        
        if (cluster.friends.length > 1) {
          // Blue marker for clusters
          icon = {
            url: 'https://maps.google.com/mapfiles/ms/icons/blue-dot.png',
            scaledSize: new window.google.maps.Size(
              getMarkerSize(true, false), 
              getMarkerSize(true, false)
            )
          };
        } else {
          // Red marker for single friends
          icon = {
            url: 'https://maps.google.com/mapfiles/ms/icons/red-dot.png',
            scaledSize: new window.google.maps.Size(
              getMarkerSize(false, false), 
              getMarkerSize(false, false)
            )
          };
        }
        
        // Create standard marker
        const marker = new window.google.maps.Marker({
          position: { lat: cluster.lat, lng: cluster.lng },
          map,
          icon,
          title: cluster.friends.length > 1 
            ? `${cluster.friends.length} friends in ${cluster.cityName}, ${cluster.countryName}`
            : `${cluster.friends[0].name || 'Friend'} in ${cluster.cityName}, ${cluster.countryName}`,
          label: cluster.friends.length > 1 ? {
            text: `${cluster.friends.length}`,
            color: 'white',
            fontWeight: 'bold'
          } : undefined,
          animation: window.google.maps.Animation.DROP
        });
        
        // Add click event
        marker.addListener('click', () => {
          setSelectedCluster(cluster);
        });
        
        newMarkerRefs[`cluster-${cluster.cityId}`] = marker;
        console.log(`Added cluster marker for ${cluster.cityName} with ${cluster.friends.length} friends`);
      } catch (err) {
        console.error('Error creating cluster marker:', err);
      }
    });
    
    // Update marker references
    console.log('Updating marker refs. New markers count:', Object.keys(newMarkerRefs).length);
    setMarkerRefs(newMarkerRefs);
    
    // Add a visible debug element to show marker status
    const addDebugInfo = () => {
      const existingDebug = document.getElementById('map-marker-debug');
      if (existingDebug) {
        existingDebug.remove();
      }
      
      const debugElement = document.createElement('div');
      debugElement.id = 'map-marker-debug';
      debugElement.style.position = 'absolute';
      debugElement.style.top = '10px';
      debugElement.style.left = '10px';
      debugElement.style.backgroundColor = 'rgba(255, 255, 255, 0.8)';
      debugElement.style.padding = '10px';
      debugElement.style.borderRadius = '4px';
      debugElement.style.zIndex = '1000';
      debugElement.style.fontSize = '12px';
      debugElement.style.maxWidth = '300px';
      
      debugElement.innerHTML = `
        <div style="font-weight: bold;">Map Marker Debug</div>
        <div>User marker: ${currentUser ? 'Available' : 'Not available'}</div>
        <div>Map initialized: ${!!mapRef.current}</div>
        <div>Marker refs: ${Object.keys(newMarkerRefs).length}</div>
        <div>Marker types: ${Object.keys(newMarkerRefs).map(k => k.split('-')[0]).join(', ')}</div>
      `;
      
      if (mapContainerRef.current) {
        mapContainerRef.current.appendChild(debugElement);
      }
    };
    
    // Add debug info after a short delay to ensure DOM is updated
    setTimeout(addDebugInfo, 1000);
  }, [currentUser, getMarkerSize, setSelectedCluster, setZoomLevel]);
  
  // Store the latest addMarkersToMap function in a ref
  useEffect(() => {
    addMarkersToMapRef.current = addMarkersToMap;
  }, [addMarkersToMap]);
  
  // Fetch friend locations from Supabase
  const fetchFriendLocations = useCallback(async () => {
    try {
      if (!mapRef.current) {
        console.log('Map not initialized, skipping fetch');
        return;
      }
      
      // Don't fetch if already loading
      if (loading) {
        console.log('Already loading, skipping fetch');
        return;
      }
      setLoading(true);
      console.log('Fetching user and friend locations...');
      
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        console.log('User not authenticated');
        throw new Error('Not authenticated');
      }

      console.log('Authenticated as:', user.id);

      // Get current user's data
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select(`
          id, 
          name, 
          profile_picture_url,
          city:cities(
            id,
            name,
            country,
            lat,
            lng
          )
        `)
        .eq('id', user.id)
        .single();
        
      if (userError) {
        console.error('Error fetching current user:', userError);
      } else if (userData) {
        console.log('User data fetched:', userData);
        
        // Transform user data to match our expected format
        let cityData: City | null = null;
        
        if (Array.isArray(userData.city) && userData.city.length > 0) {
          cityData = userData.city[0];
          console.log('User city (from array):', cityData);
        } else if (userData.city && !Array.isArray(userData.city)) {
          cityData = userData.city;
          console.log('User city (direct):', cityData);
        } else {
          console.log('No city found for user:', userData);
        }
        
        if (cityData) {
          userDataFetchedRef.current = true;
          // Always update currentUser to ensure the marker is displayed
          console.log('Setting current user with city:', cityData);
          setCurrentUser({
            id: userData.id,
            name: userData.name,
            profile_picture_url: userData.profile_picture_url,
            city: cityData
          });
        } else {
          console.warn('User has no city data, cannot display marker');
        }
      }
      
      // Get accepted friends
      const { data: friendsData, error: friendsError } = await supabase
        .from('friends')
        .select(`
          friend:users!friend_id(
            id, 
            name, 
            profile_picture_url,
            city:cities(
              id,
              name,
              country,
              lat,
              lng
            )
          )
        `)
        .eq('user_id', user.id)
        .eq('status', 'accepted');
      
      if (friendsError) {
        throw friendsError;
      }
      
      // Type guard function to check if a value is a FriendLocation
      function isFriendLocation(friend: unknown): friend is FriendLocation {
        if (!friend || typeof friend !== 'object') return false;
        
        const f = friend as Record<string, unknown>;
        
        return !!f.id && 
               !!f.city && 
               typeof f.city === 'object' &&
               !!(f.city as Record<string, unknown>).id &&
               typeof (f.city as Record<string, unknown>).id === 'string' &&
               !!(f.city as Record<string, unknown>).lat &&
               typeof (f.city as Record<string, unknown>).lat === 'number' &&
               !!(f.city as Record<string, unknown>).lng &&
               typeof (f.city as Record<string, unknown>).lng === 'number';
      }
      
      // Transform data to match our expected format
      const locations: FriendLocation[] = [];
      
      if (Array.isArray(friendsData)) {
        for (const item of friendsData as unknown as FriendResponse[]) {
          if (!item.friend) continue;
          
          // Handle city data which might be an array or single object
          let cityData: City | null = null;
          
          if (Array.isArray(item.friend.city) && item.friend.city.length > 0) {
            cityData = item.friend.city[0];
          } else if (item.friend.city && !Array.isArray(item.friend.city)) {
            cityData = item.friend.city;
          }
          
          if (!cityData) continue;
          
          const friendLocation: FriendLocation = {
            id: item.friend.id,
            name: item.friend.name,
            profile_picture_url: item.friend.profile_picture_url,
            city: cityData
          };
          
          if (isFriendLocation(friendLocation)) {
            locations.push(friendLocation);
          }
        }
      }
      
      // Group friends by city to create clusters
      const clusters: FriendCluster[] = [];
      
      locations.forEach(friend => {
        const existingCluster = clusters.find(cluster => cluster.cityId === friend.city.id);
        
        if (existingCluster) {
          existingCluster.friends.push({
            id: friend.id,
            name: friend.name,
            profile_picture_url: friend.profile_picture_url
          });
        } else {
          clusters.push({
            cityId: friend.city.id,
            cityName: friend.city.name,
            countryName: friend.city.country,
            lat: friend.city.lat,
            lng: friend.city.lng,
            friends: [{
              id: friend.id,
              name: friend.name,
              profile_picture_url: friend.profile_picture_url
            }]
          });
        }
      });
      
      // Store clusters for later use
      lastClustersRef.current = clusters;
      
      // Add markers to the map using the ref
      if (mapRef.current) {
        addMarkersToMapRef.current(clusters);
      }
    } catch (err) {
      console.error('Error in fetchFriendLocations:', err);
      setError('Failed to load friend locations');
    } finally {
      console.log('Friend location fetch completed');
      setLoading(false);
    }
  }, [loading]);

  // Update markers when user changes or initializes
  useEffect(() => {
    if (mapRef.current && currentUser) {
      console.log('Current user changed, updating markers with user:', currentUser.id);
      // Add user marker immediately when currentUser is set/changed
      addMarkersToMap(lastClustersRef.current);
    } else {
      console.log('Cannot update markers yet. Map initialized:', !!mapRef.current, 'Current user:', currentUser?.id);
    }
  }, [currentUser, addMarkersToMap]);

  // Initialize Google Maps
  useEffect(() => {
    let isMounted = true;
    
    // Create a test element to check for advanced markers support
    const testForAdvancedMarkers = (): boolean => {
      try {
        console.log('Testing for advanced markers support...');
        if (!window.google?.maps?.marker?.AdvancedMarkerElement) {
          console.log('Advanced Markers API not available in window.google.maps.marker');
          return false;
        }
        
        // Try to create an element to verify it works
        const testDiv = document.createElement('div');
        testDiv.textContent = 'Test';
        try {
          // Check if the constructor exists without actually creating an instance
          if (typeof window.google.maps.marker.AdvancedMarkerElement !== 'function') {
            console.log('AdvancedMarkerElement is not a constructor');
            return false;
          }
          return true;
        } catch {
          console.log('Error creating test AdvancedMarkerElement');
          return false;
        }
      } catch (error: unknown) {
        console.error('Error testing for advanced markers:', error);
        return false;
      }
    };

    const initMap = async () => {
      try {
        console.log('Attempting to initialize map...');
        // Prevent multiple initializations
        if (!mapContainerRef.current) {
          console.log('Map container ref not available');
          return;
        }
        if (mapRef.current) {
          console.log('Map already initialized');
          return;
        }
        if (mapInitialized) {
          console.log('Map already marked as initialized');
          return;
        }
        
        // Load Google Maps API
        console.log('Loading Google Maps API...');
        const { initGoogleMaps } = await import('@/lib/maps/client');
        const { google, mapId } = await initGoogleMaps();
        console.log('Google Maps API loaded, Map ID:', mapId || 'none');
        
        // Test for advanced markers support once Google is loaded
        const hasAdvancedMarkers = testForAdvancedMarkers();
        console.log('Advanced markers support:', hasAdvancedMarkers ? 'available' : 'not available');
        
        if (!isMounted || !mapContainerRef.current) return;
        
        // Map options
        console.log('Creating map with options...');
        const mapOptions: google.maps.MapOptions = {
          center: { lat: 20, lng: 0 }, // Center on the world
          zoom: 2,
          minZoom: 2,
          maxZoom: 15,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: false,
          zoomControl: true,
          zoomControlOptions: {
            position: google.maps.ControlPosition.RIGHT_BOTTOM
          }
        };
        
        // Add mapId if available
        if (mapId) {
          console.log('Using Map ID:', mapId);
          mapOptions.mapId = mapId;
        } else {
          console.log('No Map ID, using custom styles');
          // Only set styles if mapId is not present
          mapOptions.styles = [
            {
              featureType: 'poi',
              elementType: 'labels',
              stylers: [{ visibility: 'off' }]
            },
            {
              featureType: 'transit',
              stylers: [{ visibility: 'off' }]
            },
            {
              featureType: 'water',
              elementType: 'geometry',
              stylers: [{ color: '#e9f5f9' }]
            },
            {
              featureType: 'landscape',
              elementType: 'geometry',
              stylers: [{ color: '#f5f5f5' }]
            },
            {
              featureType: 'administrative.country',
              elementType: 'geometry.stroke',
              stylers: [{ color: '#d1d1d1' }]
            }
          ];
        }
        
        // Create a new map instance
        console.log('Creating map instance...');
        const map = new google.maps.Map(mapContainerRef.current, mapOptions);
        console.log('Map created successfully');
        
        // Listen for zoom changes to adjust marker sizes
        map.addListener('zoom_changed', () => {
          const zoom = map.getZoom();
          if (zoom !== undefined) {
            setZoomLevel(zoom);
          }
        });
        
        mapRef.current = map;
        console.log('Setting map initialized state');
        setMapInitialized(true);
        
        // Fetch friend locations after map is initialized
        if (isMounted) {
          console.log('Map initialized, fetching friend locations...');
          fetchFriendLocations();
        }
      } catch (err) {
        console.error('Error initializing map:', err);
        if (isMounted) {
          setError('Failed to load map');
          setLoading(false);
        }
      }
    };
    
    console.log('Running map initialization effect');
    initMap();
    
    // Cleanup function to prevent memory leaks and state updates after unmounting
    return () => {
      console.log('Cleaning up map resources');
      isMounted = false;
      
      // Clean up markers
      Object.values(markerRefs).forEach(marker => {
        if ('setMap' in marker) {
          marker.setMap(null);
        }
      });
      
      // Clear map reference
      if (mapRef.current) {
        // Remove event listeners if needed
        google.maps.event.clearInstanceListeners(mapRef.current);
        mapRef.current = null;
      }
    };
  }, [fetchFriendLocations, mapInitialized]);
  
  // Add explicit check for currentUser in the component
  useEffect(() => {
    console.log('MapView component - currentUser state:', currentUser ? 'available' : 'not available');
    if (currentUser) {
      console.log('Current user details:', {
        id: currentUser.id,
        name: currentUser.name,
        city: currentUser.city ? `${currentUser.city.name}, ${currentUser.city.country}` : 'No city data',
        hasProfilePic: !!currentUser.profile_picture_url
      });
    }
  }, [currentUser]);

  // Add explicit marker visualization check
  useEffect(() => {
    console.log('Marker refs updated:', Object.keys(markerRefs));
    // Check to see if markers are visible after a short delay to allow rendering
    const checkMarkerVisibility = setTimeout(() => {
      const mapContainer = document.querySelector('[aria-label="Google Maps"]');
      const visibleMarkers = mapContainer?.querySelectorAll('.my-location-marker, .friend-marker')?.length || 0;
      console.log('Visible markers on map:', visibleMarkers);
      
      // If no markers are visible but we should have them, log warning
      if (visibleMarkers === 0 && Object.keys(markerRefs).length > 0) {
        console.warn('⚠️ Markers are in refs but not visible in DOM. Possible rendering issue.');
        
        // Force a marker refresh if we have a current user
        if (currentUser && mapRef.current) {
          console.log('Attempting to force marker refresh');
          addMarkersToMap(lastClustersRef.current);
        }
      }
    }, 1000);
    
    return () => clearTimeout(checkMarkerVisibility);
  }, [markerRefs, currentUser, addMarkersToMap]);

  // Add check for Advanced Markers CSS
  useEffect(() => {
    // Add Advanced Markers required CSS
    const ensureAdvancedMarkersCss = () => {
      // Check if we've already added the style
      if (document.getElementById('advanced-markers-css')) return;
      
      console.log('Adding necessary CSS for Advanced Markers');
      const style = document.createElement('style');
      style.id = 'advanced-markers-css';
      style.textContent = `
        .advanced-marker-container {
          position: relative;
          z-index: 1;
          display: block;
        }
        
        .marker-hidden {
          opacity: 0;
          pointer-events: none;
        }
        
        /* Additional styles to ensure markers are visible */
        .my-location-marker, .friend-marker {
          min-width: 32px;
          min-height: 32px;
          background-color: #10b981; /* Default color for location marker */
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 50%;
          z-index: 999; /* Ensure high stacking order */
        }
        
        .my-location-marker::after {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          border-radius: 50%;
          border: 2px solid white;
          z-index: 1;
        }
      `;
      document.head.appendChild(style);
    };
    
    ensureAdvancedMarkersCss();
    
    // Add pulse animation CSS
    const ensurePulseAnimationCss = () => {
      // Check if we've already added the style
      if (document.getElementById('pulse-animation-css')) return;
      
      console.log('Adding pulse animation CSS');
      const style = document.createElement('style');
      style.id = 'pulse-animation-css';
      style.textContent = `
        @keyframes pulse {
          0% {
            transform: scale(1);
            opacity: 0.6;
          }
          70% {
            transform: scale(1.2);
            opacity: 0;
          }
          100% {
            transform: scale(1);
            opacity: 0;
          }
        }
      `;
      document.head.appendChild(style);
    };
    
    ensurePulseAnimationCss();
  }, []);
  
  // Fetch friend locations and update markers when map is initialized
  useEffect(() => {
    if (mapInitialized && mapRef.current) {
      console.log('Map initialized effect triggered, initialized =', mapInitialized);
      // Only fetch if map is initialized and not already loading
      if (!loading) {
        console.log('Calling fetchFriendLocations after map initialization');
        fetchFriendLocations();
      }
    }
  }, [mapInitialized, fetchFriendLocations, loading]);
  
  // Update markers when zoom level changes
  useEffect(() => {
    if (mapInitialized && Object.keys(markerRefs).length > 0) {
      // Resize markers based on zoom
      Object.entries(markerRefs).forEach(([key, marker]) => {
        // Only update if this is an AdvancedMarkerElement with content
        if ('content' in marker && marker.content instanceof HTMLElement) {
          const markerElem = marker.content.querySelector('.friend-marker, .my-location-marker') as HTMLElement;
          if (markerElem) {
            const isCluster = key.startsWith('cluster-') && markerElem.textContent && Boolean(parseInt(markerElem.textContent) > 1);
            const isCurrent = key.startsWith('user-');
            
            markerElem.style.width = `${getMarkerSize(Boolean(isCluster), isCurrent)}px`;
            markerElem.style.height = `${getMarkerSize(Boolean(isCluster), isCurrent)}px`;
          }
        } else if ('setIcon' in marker) {
          // Update standard marker icons sizes based on zoom
          const isCluster = key.startsWith('cluster-');
          const isCurrent = key.startsWith('user-');
          const icon = marker.getIcon();
          let iconUrl = '';
          
          if (icon) {
            if (typeof icon === 'string') {
              iconUrl = icon;
            } else if (icon && typeof icon === 'object' && 'url' in icon) {
              iconUrl = icon.url as string;
            }
          }
          
          marker.setIcon({
            url: iconUrl || (isCurrent ? 'https://maps.google.com/mapfiles/ms/icons/green-dot.png' : 
                   (isCluster ? 'https://maps.google.com/mapfiles/ms/icons/blue-dot.png' : 
                   'https://maps.google.com/mapfiles/ms/icons/red-dot.png')),
            scaledSize: new window.google.maps.Size(
              getMarkerSize(isCluster, isCurrent),
              getMarkerSize(isCluster, isCurrent)
            )
          });
        }
      });
    }
  }, [zoomLevel, markerRefs, getMarkerSize, mapInitialized]);
  
  // Close the friend details panel
  const handleCloseDetails = () => {
    setSelectedCluster(null);
  };
  
  if (error) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center p-6 bg-white rounded-lg shadow-md">
          <h3 className="text-xl font-semibold text-red-600 mb-2">Error</h3>
          <p className="text-gray-700">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="relative w-full h-full">
      {/* CSS for pulse animation */}
      <style jsx global>{`
        @keyframes pulse {
          0% {
            transform: scale(1);
            opacity: 0.6;
          }
          70% {
            transform: scale(1.2);
            opacity: 0;
          }
          100% {
            transform: scale(1);
            opacity: 0;
          }
        }
      `}</style>
      
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-75 z-10">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
            <p className="text-indigo-600 font-medium">Loading map...</p>
          </div>
        </div>
      )}
      
      {/* Map Container */}
      <div 
        ref={mapContainerRef} 
        className="w-full h-full"
      ></div>
      
      {/* Friend Details Panel */}
      {selectedCluster && (
        <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-xl shadow-lg max-h-[60%] overflow-hidden flex flex-col">
          <div className="flex justify-between items-center p-4 border-b border-gray-100">
            <div>
              <h3 className="text-lg font-semibold">
                {selectedCluster.cityName}, <span className="text-gray-600">{selectedCluster.countryName}</span>
              </h3>
              <p className="text-sm text-gray-500">
                {selectedCluster.friends.length === 1 
                  ? '1 person' 
                  : `${selectedCluster.friends.length} people`}
              </p>
            </div>
            <button
              onClick={handleCloseDetails}
              className="p-2 rounded-full hover:bg-gray-100 transition-colors"
              aria-label="Close details"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          <div className="overflow-y-auto p-4">
            <ul className="divide-y divide-gray-100">
              {selectedCluster.friends.map(friend => (
                <li key={friend.id} className="py-3 flex items-center space-x-3">
                  <div className="relative w-12 h-12 rounded-full overflow-hidden bg-gray-200 flex-shrink-0">
                    {friend.profile_picture_url ? (
                      <Image
                        src={friend.profile_picture_url}
                        alt={friend.name || 'Friend'}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-indigo-600 text-white text-lg font-semibold">
                        {friend.name ? friend.name.charAt(0) : '?'}
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">
                      {friend.name || 'Unknown Friend'}
                      {friend.id === currentUser?.id && (
                        <span className="ml-2 text-xs font-normal text-green-600 bg-green-50 px-2 py-0.5 rounded-full">
                          You
                        </span>
                      )}
                    </p>
                  </div>
                  
                  {/* Optional actions for each friend */}
                  <div className="flex-shrink-0">
                    <button 
                      className="text-indigo-600 hover:text-indigo-800"
                      aria-label="Contact friend"
                      onClick={() => {/* Add functionality to message/call friend */}}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                      </svg>
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
      
      {/* Map controls overlay */}
      <div className="absolute top-4 right-4 flex flex-col space-y-2">
        <button 
          onClick={() => mapRef.current?.setZoom(Math.min(15, (mapRef.current?.getZoom() || 0) + 1))} 
          className="bg-white rounded-full p-2 shadow-md hover:bg-gray-50 focus:outline-none"
          aria-label="Zoom in"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
        </button>
        <button 
          onClick={() => mapRef.current?.setZoom(Math.max(2, (mapRef.current?.getZoom() || 0) - 1))}
          className="bg-white rounded-full p-2 shadow-md hover:bg-gray-50 focus:outline-none"
          aria-label="Zoom out"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 12H6" />
          </svg>
        </button>
        
        {currentUser && (
          <button 
            onClick={() => {
              if (currentUser && mapRef.current) {
                mapRef.current.setCenter({ lat: currentUser.city.lat, lng: currentUser.city.lng });
                mapRef.current.setZoom(5);
              }
            }}
            className="bg-white rounded-full p-2 shadow-md hover:bg-gray-50 focus:outline-none"
            aria-label="Center on my location"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </button>
        )}
      </div>
      
      {/* Status message for no friends */}
      {!loading && mapInitialized && !error && currentUser && 
       Object.keys(markerRefs).length === 1 && (
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-white rounded-lg shadow-md p-3 z-10">
          <p className="text-center text-gray-700">
            <span className="font-medium">You haven&apos;t added any friends yet.</span>
            <br />
            <span className="text-sm">Use the &quot;Add Friend&quot; button to connect with people.</span>
          </p>
        </div>
      )}
    </div>
  );
} 
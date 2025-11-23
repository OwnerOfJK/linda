import React, { useState, useRef, useEffect, useCallback } from 'react';
import { View, Text, TouchableOpacity, Animated, Dimensions, Modal, StyleSheet } from 'react-native';
import MapView, { PROVIDER_GOOGLE, Marker } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';
import { useFriends } from '@/context/FriendsContext';
import { useUser } from '@/context/UserContext';
import type { User, Region, PooledMarker } from '@/types';
import { MAP_SETTINGS, MAP_STYLE } from '@/constants/mapConstants';
import { useRouter } from 'expo-router';

const { height } = Dimensions.get('window');

export default function MapScreen() {
  const mapRef = useRef<MapView>(null);
  const slideAnim = useRef(new Animated.Value(height)).current;
  const router = useRouter();

  const { friends } = useFriends();
  const { latitude: userLatitude, longitude: userLongitude } = useUser();

  const [selectedFriends, setSelectedFriends] = useState<User[]>([]);
  const [region, setRegion] = useState<Region>({
    latitude: 20,
    longitude: 0,
    latitudeDelta: MAP_SETTINGS.INITIAL_DELTA,
    longitudeDelta: MAP_SETTINGS.INITIAL_DELTA,
  });
  const [currentZoom, setCurrentZoom] = useState<number>(MAP_SETTINGS.INITIAL_DELTA);

  // Center map on user's location
  const centerOnUserLocation = useCallback(async () => {
    if (userLatitude !== null && userLongitude !== null) {
      const newRegion = {
        latitude: userLatitude,
        longitude: userLongitude,
        latitudeDelta: 10,
        longitudeDelta: 10,
      };
      setRegion(newRegion);
      setCurrentZoom(10);
      mapRef.current?.animateToRegion(newRegion, MAP_SETTINGS.ANIMATION_DURATION);
    }
  }, [userLatitude, userLongitude]);

  useEffect(() => {
    centerOnUserLocation();
  }, [centerOnUserLocation]);

  // Track zoom level changes
  const handleRegionChange = (newRegion: Region) => {
    setCurrentZoom(newRegion.latitudeDelta);
  };

  // Pool markers by city when zoomed out
  const poolMarkers = (): PooledMarker[] => {
    const shouldPoolRealtime = currentZoom > MAP_SETTINGS.ZOOM_THRESHOLD;
    const cityGroups: { [key: string]: User[] } = {};
    const cityTotals: { [key: string]: number } = {};

    // Filter out friends with no location sharing
    const sharingFriends = friends.filter((friend) => friend.privacy_level !== 'none');

    // Count all friends in each city
    sharingFriends.forEach((friend) => {
      if (friend.city) {
        const cityKey = `${friend.city}-${friend.country}`;
        cityTotals[cityKey] = (cityTotals[cityKey] || 0) + 1;
      }
    });

    // Group friends that should be pooled
    sharingFriends.forEach((friend) => {
      const shouldPool =
        friend.privacy_level === 'city' ||
        (shouldPoolRealtime && friend.privacy_level === 'realtime');

      if (shouldPool && friend.city) {
        const cityKey = `${friend.city}-${friend.country}`;
        if (!cityGroups[cityKey]) {
          cityGroups[cityKey] = [];
        }
        cityGroups[cityKey].push(friend);
      }
    });

    return Object.entries(cityGroups)
      .filter(([_, friendsList]) => friendsList.length > 0)
      .map(([cityKey, friendsList]) => {
        // Find first friend with valid coordinates
        // Now city-level users also have coordinates (city center)
        const friendWithCoords = friendsList.find(
          (f) => f.latitude !== null && f.longitude !== null
        );

        return {
          id: cityKey,
          latitude: friendWithCoords?.latitude ?? 0,
          longitude: friendWithCoords?.longitude ?? 0,
          city: friendsList[0].city,
          country: friendsList[0].country,
          friends: friendsList,
          count: cityTotals[cityKey],
          hasValidCoords: friendWithCoords !== undefined,
        };
      })
      .filter((marker) => marker.hasValidCoords); // Filter out markers without any coordinates
  };

  // Handle marker press
  const handleMarkerPress = (friendsToShow: User[]) => {
    setSelectedFriends(friendsToShow);
    Animated.spring(slideAnim, {
      toValue: 0,
      useNativeDriver: true,
      tension: 50,
      friction: 7,
    }).start();
  };

  // Close friend detail modal
  const closeFriendDetail = () => {
    Animated.timing(slideAnim, {
      toValue: height,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      setSelectedFriends([]);
    });
  };

  const pooledMarkers = poolMarkers();
  const pooledFriendIds = new Set(
    pooledMarkers.flatMap((marker) => marker.friends.map((f) => f.userId))
  );

  // Individual markers (real-time sharers when zoomed in)
  const individualMarkers = friends.filter(
    (friend) =>
      friend.privacy_level !== 'none' && // Exclude friends not sharing location
      !pooledFriendIds.has(friend.userId) &&
      friend.privacy_level === 'realtime' &&
      friend.latitude !== null &&
      friend.longitude !== null &&
      currentZoom <= MAP_SETTINGS.ZOOM_THRESHOLD
  );

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        provider={PROVIDER_GOOGLE}
        style={styles.map}
        initialRegion={region}
        customMapStyle={MAP_STYLE}
        showsUserLocation
        showsMyLocationButton={false}
        onRegionChangeComplete={handleRegionChange}
      >
        {/* Pooled markers */}
        {pooledMarkers.map((pooledMarker) => {
          // Check if this is a city-level only marker (all friends have city privacy)
          const isCityOnly = pooledMarker.friends.every((f) => f.privacy_level === 'city');
          const markerColor = isCityOnly ? 'bg-orange-500' : 'bg-blue-500';

          return (
            <Marker
              key={pooledMarker.id}
              coordinate={{
                latitude: pooledMarker.latitude,
                longitude: pooledMarker.longitude,
              }}
              onPress={() => handleMarkerPress(pooledMarker.friends)}
            >
              <View className={`${markerColor} rounded-full px-3 py-2 items-center justify-center shadow-lg`}>
                <Text className="text-white font-bold text-sm">{pooledMarker.count}</Text>
              </View>
            </Marker>
          );
        })}

        {/* Individual real-time markers when zoomed in */}
        {individualMarkers.map((friend) => (
          <Marker
            key={friend.userId}
            coordinate={{
              latitude: friend.latitude!,
              longitude: friend.longitude!,
            }}
            onPress={() => handleMarkerPress([friend])}
          >
            <View className="bg-green-500 rounded-full w-10 h-10 items-center justify-center shadow-lg border-2 border-white">
              <Ionicons name="person" size={20} color="white" />
            </View>
          </Marker>
        ))}
      </MapView>

      {/* Top Bar */}
      <View className="absolute top-12 right-4 flex-row justify-between items-center bg-white/90 py-3 px-4 rounded-lg shadow-md">
        <TouchableOpacity
          className="p-2"
          onPress={() => router.push('/settings')}
        >
          <Ionicons name="settings-outline" size={24} color="#111827" />
        </TouchableOpacity>
      </View>

      {/* Center on Location Button */}
      <TouchableOpacity
        className="absolute bottom-10 self-center w-14 h-14 rounded-full bg-blue-500 items-center justify-center shadow-lg"
        onPress={centerOnUserLocation}
      >
        <Ionicons name="locate" size={24} color="white" />
      </TouchableOpacity>

      {/* Friend Detail Modal */}
      <Modal
        visible={selectedFriends.length > 0}
        transparent
        animationType="none"
        onRequestClose={closeFriendDetail}
      >
        <TouchableOpacity
          className="flex-1 bg-black/50"
          activeOpacity={1}
          onPress={closeFriendDetail}
        >
          <Animated.View
            style={{ transform: [{ translateY: slideAnim }] }}
            className="absolute bottom-0 left-0 right-0 bg-white rounded-t-3xl shadow-2xl"
          >
            <TouchableOpacity activeOpacity={1}>
              {/* Drag handle */}
              <View className="items-center py-4">
                <View className="w-12 h-1 bg-gray-300 rounded-full" />
              </View>

              {/* Content */}
              <View className="px-6 pb-8">
                <Text className="text-2xl font-bold text-gray-900 mb-4">
                  {selectedFriends.length === 1
                    ? selectedFriends[0].name
                    : `${selectedFriends.length} friends`}
                </Text>

                {selectedFriends.length === 1 ? (
                  // Single friend view
                  <View>
                    <View className="flex-row items-center mb-3">
                      <Ionicons name="location-outline" size={20} color="#6B7280" />
                      <Text className="ml-2 text-base text-gray-700">
                        {selectedFriends[0].city}, {selectedFriends[0].country}
                      </Text>
                    </View>
                    <View className="flex-row items-center mb-3">
                      <Ionicons
                        name={selectedFriends[0].privacy_level === 'realtime' ? 'navigate-outline' : 'business-outline'}
                        size={20}
                        color="#6B7280"
                      />
                      <Text className="ml-2 text-base text-gray-700">
                        {selectedFriends[0].privacy_level === 'realtime' ? 'Real-time location' : 'City-level sharing'}
                      </Text>
                    </View>
                  </View>
                ) : (
                  // Multiple friends view
                  <View>
                    {selectedFriends.map((friend) => (
                      <View key={friend.userId} className="mb-4 pb-4 border-b border-gray-200">
                        <Text className="text-lg font-semibold text-gray-900 mb-2">
                          {friend.name}
                        </Text>
                        <View className="flex-row items-center">
                          <Ionicons name="location-outline" size={16} color="#6B7280" />
                          <Text className="ml-2 text-sm text-gray-600">
                            {friend.city}, {friend.country}
                          </Text>
                        </View>
                      </View>
                    ))}
                  </View>
                )}

                <TouchableOpacity
                  className="mt-4 bg-blue-500 py-4 rounded-lg items-center"
                  onPress={closeFriendDetail}
                >
                  <Text className="text-white font-semibold text-base">Close</Text>
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          </Animated.View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
});

import React from 'react';
import { View, Text, Button, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { AppleMaps, GoogleMaps } from 'expo-maps';

export default function MapScreen() {
  const router = useRouter();

  // Render map based on platform
  const renderMap = () => {
    if (Platform.OS === 'ios') {
      return <AppleMaps.View style={{ flex: 1 }} />;
    } else if (Platform.OS === 'android') {
      return <GoogleMaps.View style={{ flex: 1 }} />;
    } else {
      return <Text>Maps are only available on Android and iOS</Text>;
    }
  };

  return (
    <View className="flex-1 bg-white">
      {renderMap()}
      <View className="absolute bottom-10 w-full items-center">
        <Button title="Go Back" onPress={() => router.navigate('/logged-in')} />
      </View>
    </View>
  );
}

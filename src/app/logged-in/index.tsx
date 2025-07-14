import React from 'react';
import { View, Text } from 'react-native';
import { router } from 'expo-router';

export default function Home() {
  React.useEffect(() => {
    router.replace('/logged-in/social/map');
  }, []);

  return (
    <View className="flex-1 items-center justify-center">
      <Text>Redirecting to map...</Text>
    </View>
  );
}

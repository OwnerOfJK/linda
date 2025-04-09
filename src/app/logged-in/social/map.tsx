import React from 'react';
import { View, Text, Button } from 'react-native';
import { useRouter } from 'expo-router';

export default function MapScreen() {
  const router = useRouter();
  return (
    <View className="flex-1 items-center justify-center bg-white">
      <Text>Map Screen</Text>
      <Button title="Go Back" onPress={() => router.navigate('/logged-in')} />
    </View>
  );
}

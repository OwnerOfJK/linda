import React from 'react';
import { View, Text } from 'react-native';
import { useLocalSearchParams } from 'expo-router';

export default function NotFound() {
  const { friendId } = useLocalSearchParams();

  return (
    <View className="flex-1 items-center justify-center bg-white">
      <Text>{friendId} Not Found</Text>
    </View>
  );
}

import React from 'react';
import { Text, View, Button } from 'react-native';
import { useRouter, Link } from 'expo-router';

export default function Home() {
  const router = useRouter();

  return (
    <View className="flex-1 items-center justify-center bg-white">
      <Text>Welcome!</Text>
      <Button title="Go to Map View" onPress={() => router.navigate('/logged-in/social/map')} />
      <Link href="/logged-in/profile/bacon">View user (id inline)</Link>
    </View>
  );
}

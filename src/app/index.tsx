import { Text, View, Button } from 'react-native';
import { useRouter } from 'expo-router';
import React from 'react';

export default function Index() {
  const router = useRouter();
  return (
    <View className="flex-1 items-center justify-center bg-white">
      <Text className="mb-4 text-2xl font-bold">Welcome to Linda</Text>
      <Button title="Login here" onPress={() => router.navigate('/login/login')} />
    </View>
  );
}

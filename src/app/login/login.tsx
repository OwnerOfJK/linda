import { Button } from 'react-native';
import { useRouter } from 'expo-router';
import { View, Text, TextInput } from 'react-native';
import React from 'react';

export default function Login() {
  const router = useRouter();
  return (
    <View className="flex-1 items-center justify-center bg-white p-4">
      <Text className="mb-8 text-2xl font-bold">Login to Linda</Text>
      <TextInput
        className="mb-4 w-full rounded border border-gray-300 px-3 py-2"
        placeholder="Phone Number"
      />
      <Button
        title="Login"
        onPress={() => {
          router.replace('/logged-in');
        }}
      />
    </View>
  );
}

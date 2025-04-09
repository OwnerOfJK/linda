import { Button } from 'react-native';
import { useRouter } from 'expo-router';
import { View, Text, TextInput } from 'react-native';
import React from 'react';

export default function Login() {
  const router = useRouter();
  return (
    <View className="flex-1 items-center justify-center">
      {/* login form */}
      <Text className="mb-5">Login Form</Text>
      <TextInput placeholder="Email" />
      <TextInput placeholder="Password" secureTextEntry />
      <Button
        title="Login"
        onPress={() => {
          /* authenticate user */
          router.replace('/logged-in');
        }}
      />
    </View>
  );
}

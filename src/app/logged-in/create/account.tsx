import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert } from 'react-native';
import { useRouter } from 'expo-router';

export default function AccountCreation() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [currentCity, setCurrentCity] = useState('');

  const handleCreateAccount = () => {
    if (!name.trim()) {
      Alert.alert('Error', 'Please enter your name');
      return;
    }

    if (!currentCity.trim()) {
      Alert.alert('Error', 'Please enter your current city');
      return;
    }

    Alert.alert('Account Created', `Welcome ${name}! Your location is set to ${currentCity}`);
    router.replace('/logged-in/social/map');
  };

  return (
    <View className="flex-1 justify-center bg-white p-6">
      <Text className="mb-8 text-center text-2xl font-bold">Create Account</Text>

      <View className="mb-6">
        <Text className="mb-2 text-lg font-semibold">Name</Text>
        <TextInput
          className="rounded border border-gray-300 px-3 py-2"
          placeholder="Enter your name"
          value={name}
          onChangeText={setName}
        />
      </View>

      <View className="mb-8">
        <Text className="mb-2 text-lg font-semibold">Current City</Text>
        <TextInput
          className="rounded border border-gray-300 px-3 py-2"
          placeholder="Enter your current city"
          value={currentCity}
          onChangeText={setCurrentCity}
        />
        <Text className="mt-1 text-sm text-gray-500">
          This will be your starting location on the map
        </Text>
      </View>

      <TouchableOpacity className="rounded-lg bg-blue-500 px-6 py-3" onPress={handleCreateAccount}>
        <Text className="text-center font-semibold text-white">Create Account</Text>
      </TouchableOpacity>
    </View>
  );
}

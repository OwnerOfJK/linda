import React from 'react';
import { View, Text, TouchableOpacity, Alert } from 'react-native';
import { useRouter } from 'expo-router';

export default function MapScreen() {
  const router = useRouter();
  const handleAddMove = () => {
    Alert.alert('Add Move', 'Move modal would open here');
  };

  const handleCityPress = (cityName: string) => {
    router.push(`/logged-in/city/${cityName}`);
  };

  const handleFriendPress = (friendId: string) => {
    router.push(`/logged-in/friends/${friendId}`);
  };

  const handleProfilePress = () => {
    router.push('/logged-in/profile/me');
  };

  return (
    <View className="flex-1 bg-gray-100">
      <View>
        <TouchableOpacity
          className="absolute right-8 top-8 h-14 w-14 items-center justify-center rounded-full bg-blue-600"
          onPress={handleProfilePress}>
          <Text className="text-2xl text-white">👤</Text>
        </TouchableOpacity>
      </View>
      <View className="flex-1 items-center justify-center">
        <Text className="mb-4 text-2xl font-bold">Map View</Text>
        <Text className="mb-8 text-gray-600">Interactive map will be here</Text>

        <View className="space-y-4">
          <TouchableOpacity
            className="rounded bg-blue-500 px-4 py-2"
            onPress={() => handleCityPress('New York')}>
            <Text className="text-white">Sample City: New York</Text>
          </TouchableOpacity>

          <TouchableOpacity
            className="rounded bg-green-500 px-4 py-2"
            onPress={() => handleFriendPress('friend1')}>
            <Text className="text-white">Sample Friend Pin</Text>
          </TouchableOpacity>
        </View>
      </View>

      <TouchableOpacity
        className="absolute bottom-8 right-8 h-14 w-14 items-center justify-center rounded-full bg-blue-600"
        onPress={handleAddMove}>
        <Text className="text-2xl text-white">+</Text>
      </TouchableOpacity>
    </View>
  );
}

import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, TextInput, Alert } from 'react-native';
import { useRouter } from 'expo-router';

export default function MyProfilePage() {
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [currentCity, setCurrentCity] = useState('New York');

  const userProfile = {
    name: 'John Doe',
    currentCity: currentCity,
    profilePicture: '👤',
  };

  const moveHistory = [
    { id: 1, city: 'San Francisco', date: '2023-01-15' },
    { id: 2, city: 'Los Angeles', date: '2023-06-20' },
    { id: 3, city: 'New York', date: '2023-09-10' },
  ];

  const handleSaveCity = () => {
    setIsEditing(false);
    Alert.alert('City Updated', `Current city changed to ${currentCity}`);
  };

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Logout', onPress: () => router.replace('/login/login') },
    ]);
  };

  return (
    <ScrollView className="flex-1 bg-white p-4">
      <View className="mb-6 items-center">
        <Text className="mb-2 text-4xl">{userProfile.profilePicture}</Text>
        <Text className="text-2xl font-bold">{userProfile.name}</Text>
        <Text className="text-gray-500">My Profile</Text>
      </View>

      <View className="mb-6">
        <Text className="mb-3 text-lg font-semibold">Current City</Text>
        {isEditing ? (
          <View>
            <TextInput
              className="mb-3 rounded border border-gray-300 px-3 py-2"
              value={currentCity}
              onChangeText={setCurrentCity}
              placeholder="Enter city name"
            />
            <View className="flex-row space-x-2">
              <TouchableOpacity
                className="flex-1 rounded bg-green-500 px-4 py-2"
                onPress={handleSaveCity}>
                <Text className="text-center text-white">Save</Text>
              </TouchableOpacity>
              <TouchableOpacity
                className="flex-1 rounded bg-gray-500 px-4 py-2"
                onPress={() => setIsEditing(false)}>
                <Text className="text-center text-white">Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <View className="flex-row items-center justify-between">
            <Text className="text-gray-700">{userProfile.currentCity}</Text>
            <TouchableOpacity
              className="rounded bg-blue-500 px-3 py-1"
              onPress={() => setIsEditing(true)}>
              <Text className="text-white">Edit</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      <View className="mb-6">
        <Text className="mb-3 text-lg font-semibold">Move History</Text>
        {moveHistory.map((move) => (
          <View key={move.id} className="mb-2 rounded-lg bg-gray-50 p-3">
            <Text className="font-medium">{move.city}</Text>
            <Text className="text-gray-600">{move.date}</Text>
          </View>
        ))}
      </View>

      <View className="space-y-3">
        <TouchableOpacity
          className="rounded bg-blue-500 px-4 py-2"
          onPress={() => router.push('/logged-in/friends/addFriends')}>
          <Text className="text-center text-white">Manage Friends</Text>
        </TouchableOpacity>

        <TouchableOpacity className="rounded bg-red-500 px-4 py-2" onPress={handleLogout}>
          <Text className="text-center text-white">Logout</Text>
        </TouchableOpacity>

        <TouchableOpacity className="rounded bg-gray-500 px-4 py-2" onPress={() => router.back()}>
          <Text className="text-center text-white">Back</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

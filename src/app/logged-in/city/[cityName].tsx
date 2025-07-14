import React from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';

export default function CityPage() {
  const { cityName } = useLocalSearchParams();
  const router = useRouter();

  const sampleFriends = [
    { id: 'friend1', name: 'John Doe' },
    { id: 'friend2', name: 'Jane Smith' },
    { id: 'friend3', name: 'Bob Johnson' },
  ];

  const handleFriendPress = (friendId: string) => {
    router.push(`/logged-in/friends/${friendId}`);
  };

  return (
    <ScrollView className="flex-1 bg-white p-4">
      <Text className="mb-4 text-2xl font-bold">City: {cityName}</Text>

      <Text className="mb-3 text-lg font-semibold">Friends in this city:</Text>

      <View className="space-y-2">
        {sampleFriends.map((friend) => (
          <TouchableOpacity
            key={friend.id}
            className="rounded-lg bg-gray-100 p-3"
            onPress={() => handleFriendPress(friend.id)}>
            <Text className="font-medium">{friend.name}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity
        className="mt-6 rounded bg-blue-500 px-4 py-2"
        onPress={() => router.back()}>
        <Text className="text-center text-white">Back to Map</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

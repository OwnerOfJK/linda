import React from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';

export default function FriendPage() {
  const { friendId } = useLocalSearchParams();
  const router = useRouter();

  const sampleFriend = {
    id: friendId,
    name: 'John Doe',
    currentCity: 'New York',
    profilePicture: '=d',
  };

  const sampleMoveHistory = [
    { id: 1, city: 'San Francisco', date: '2023-01-15', type: 'move' },
    { id: 2, city: 'Los Angeles', date: '2023-06-20', type: 'visit' },
    { id: 3, city: 'New York', date: '2023-09-10', type: 'move' },
  ];

  const upcomingMoves = [{ id: 4, city: 'London', startDate: '2024-03-15', endDate: 'Indefinite' }];

  return (
    <ScrollView className="flex-1 bg-white p-4">
      <View className="mb-6 items-center">
        <Text className="mb-2 text-4xl">{sampleFriend.profilePicture}</Text>
        <Text className="text-2xl font-bold">{sampleFriend.name}</Text>
        <Text className="text-gray-600">Currently in {sampleFriend.currentCity}</Text>
      </View>

      <View className="mb-6">
        <Text className="mb-3 text-lg font-semibold">Upcoming Moves</Text>
        {upcomingMoves.map((move) => (
          <View key={move.id} className="mb-2 rounded-lg bg-blue-50 p-3">
            <Text className="font-medium">Moving to {move.city}</Text>
            <Text className="text-gray-600">Start: {move.startDate}</Text>
            <Text className="text-gray-600">End: {move.endDate}</Text>
          </View>
        ))}
      </View>

      <View className="mb-6">
        <Text className="mb-3 text-lg font-semibold">Move History</Text>
        {sampleMoveHistory.map((move) => (
          <View key={move.id} className="mb-2 rounded-lg bg-gray-50 p-3">
            <Text className="font-medium">{move.city}</Text>
            <Text className="text-gray-600">
              {move.date} - {move.type}
            </Text>
          </View>
        ))}
      </View>

      <TouchableOpacity className="rounded bg-blue-500 px-4 py-2" onPress={() => router.back()}>
        <Text className="text-center text-white">Back</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

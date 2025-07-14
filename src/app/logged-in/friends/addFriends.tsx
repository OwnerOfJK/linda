import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { useRouter } from 'expo-router';

export default function AddFriends() {
  const [phoneNumber, setPhoneNumber] = useState('');
  const router = useRouter();

  const pendingRequests = [
    { id: 1, name: 'Alice Johnson', phone: '+1234567890', status: 'sent' },
    { id: 2, name: 'Bob Wilson', phone: '+1234567891', status: 'received' },
  ];

  const handleSendRequest = () => {
    if (phoneNumber.trim()) {
      Alert.alert('Friend Request', `Request sent to ${phoneNumber}`);
      setPhoneNumber('');
    }
  };

  const handleAcceptRequest = (id: number) => {
    console.log(id);
    Alert.alert('Request Accepted', 'Friend request accepted');
  };

  const handleDeclineRequest = (id: number) => {
    console.log(id);
    Alert.alert('Request Declined', 'Friend request declined');
  };

  return (
    <ScrollView className="flex-1 bg-white p-4">
      <Text className="mb-6 text-2xl font-bold">Add Friends</Text>

      <View className="mb-6">
        <Text className="mb-3 text-lg font-semibold">Add by Phone Number</Text>
        <TextInput
          className="mb-3 rounded border border-gray-300 px-3 py-2"
          placeholder="Enter phone number"
          value={phoneNumber}
          onChangeText={setPhoneNumber}
          keyboardType="phone-pad"
        />
        <TouchableOpacity className="rounded bg-blue-500 px-4 py-2" onPress={handleSendRequest}>
          <Text className="text-center text-white">Send Request</Text>
        </TouchableOpacity>
      </View>

      <View className="mb-6">
        <Text className="mb-3 text-lg font-semibold">Pending Requests</Text>
        {pendingRequests.map((request) => (
          <View key={request.id} className="mb-2 rounded-lg bg-gray-50 p-3">
            <Text className="font-medium">{request.name}</Text>
            <Text className="mb-2 text-gray-600">{request.phone}</Text>

            {request.status === 'received' ? (
              <View className="flex-row space-x-2">
                <TouchableOpacity
                  className="flex-1 rounded bg-green-500 px-3 py-1"
                  onPress={() => handleAcceptRequest(request.id)}>
                  <Text className="text-center text-white">Accept</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  className="flex-1 rounded bg-red-500 px-3 py-1"
                  onPress={() => handleDeclineRequest(request.id)}>
                  <Text className="text-center text-white">Decline</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <Text className="italic text-gray-500">Request sent</Text>
            )}
          </View>
        ))}
      </View>

      <TouchableOpacity className="rounded bg-gray-500 px-4 py-2" onPress={() => router.back()}>
        <Text className="text-center text-white">Back</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

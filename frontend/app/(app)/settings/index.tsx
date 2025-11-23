import React, { useState } from 'react';
import { View, Text, ScrollView, TextInput, TouchableOpacity, Switch, Alert, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useUser } from '@/context/UserContext';
import { useFriends } from '@/context/FriendsContext';
import { useSession } from '@/components/ctx';
import { Button } from '@/components/ui';
import { testService } from '@/services';
import type { PrivacyLevel } from '@/types';

type Tab = 'profile' | 'privacy' | 'friends';

export default function SettingsScreen() {
  const [activeTab, setActiveTab] = useState<Tab>('profile');

  return (
    <View className="flex-1 bg-white">
      {/* Tab Buttons */}
      <View className="flex-row border-b border-gray-200 bg-white pt-12">
        <TouchableOpacity
          onPress={() => setActiveTab('profile')}
          className={`flex-1 py-4 ${activeTab === 'profile' ? 'border-b-2 border-blue-500' : ''}`}
        >
          <Text className={`text-center font-semibold ${activeTab === 'profile' ? 'text-blue-500' : 'text-gray-600'}`}>
            Profile
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => setActiveTab('privacy')}
          className={`flex-1 py-4 ${activeTab === 'privacy' ? 'border-b-2 border-blue-500' : ''}`}
        >
          <Text className={`text-center font-semibold ${activeTab === 'privacy' ? 'text-blue-500' : 'text-gray-600'}`}>
            Privacy
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => setActiveTab('friends')}
          className={`flex-1 py-4 ${activeTab === 'friends' ? 'border-b-2 border-blue-500' : ''}`}
        >
          <Text className={`text-center font-semibold ${activeTab === 'friends' ? 'text-blue-500' : 'text-gray-600'}`}>
            Friends
          </Text>
        </TouchableOpacity>
      </View>

      {/* Tab Content */}
      <View className="flex-1">
        {activeTab === 'profile' && <ProfileTab />}
        {activeTab === 'privacy' && <PrivacyTab />}
        {activeTab === 'friends' && <FriendsTab />}
      </View>
    </View>
  );
}

// Profile Tab Component
function ProfileTab() {
  const { signOut } = useSession();

  const handleSignOut = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: () => signOut(),
        },
      ]
    );
  };

  return (
    <ScrollView className="flex-1 bg-gray-50 p-6">
      <View className="bg-white rounded-lg p-6 mb-4">
        <Text className="text-sm font-semibold text-gray-700 mb-2">Name</Text>
        <View className="bg-gray-100 rounded-lg p-4 mb-4">
          <Text className="text-base text-gray-800">John Doe</Text>
        </View>

        <Text className="text-sm font-semibold text-gray-700 mb-2">Username</Text>
        <View className="bg-gray-100 rounded-lg p-4 mb-4">
          <Text className="text-base text-gray-800">@johndoe</Text>
        </View>

        <Text className="text-xs text-gray-500 italic">
          Profile information is synced from Self Protocol
        </Text>
      </View>

      <Button
        title="Sign Out"
        onPress={handleSignOut}
        variant="danger"
      />
    </ScrollView>
  );
}

// Privacy Tab Component
function PrivacyTab() {
  const { privacy_level, setPrivacyLevel } = useUser();
  const [locationEnabled, setLocationEnabled] = useState(privacy_level !== null);

  const handleToggleLocation = (value: boolean) => {
    if (!value) {
      Alert.alert(
        'Disable Location Sharing?',
        'Your friends will not be able to see your location.',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Disable',
            style: 'destructive',
            onPress: () => {
              setLocationEnabled(false);
              setPrivacyLevel('city'); // Set to city but mark as disabled
            },
          },
        ]
      );
    } else {
      setLocationEnabled(true);
      setPrivacyLevel('city');
    }
  };

  const handleSelectLevel = (level: PrivacyLevel) => {
    setPrivacyLevel(level);
  };

  return (
    <ScrollView className="flex-1 bg-gray-50 p-6">
      {/* Location Toggle */}
      <View className="bg-white rounded-lg p-4 mb-4">
        <View className="flex-row justify-between items-center">
          <View className="flex-1">
            <Text className="text-base font-semibold text-gray-900 mb-1">
              Enable Location Sharing
            </Text>
            <Text className="text-sm text-gray-600">
              When off, no friends can see your location
            </Text>
          </View>
          <Switch
            value={locationEnabled}
            onValueChange={handleToggleLocation}
            trackColor={{ false: '#d1d5db', true: '#3b82f6' }}
            thumbColor="#ffffff"
          />
        </View>
      </View>

      {/* Sharing Level */}
      {locationEnabled && (
        <View>
          <Text className="text-lg font-bold text-gray-900 mb-3">
            Sharing Level
          </Text>

          {/* City Option */}
          <TouchableOpacity
            onPress={() => handleSelectLevel('city')}
            className={`bg-white rounded-lg p-4 mb-3 flex-row items-center ${
              privacy_level === 'city' ? 'border-2 border-blue-500' : 'border border-gray-200'
            }`}
          >
            <View className="mr-4">
              <Ionicons name="business-outline" size={24} color="#3b82f6" />
            </View>
            <View className="flex-1">
              <Text className="text-base font-semibold text-gray-900 mb-1">
                City Only
              </Text>
              <Text className="text-sm text-gray-600">
                Friends see only the city you're in
              </Text>
            </View>
            {privacy_level === 'city' && (
              <Ionicons name="checkmark-circle" size={24} color="#3b82f6" />
            )}
          </TouchableOpacity>

          {/* Real-time Option */}
          <TouchableOpacity
            onPress={() => handleSelectLevel('realtime')}
            className={`bg-white rounded-lg p-4 mb-3 flex-row items-center ${
              privacy_level === 'realtime' ? 'border-2 border-blue-500' : 'border border-gray-200'
            }`}
          >
            <View className="mr-4">
              <Ionicons name="navigate-outline" size={24} color="#3b82f6" />
            </View>
            <View className="flex-1">
              <Text className="text-base font-semibold text-gray-900 mb-1">
                Real-Time
              </Text>
              <Text className="text-sm text-gray-600">
                Friends see your exact location
              </Text>
            </View>
            {privacy_level === 'realtime' && (
              <Ionicons name="checkmark-circle" size={24} color="#3b82f6" />
            )}
          </TouchableOpacity>
        </View>
      )}

      {/* Info Card */}
      <View className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-4">
        <View className="flex-row items-start mb-2">
          <Ionicons name="information-circle-outline" size={20} color="#3b82f6" />
          <Text className="text-sm font-semibold text-gray-900 ml-2">
            Privacy Information
          </Text>
        </View>
        <Text className="text-sm text-gray-700 leading-5">
          You have complete control over your location sharing. You can change your sharing level or disable sharing at any time.
        </Text>
      </View>
    </ScrollView>
  );
}

// Friends Tab Component
function FriendsTab() {
  const { friends, addFriend, removeFriend } = useFriends();
  const [showAddModal, setShowAddModal] = useState(false);
  const [username, setUsername] = useState('');

  const handleAddFriend = () => {
    if (username.trim()) {
      // Mock add friend - in real app would call API
      Alert.alert('Friend Request Sent', `Request sent to @${username}`);
      setUsername('');
      setShowAddModal(false);
    }
  };

  const handleRemoveFriend = (friendId: string, friendName: string) => {
    Alert.alert(
      'Remove Friend',
      `Remove ${friendName} from your friends?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => removeFriend(friendId),
        },
      ]
    );
  };

  const handleTestFriendMove = async (friendId: string, friendName: string) => {
    try {
      console.log('🧪 TEST: Simulating friend move...');
      const result = await testService.simulateFriendMove(friendId);
      console.log('✅ TEST: Friend moved:', result);
      Alert.alert('Test', `${friendName} moved to ${result.location.city}!`);
    } catch (error) {
      console.error('❌ TEST: Failed to simulate friend move:', error);
      Alert.alert('Error', 'Failed to simulate friend movement');
    }
  };

  return (
    <View className="flex-1 bg-gray-50">
      <ScrollView className="flex-1 p-6">
        {/* Add Friend Button */}
        <Button
          title="Add Friend"
          onPress={() => setShowAddModal(true)}
          variant="secondary"
        />

        {/* Friends List */}
        <View className="mt-6">
          <Text className="text-lg font-bold text-gray-900 mb-3">
            Your Friends ({friends.length})
          </Text>

          {friends.map((friend) => (
            <View
              key={friend.userId}
              className="bg-white rounded-lg p-4 mb-3 flex-row items-center justify-between"
            >
              <View className="flex-1">
                <Text className="text-base font-semibold text-gray-900 mb-1">
                  {friend.name || 'Unknown User'}
                </Text>
                <Text className="text-sm text-gray-600">
                  {friend.city}, {friend.country}
                </Text>
              </View>
              <View className="flex-row gap-2">
                {/* Test Move Button */}
                <TouchableOpacity
                  onPress={() => handleTestFriendMove(friend.userId, friend.name || 'User')}
                  className="p-2"
                >
                  <Ionicons name="flask" size={20} color="#10b981" />
                </TouchableOpacity>
                {/* Remove Button */}
                <TouchableOpacity
                  onPress={() => handleRemoveFriend(friend.userId, friend.name || 'User')}
                  className="p-2"
                >
                  <Ionicons name="trash-outline" size={20} color="#ef4444" />
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>

      {/* Add Friend Modal */}
      <Modal
        visible={showAddModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowAddModal(false)}
      >
        <View className="flex-1 justify-center items-center bg-black/50 p-6">
          <View className="bg-white rounded-lg p-6 w-full max-w-sm">
            <Text className="text-xl font-bold text-gray-900 mb-4 text-center">
              Add Friend
            </Text>

            <TextInput
              value={username}
              onChangeText={setUsername}
              placeholder="Enter username"
              className="bg-gray-100 rounded-lg p-4 mb-4 text-base"
              autoCapitalize="none"
            />

            <View className="flex-row gap-2">
              <View className="flex-1">
                <Button
                  title="Cancel"
                  onPress={() => setShowAddModal(false)}
                  variant="secondary"
                />
              </View>
              <View className="flex-1">
                <Button
                  title="Add"
                  onPress={handleAddFriend}
                />
              </View>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

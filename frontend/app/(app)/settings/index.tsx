import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TextInput, TouchableOpacity, Switch, Alert, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
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
  const { userId } = useUser();
  const [userName, setUserName] = useState<string>('Loading...');
  const [userNationality, setUserNationality] = useState<string | null>(null);

  // Fetch user profile from backend
  useEffect(() => {
    async function fetchUserProfile() {
      if (!userId) return;

      try {
        const { userService } = await import('@/services');
        const profile = await userService.getProfile(userId);
        setUserName(profile.name || 'Unknown');
        setUserNationality(profile.nationality || null);
      } catch (error) {
        console.error('Failed to fetch user profile:', error);
        setUserName('Error loading name');
      }
    }

    fetchUserProfile();
  }, [userId]);

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

  const handleCopyUserId = async () => {
    if (userId) {
      try {
        await Clipboard.setStringAsync(userId);
        Alert.alert('Copied!', 'User ID copied to clipboard');
      } catch (error) {
        console.error('Failed to copy to clipboard:', error);
        Alert.alert('Error', 'Failed to copy User ID');
      }
    }
  };

  return (
    <ScrollView className="flex-1 bg-gray-50 p-6">
      <View className="bg-white rounded-lg p-6 mb-4">
        <Text className="text-sm font-semibold text-gray-700 mb-2">User ID</Text>
        <TouchableOpacity
          onPress={handleCopyUserId}
          className="bg-gray-100 rounded-lg p-4 mb-2 flex-row items-center justify-between"
        >
          <Text className="text-base text-gray-800 flex-1" numberOfLines={1}>
            {userId || 'Not logged in'}
          </Text>
          <Ionicons name="copy-outline" size={20} color="#6B7280" />
        </TouchableOpacity>
        <Text className="text-xs text-gray-500 mb-4">
          Share this ID with friends so they can add you
        </Text>

        <Text className="text-sm font-semibold text-gray-700 mb-2">Name</Text>
        <View className="bg-gray-100 rounded-lg p-4 mb-4">
          <Text className="text-base text-gray-800">{userName}</Text>
        </View>

        {userNationality && (
          <>
            <Text className="text-sm font-semibold text-gray-700 mb-2">Nationality</Text>
            <View className="bg-gray-100 rounded-lg p-4 mb-4">
              <Text className="text-base text-gray-800">{userNationality}</Text>
            </View>
          </>
        )}

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
  const [locationEnabled, setLocationEnabled] = useState(
    privacy_level !== null && privacy_level !== 'none'
  );

  const handleToggleLocation = async (value: boolean) => {
    if (!value) {
      Alert.alert(
        'Disable Location Sharing?',
        'Your friends will not be able to see your location.',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Disable',
            style: 'destructive',
            onPress: async () => {
              setLocationEnabled(false);
              await setPrivacyLevel('none'); // Disable location sharing completely
            },
          },
        ]
      );
    } else {
      setLocationEnabled(true);
      await setPrivacyLevel('city');
    }
  };

  const handleSelectLevel = async (level: PrivacyLevel) => {
    try {
      await setPrivacyLevel(level);
    } catch (error) {
      console.error('Failed to update privacy level:', error);
      Alert.alert('Error', 'Failed to update privacy level. Please try again.');
    }
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
  const { friends, refreshFriends } = useFriends();
  const { userId } = useUser();
  const [showAddModal, setShowAddModal] = useState(false);
  const [friendUserId, setFriendUserId] = useState('');

  const handleAddFriend = async () => {
    if (!friendUserId.trim()) {
      Alert.alert('Error', 'Please enter a User ID');
      return;
    }

    if (!userId) {
      Alert.alert('Error', 'Not logged in');
      return;
    }

    try {
      console.log('➕ Adding friend:', friendUserId);

      // Call backend API to add friend (bidirectional)
      const { userService } = await import('@/services');
      await userService.addFriend(userId, friendUserId.trim());

      console.log('✅ Friend added successfully');
      Alert.alert('Success', `Friend added successfully!`);

      // Refresh friends list from backend
      await refreshFriends();

      setFriendUserId('');
      setShowAddModal(false);
    } catch (error: any) {
      console.error('❌ Failed to add friend:', error);

      // Parse error message
      const errorMessage = error?.message || 'Failed to add friend';
      if (errorMessage.includes('404') || errorMessage.includes('not found')) {
        Alert.alert('Error', `User not found. Please check the User ID.`);
      } else if (errorMessage.includes('Cannot add yourself')) {
        Alert.alert('Error', 'Cannot add yourself as a friend');
      } else if (errorMessage.includes('already exists') || errorMessage.includes('duplicate')) {
        Alert.alert('Error', 'This user is already your friend');
      } else {
        Alert.alert('Error', 'Failed to add friend. Please try again.');
      }
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
          onPress: async () => {
            if (!userId) return;

            try {
              console.log('➖ Removing friend:', friendId);

              // Call backend API to remove friend (bidirectional)
              const { userService } = await import('@/services');
              await userService.removeFriend(userId, friendId);

              console.log('✅ Friend removed successfully');

              // Refresh friends list from backend
              await refreshFriends();

              Alert.alert('Success', `${friendName} removed from friends`);
            } catch (error) {
              console.error('❌ Failed to remove friend:', error);
              Alert.alert('Error', 'Failed to remove friend. Please try again.');
            }
          },
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

  const handleStartSimulation = async () => {
    if (!userId) {
      Alert.alert('Error', 'Not logged in');
      return;
    }

    Alert.alert(
      'Start Friend Simulation',
      'This will create 30 mock friends that update their locations every 5 seconds. Perfect for testing!',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Start',
          onPress: async () => {
            try {
              console.log('🧪 Starting friend simulation...');
              const result = await testService.startFriendSimulation(userId);
              console.log('✅ Simulation started:', result);

              // Refresh friends list after a short delay
              setTimeout(async () => {
                await refreshFriends();
              }, 2000);

              Alert.alert(
                'Simulation Started!',
                '30 mock friends are now moving around the world. Check the map to see them!',
                [{ text: 'OK' }]
              );
            } catch (error) {
              console.error('❌ Failed to start simulation:', error);
              Alert.alert('Error', 'Failed to start friend simulation. Please try again.');
            }
          },
        },
      ]
    );
  };

  return (
    <View className="flex-1 bg-gray-50">
      <ScrollView className="flex-1 p-6">
        {/* Action Buttons */}
        <View className="flex-row gap-2 mb-4">
          <View className="flex-1">
            <Button
              title="Add Friend"
              onPress={() => setShowAddModal(true)}
              variant="secondary"
            />
          </View>
          <View className="flex-1">
            <Button
              title="🧪 Demo Mode"
              onPress={handleStartSimulation}
              variant="primary"
            />
          </View>
        </View>

        {/* Friends List */}
        <View className="mt-2">
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
              value={friendUserId}
              onChangeText={setFriendUserId}
              placeholder="Enter friend's User ID"
              className="bg-gray-100 rounded-lg p-4 mb-4 text-base"
              autoCapitalize="none"
            />
            <Text className="text-xs text-gray-500 mb-4 -mt-2">
              Ask your friend for their User ID from Settings → Profile
            </Text>

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

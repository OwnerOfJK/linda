import { useEffect } from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import { useLocalSearchParams } from 'expo-router';

import { useSession } from '@/components/ctx';

export default function AuthCallback() {
  const { signIn } = useSession();
  const params = useLocalSearchParams();

  useEffect(() => {
    // Handle the callback from Self app
    console.log('Auth callback received with params:', params);

    // For now, simply sign the user in
    // TODO: Verify the authentication response from Self
    signIn();

    // The guard in RootNavigator will automatically redirect to the app
  }, [params, signIn]);

  return (
    <View className="flex-1 justify-center items-center bg-white">
      <ActivityIndicator size="large" color="#2563eb" />
      <Text className="mt-4 text-gray-700">Completing authentication...</Text>
    </View>
  );
}

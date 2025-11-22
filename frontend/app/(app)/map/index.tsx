/**
 * Dev Tools Screen
 * Quick development utilities - remove in production
 */

import { View, Text } from 'react-native';
import { useSession } from '@/components/ctx';
import { Button } from '@/components/ui';
import { useRouter } from 'expo-router';

export default function Map() {
  const { signOut } = useSession();
  const router = useRouter();

  const handleClearSession = () => {
    signOut();
    router.replace('/sign-in');
  };

  return (
    <View className="flex-1 justify-center items-center p-6 bg-white">
      <Text className="text-2xl font-bold mb-8 text-gray-900">Dev Tools</Text>

      <Button
        title="Clear Session & Sign Out"
        onPress={handleClearSession}
        variant="danger"
        className="mb-4"
      />

      <Text className="text-xs text-gray-500 mt-8 text-center">
        This screen should be removed in production
      </Text>
    </View>
  );
}

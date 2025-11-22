import { Text, View, TouchableOpacity } from 'react-native';

import { useSession } from '@/components/ctx';

export default function Index() {
  const { signOut } = useSession();
  return (
    <View className="flex-1 justify-center items-center bg-white p-6">
      <Text className="text-2xl font-bold mb-4 text-gray-900">
        Welcome!
      </Text>
      <Text className="text-base text-gray-600 mb-8 text-center">
        You are successfully authenticated with Self Protocol
      </Text>

      <TouchableOpacity
        onPress={() => {
          // The guard in `RootNavigator` redirects back to the sign-in screen.
          signOut();
        }}
        className="bg-red-500 py-3 px-8 rounded-lg">
        <Text className="text-white text-base font-semibold">
          Sign Out
        </Text>
      </TouchableOpacity>
    </View>
  );
}

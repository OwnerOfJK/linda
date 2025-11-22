import { Text, View } from 'react-native';

import { useSession } from '@/components/ctx';

export default function SignIn() {
  const { signIn } = useSession();
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <Text
        onPress={() => {
          // The guard in RootNavigator will automatically redirect when session is set
          signIn();
        }}>
        Sign In
      </Text>
    </View>
  );
}

import { useEffect } from 'react';
import { useLocalSearchParams } from 'expo-router';
import { useSession } from '@/components/ctx';
import { LoadingSpinner } from '@/components/ui';

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

  return <LoadingSpinner message="Completing authentication..." />;
}

import { useEffect, useState } from 'react';
import { useLocalSearchParams } from 'expo-router';
import { Alert } from 'react-native';
import { useSession } from '@/components/ctx';
import { LoadingSpinner } from '@/components/ui';
import { authService } from '@/services';
import { getStorageItemAsync } from '@/hooks/useStorageState';

export default function AuthCallback() {
  const { signIn } = useSession();
  const params = useLocalSearchParams();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function handleAuthCallback() {
      try {
        // Handle the callback from Self app
        console.log('Auth callback received with params:', params);

        // TODO: Parse and verify Self Protocol response from params
        // For now, extract user data from params (adjust based on actual Self response format)
        const name = params.name as string;
        const nationality = params.nationality as string;
        const gender = params.gender as string;

        // Get userId from storage
        const userId = await getStorageItemAsync('userId');
        if (!userId) {
          throw new Error('User ID not found in storage');
        }

        console.log('🔐 Registering user with Self Protocol data...');

        // Register user in backend with Self Protocol data
        await authService.registerUser({
          userId,
          name: name || 'Unknown',
          nationality: nationality || undefined,
          gender: gender || undefined,
          // TODO: Add actionNullifier from Self Protocol response
        });

        console.log('✅ User registered successfully');

        // Sign in locally
        signIn();

        // The guard in RootNavigator will automatically redirect to the app
      } catch (error: any) {
        // If user already exists, that's okay - just sign in
        if (error?.message?.includes('already exists')) {
          console.log('ℹ️ User already registered, signing in...');
          signIn();
        } else {
          console.error('❌ Auth callback error:', error);
          setError(error?.message || 'Authentication failed');
          Alert.alert('Authentication Error', error?.message || 'Failed to complete authentication');
        }
      }
    }

    handleAuthCallback();
  }, [params, signIn]);

  if (error) {
    return (
      <LoadingSpinner
        message={`Error: ${error}`}
        bgColor="bg-red-50"
      />
    );
  }

  return <LoadingSpinner message="Completing authentication..." />;
}

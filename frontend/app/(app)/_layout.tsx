import { Stack } from 'expo-router';
import { UserProvider } from '@/context/UserContext';

export default function AppLayout() {
  // This renders the navigation stack for all authenticated app routes.
  return (
    <UserProvider>
      <Stack />
    </UserProvider>
  );
}

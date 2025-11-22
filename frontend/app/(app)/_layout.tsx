import { Stack } from 'expo-router';
import { UserProvider } from '@/context/UserContext';
import { FriendsProvider } from '@/context/FriendsContext';

export default function AppLayout() {
  // This renders the navigation stack for all authenticated app routes.
  return (
    <UserProvider>
      <FriendsProvider>
        <Stack />
      </FriendsProvider>
    </UserProvider>
  );
}

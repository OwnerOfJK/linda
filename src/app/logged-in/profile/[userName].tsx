import { useLocalSearchParams } from 'expo-router';
import { View, Text, Button } from 'react-native';
import React from 'react';
import { useRouter } from 'expo-router';

export default function Users() {
  const router = useRouter();
  const { userName } = useLocalSearchParams();

  return (
    <View>
      <Text>User Name: {userName}</Text>
      <Button title="Go Back" onPress={() => router.navigate('/logged-in')} />
    </View>
  );
}

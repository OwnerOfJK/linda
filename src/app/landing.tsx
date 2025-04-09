import { Text, View, Button } from 'react-native';
import { useRouter } from 'expo-router';
import React from 'react';

const LandingPage = () => {
  const router = useRouter();
  return (
    <View>
      <Text>Welcome to Linda</Text>
      <Button title="Login here" onPress={() => router.navigate('/login')} />
    </View>
  );
};

export default LandingPage;

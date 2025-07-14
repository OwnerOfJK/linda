import { Redirect, Slot } from 'expo-router';
import React from 'react';
import { View } from 'react-native';
import Header from '~/components/header';
import Footer from '~/components/footer';

export default function AuthLayout() {
  const isAuthenticated = true; // Replace with your authentication logic

  if (!isAuthenticated) {
    return <Redirect href="/login/login" />;
  }

  return (
    <View className="flex-1">
      <Header />
      <View className="flex-1">
        <Slot />
      </View>
      <Footer />
    </View>
  );
}

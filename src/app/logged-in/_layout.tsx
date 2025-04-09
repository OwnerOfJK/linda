import { Redirect, Slot } from 'expo-router';
import React from 'react';
import Header from 'components/header';
import Footer from 'components/footer';

export default function AuthLayout() {
  const isAuthenticated = true; // Replace with your authentication logic

  if (!isAuthenticated) {
    return <Redirect href="/login" />;
  }

  return (
    <>
      <Header />
      <Slot />
      <Footer />
    </>
  );
}

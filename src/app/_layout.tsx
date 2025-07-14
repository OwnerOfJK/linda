/* eslint @typescript-eslint/no-require-imports: "off" */

import './global.css';
import * as Sentry from '@sentry/react-native';
import { Stack } from 'expo-router';
import React from 'react';
// import { useFonts } from 'expo-font';
// import * as SplashScreen from 'expo-splash-screen';
// import { useEffect } from 'react';

Sentry.init({
  dsn: 'https://7bd189bad5d479ab9e6b74c6d8cc0647@o4509108953939968.ingest.de.sentry.io/4509108958789712',

  // uncomment the line below to enable Spotlight (https://spotlightjs.com)
  // spotlight: __DEV__,
});

// SplashScreen.preventAutoHideAsync();

export default Sentry.wrap(function RootLayout() {
  // const [loaded] = useFonts({
  //   SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  // });

  // useEffect(() => {
  //   if (loaded) {
  //     SplashScreen.hideAsync();
  //   }
  // }, [loaded]);

  // if (!loaded) {
  //   return null;
  // }

  return <Stack />;
});

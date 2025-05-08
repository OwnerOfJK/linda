const IS_DEV = process.env.APP_VARIANT === 'development';
const IS_PREVIEW = process.env.APP_VARIANT === 'preview';

const getUniqueIdentifier = () => {
  if (IS_DEV) return 'com.jhk.linda.dev';
  if (IS_PREVIEW) return 'com.jhk.linda.preview';
  return 'com.jhk.linda';
};

const getAppName = () => {
  if (IS_DEV) return 'Linda (Dev)';
  if (IS_PREVIEW) return 'Linda (Preview)';
  return 'Linda: Connected, Globally';
};

export default ({ config }) => ({
  ...config,
  name: getAppName(),
  slug: 'linda',
  owner: 'jhk',
  scheme: 'linda', //This is for linda://[page]
  ios: {
    ...config.ios,
    bundleIdentifier: getUniqueIdentifier(),
    supportsTablet: true,
    infoPlist: {
      ITSAppUsesNonExemptEncryption: false,
    },
  },
  android: {
    ...config.android,
    package: getUniqueIdentifier(),
    adaptiveIcon: {
      foregroundImage: 'src/assets/adaptive-icon.png',
      backgroundColor: '#ffffff',
    },
    config: {
      googleMapsApiKey: process.env.GOOGLE_MAPS_API_KEY,
    },
  },
  updates: {
    fallbackToCacheTimeout: 0,
    url: 'https://u.expo.dev/37f14e48-435e-424c-88b1-49d98296941e',
  },
  extra: {
    eas: {
      projectId: '37f14e48-435e-424c-88b1-49d98296941e',
    },
  },
  userInterfaceStyle: 'automatic',
  plugins: [
    [
      '@sentry/react-native/expo',
      {
        url: 'https://sentry.io/',
        project: 'react-native',
        organization: 'linda-0a',
      },
    ],
    ['expo-router'],
    [
      'expo-font',
      {
        fonts: ['assets/fonts/SpaceMono-Regular.ttf'],
      },
    ],
    ['expo-maps'],
  ],
  assetBundlePatterns: ['**/*'],
  orientation: 'portrait',
  newArchEnabled: true,
  icon: 'src/assets/icon.png',
  web: {
    favicon: 'src/assets/favicon.png',
    bundler: 'metro',
  },
});

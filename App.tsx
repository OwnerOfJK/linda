import { ScreenContent } from 'components/ScreenContent';
import { StatusBar } from 'expo-status-bar';

import './src/global.css';
import * as Sentry from '@sentry/react-native';

Sentry.init({
  dsn: 'https://7bd189bad5d479ab9e6b74c6d8cc0647@o4509108953939968.ingest.de.sentry.io/4509108958789712',

  // uncomment the line below to enable Spotlight (https://spotlightjs.com)
  // spotlight: __DEV__,
});

export default Sentry.wrap(function App() {
  return (
    <>
      <ScreenContent title="Home" path="App.tsx" />
      <StatusBar style="auto" />
    </>
  );
});

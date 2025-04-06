import { Text, View, Button } from 'react-native';
import * as Sentry from "@sentry/react-native";

export const EditScreenInfo = ({ path }: { path: string }): JSX.Element => {
  const title = 'Open up the code for this screen:';
  const description = 'First few changes.';

  return (
    <View>
      <View className={styles.getStartedContainer}>
        <Text className={styles.getStartedText}>{title}</Text>
        <Button title='Try!' onPress={ () => { Sentry.captureException(new Error('First error')) }}/>
        <View className={styles.codeHighlightContainer + styles.homeScreenFilename}>
          <Text>{path}</Text>
        </View>
        <Text className={styles.getStartedText}>{description}</Text>
      </View>
    </View>
  );
};

const styles = {
  codeHighlightContainer: `rounded-md px-1`,
  getStartedContainer: `items-center mx-12`,
  getStartedText: `text-lg leading-6 text-center`,
  helpContainer: `items-center mx-5 mt-4`,
  helpLink: `py-4`,
  helpLinkText: `text-center`,
  homeScreenFilename: `my-2`,
};

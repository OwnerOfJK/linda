import React from 'react';
import { PropsWithChildren } from 'react';
import { Text, View } from 'react-native';

export const CustomText = ({ children }: PropsWithChildren) => <Text>{children}</Text>;

export default function HomeScreen() {
  return (
    <View className="flex-1 items-center justify-center bg-black">
      <CustomText>Welcome!</CustomText>
    </View>
  );
}

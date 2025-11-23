import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

/**
 * Configure notification behavior
 */
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

/**
 * Request notification permissions
 */
export const requestNotificationPermissions = async (): Promise<boolean> => {
  try {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.warn('⚠️ Notification permissions not granted');
      return false;
    }

    // Configure notification channel for Android
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('proximity', {
        name: 'Friend Proximity Alerts',
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
        sound: 'default',
      });
    }

    console.log('✅ Notification permissions granted');
    return true;
  } catch (error) {
    console.error('❌ Failed to request notification permissions:', error);
    return false;
  }
};

/**
 * Send proximity notification when friends are nearby
 */
export const sendProximityNotification = async (
  friendName: string,
  distance: number
): Promise<void> => {
  try {
    const distanceText = distance < 1
      ? `${Math.round(distance * 1000)}m`
      : `${distance.toFixed(1)}km`;

    await Notifications.scheduleNotificationAsync({
      content: {
        title: `${friendName} is nearby!`,
        body: `${friendName} is ${distanceText} away from you`,
        sound: 'default',
        data: { friendName, distance },
      },
      trigger: null, // Show immediately
    });

    console.log(`📬 Proximity notification sent for ${friendName} (${distanceText})`);
  } catch (error) {
    console.error('❌ Failed to send proximity notification:', error);
  }
};

export const notificationService = {
  requestPermissions: requestNotificationPermissions,
  sendProximity: sendProximityNotification,
};

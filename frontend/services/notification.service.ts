import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';

/**
 * Configure notification behavior
 */
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

/**
 * Request notification permissions
 */
export const requestNotificationPermissions = async (): Promise<boolean> => {
  try {
    // iOS Simulator doesn't support notifications
    if (Platform.OS === 'ios' && !Device.isDevice) {
      console.warn('⚠️ Notifications are not supported on iOS Simulator. Please test on a physical device.');
      return false;
    }

    console.log('🔔 Requesting notification permissions...');
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    console.log('📋 Current notification status:', existingStatus);

    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      console.log('🙋 Prompting user for notification permissions...');
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
      console.log('📋 User response:', status);
    }

    if (finalStatus !== 'granted') {
      console.warn('⚠️ Notification permissions not granted. Status:', finalStatus);
      return false;
    }

    // Configure notification channel for Android
    if (Platform.OS === 'android') {
      console.log('📱 Configuring Android notification channel...');
      await Notifications.setNotificationChannelAsync('proximity', {
        name: 'Friend Proximity Alerts',
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
        sound: 'default',
        lightColor: '#3B82F6',
        enableLights: true,
        enableVibrate: true,
        showBadge: true,
      });
      console.log('✅ Android notification channel configured');
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

    const notificationContent: any = {
      title: `${friendName} is nearby!`,
      body: `${friendName} is ${distanceText} away from you`,
      sound: 'default',
      data: { friendName, distance },
      priority: Notifications.AndroidNotificationPriority.HIGH,
    };

    // Add Android-specific channel
    if (Platform.OS === 'android') {
      notificationContent.channelId = 'proximity';
    }

    await Notifications.scheduleNotificationAsync({
      content: notificationContent as Notifications.NotificationContentInput,
      trigger: null, // Show immediately
    });

    console.log(`📬 Proximity notification sent for ${friendName} (${distanceText})`);
  } catch (error) {
    console.error('❌ Failed to send proximity notification:', error);
  }
};

/**
 * Check current notification permission status
 */
export const getNotificationPermissionStatus = async (): Promise<'granted' | 'denied' | 'undetermined'> => {
  try {
    const { status } = await Notifications.getPermissionsAsync();
    return status;
  } catch (error) {
    console.error('❌ Failed to check notification permissions:', error);
    return 'undetermined';
  }
};

export const notificationService = {
  requestPermissions: requestNotificationPermissions,
  sendProximity: sendProximityNotification,
  getPermissionStatus: getNotificationPermissionStatus,
};

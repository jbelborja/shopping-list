import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { doc, updateDoc, setDoc, arrayUnion } from 'firebase/firestore';
import { db } from './firebase';

// Configure foreground notification presentation (banners, sound)
if (Platform.OS !== 'web') {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });
}

/**
 * Registers device for Expo Push Notifications and persists token to user doc in Firestore
 */
export async function registerForPushNotificationsAsync(userId: string): Promise<string | null> {
  if (Platform.OS === 'web') {
    return null;
  }

  if (!Device.isDevice) {
    console.log('Push notifications require a physical device');
    return null;
  }

  try {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.log('Permission not granted for push notifications');
      return null;
    }

    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#6366F1',
      });
    }

    const projectId =
      Constants?.expoConfig?.extra?.eas?.projectId ??
      Constants?.easConfig?.projectId;

    const tokenResponse = await Notifications.getExpoPushTokenAsync(
      projectId ? { projectId } : undefined
    );
    const pushToken = tokenResponse.data;

    if (pushToken && userId) {
      const userRef = doc(db, 'users', userId);
      try {
        await updateDoc(userRef, {
          pushTokens: arrayUnion(pushToken),
        });
      } catch {
        await setDoc(userRef, { pushTokens: arrayUnion(pushToken) }, { merge: true });
      }
    }

    return pushToken;
  } catch (error) {
    console.warn('Error registering for push notifications:', error);
    return null;
  }
}

/**
 * Sends push notifications using Expo's push service
 */
export async function sendExpoPushNotifications(
  tokens: string[],
  title: string,
  body: string,
  data?: Record<string, any>
): Promise<void> {
  if (!tokens || tokens.length === 0) return;

  const validTokens = Array.from(
    new Set(
      tokens.filter(
        (t) =>
          typeof t === 'string' &&
          (t.startsWith('ExponentPushToken[') || t.startsWith('ExpoPushToken['))
      )
    )
  );

  if (validTokens.length === 0) return;

  const messages = validTokens.map((token) => ({
    to: token,
    sound: 'default',
    title,
    body,
    data: data || {},
  }));

  try {
    const response = await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Accept-Encoding': 'gzip, deflate',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(messages),
    });

    if (!response.ok) {
      console.warn('Expo push service responded with status', response.status);
    }
  } catch (error) {
    console.warn('Failed to send push notification via Expo:', error);
  }
}

/**
 * Listens for user interactions on push notifications to support deep linking
 */
export function setupNotificationResponseListener(
  onNotificationResponse: (url: string) => void
): () => void {
  if (Platform.OS === 'web') {
    return () => {};
  }

  // Handle cold-start launch via notification
  Notifications.getLastNotificationResponseAsync().then((response) => {
    const url = response?.notification?.request?.content?.data?.url;
    if (typeof url === 'string') {
      onNotificationResponse(url);
    }
  });

  // Handle tap while app is backgrounded/running
  const subscription = Notifications.addNotificationResponseReceivedListener((response) => {
    const url = response?.notification?.request?.content?.data?.url;
    if (typeof url === 'string') {
      onNotificationResponse(url);
    }
  });

  return () => {
    subscription.remove();
  };
}

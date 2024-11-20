import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import { database } from './database';
import { router } from 'expo-router';

const PROJECT_ID = "d4e19ef7-5743-47ad-b0c1-8c4169df23c9";

async function registerForPushNotificationsAsync() {
  let token;

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
    });
  }

  if (Device.isDevice) {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    if (finalStatus !== 'granted') {
      alert('Απαιτείται άδεια για τις ειδοποιήσεις!');
      return;
    }
    token = (await Notifications.getExpoPushTokenAsync()).data;
  } else {
    alert('Πρέπει να χρησιμοποιείτε πραγματική συσκευή για τις ειδοποιήσεις');
  }

  return token;
}

export async function setupNotifications() {
  // Ζητάμε άδεια για notifications
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;
  
  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }
  
  if (finalStatus !== 'granted') {
    return false;
  }

  // Ρυθμίζουμε πώς θα εμφανίζονται τα notifications
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
    }),
  });

  return true;
}

export async function scheduleEventNotification(event: any) {
  await Notifications.scheduleNotificationAsync({
    content: {
      title: 'Νέο Event',
      body: event.details,
      data: { eventId: event.id },
    },
    trigger: null, // άμεση αποστολή
  });
}

export async function scheduleExpiredEventsNotification() {
  try {
    // Ακύρωση προηγούμενων ειδοποιήσεων με το ίδιο identifier
    await Notifications.cancelScheduledNotificationAsync('daily-expired-events');

    // Ορισμός του trigger για 12:00 καθημερινά
    const trigger = {
      hour: 12,
      minute: 0,
      repeats: true,
    };

    // Προγραμματισμός της ειδοποίησης
    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Εκκρεμείς Ενέργειες',
        body: 'Υπάρχουν events που χρειάζονται την προσοχή σας',
        data: { screen: 'reports' },
      },
      trigger,
      identifier: 'daily-expired-events',
    });
  } catch (error) {
    console.error('Error scheduling notification:', error);
  }
}

// Test function - απλοποιημένη έκδοση για τοπικές ειδοποιήσεις
export async function testExpiredEventsNotification() {
  try {
    console.log('Starting notification test...');

    // Ρύθμιση για Android
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF231F7C',
      });
    }

    // Προγραμματισμός ειδοποίησης
    const notificationId = await Notifications.scheduleNotificationAsync({
      content: {
        title: '🔔 Δοκιμαστική Ειδοποίηση',
        body: 'Εάν βλέπετε αυτό το μήνυμα, οι ειδοποιήσεις λειτουργούν!',
        sound: true,
        priority: 'high',
        vibrate: [0, 250, 250, 250],
      },
      trigger: {
        seconds: 5,
      },
    });

    console.log('Notification scheduled with ID:', notificationId);
    alert('Η ειδοποίηση θα εμφανιστεί σε 5 δευτερόλεπτα');

  } catch (error) {
    console.error('Error:', error);
    alert('Σφάλμα: ' + error.message);
  }
}

// Χειρισμός του tap στην ειδοποίηση
Notifications.addNotificationResponseReceivedListener((response) => {
  const screen = response.notification.request.content.data?.screen;
  if (screen === 'reports') {
    router.push('/(tabs)/reports');
  }
});
 
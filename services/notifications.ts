import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform, Alert } from 'react-native';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

const PROJECT_ID = "d4e19ef7-5743-47ad-b0c1-8c4169df23c9";

// Interface για τα events
interface Event {
  id: string;
  type: string;
  startDate: string;
  endDate: string;
  completed: boolean;
  title: string;
  details?: string;
}

// Interface για το database service
interface DatabaseService {
  getExpiredEvents(): Promise<Event[]>;
  getUpcomingEvents(): Promise<Event[]>;
}

let databaseInstance: DatabaseService | null = null;

// Βοηθητικές συναρτήσεις για τις ειδοποιήσεις
function getNotificationTitle(event: any): string {
  const typeEmojis: { [key: string]: string } = {
    breeding: '🐁',
    expected_pregnancy: '🤰',
    weaning: '👶',
    maintenance: '🔧',
    medical: '💊',
    general: '📝'
  };

  const emoji = typeEmojis[event.type] || '🔔';
  return `${emoji} ${getTitleByType(event.type)}`;
}

function getTitleByType(type: string): string {
  switch (type) {
    case 'breeding':
      return 'Υπενθύμιση Ζευγαρώματος';
    case 'expected_pregnancy':
      return 'Αναμενόμενη Γέννα';
    case 'weaning':
      return 'Υπενθύμιση Απογαλακτισμού';
    case 'maintenance':
      return 'Εργασία Συντήρησης';
    case 'medical':
      return 'Ιατρική Εργασία';
    default:
      return 'Γενική Υπενθύμιση';
  }
}

function getNotificationBody(event: any): string {
  let baseMessage = '';
  
  switch (event.type) {
    case 'breeding':
      baseMessage = 'Ώρα για ζευγάρωμα';
      break;
    case 'expected_pregnancy':
      baseMessage = 'Πιθανή ημερομηνία γέννας';
      break;
    case 'weaning':
      baseMessage = 'Ώρα για απογαλακτισμό';
      break;
    case 'maintenance':
      baseMessage = 'Προγραμματισμένη συντήρηση';
      break;
    case 'medical':
      baseMessage = 'Ιατρική εργασία';
      break;
    default:
      baseMessage = 'Γενική υπενθύμιση';
  }

  return event.details ? `${baseMessage}: ${event.details}` : baseMessage;
}

export function initializeNotifications(dbService: DatabaseService) {
  databaseInstance = dbService;
}

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
      Alert.alert('Failed to get push token for push notification!');
      return;
    }
    token = (await Notifications.getExpoPushTokenAsync({ projectId: PROJECT_ID })).data;
  } else {
    Alert.alert('Must use physical device for Push Notifications');
  }

  return token;
}


export async function setupDailyNotifications() {
  try {
    // Ακύρωση όλων των προηγούμενων ειδοποιήσεων
    await Notifications.cancelAllScheduledNotificationsAsync();

    // Φόρτωση της αποθηκευμένης ώρας ειδοποιήσεων
    const savedTimeStr = await AsyncStorage.getItem('notificationTime');
    const lastNotificationTimeStr = await AsyncStorage.getItem('lastNotificationTime');
    let notificationTime: Date;
    
    if (savedTimeStr) {
      notificationTime = new Date(savedTimeStr);
    } else {
      // Αν δεν έχει οριστεί ώρα, ορίζουμε 10:00 πμ
      notificationTime = new Date();
      notificationTime.setHours(10, 0, 0, 0);
    }

    const now = new Date();
    const scheduledTime = new Date();
    scheduledTime.setHours(notificationTime.getHours(), notificationTime.getMinutes(), 0, 0);

    // Έλεγχος αν έχουμε ήδη στείλει ειδοποίηση σήμερα σε προηγούμενη ώρα
    let hasNotifiedEarlierToday = false;
    if (lastNotificationTimeStr) {
      const lastNotificationTime = new Date(lastNotificationTimeStr);
      const isToday = lastNotificationTime.toDateString() === now.toDateString();
      if (isToday && lastNotificationTime < scheduledTime) {
        // Έχουμε στείλει ειδοποίηση σήμερα, αλλά η νέα ώρα είναι μεταγενέστερη
        hasNotifiedEarlierToday = true;
      }
    }

    // Αν η ώρα έχει περάσει για σήμερα, προγραμμάτισε για αύριο
    const nextNotificationDate = new Date(scheduledTime);
    if (scheduledTime < now) {
      nextNotificationDate.setDate(nextNotificationDate.getDate() + 1);
    }

    console.log('Επόμενη προγραμματισμένη ειδοποίηση:', 
      `${nextNotificationDate.toLocaleDateString()} στις ${notificationTime.getHours()}:${String(notificationTime.getMinutes()).padStart(2, '0')}`);

    // Ρύθμιση των ειδοποιήσεων
    const scheduleNotification = async (title: string, body: string, minutesOffset: number = 0) => {
      const notificationTrigger = {
        hour: notificationTime.getHours(),
        minute: notificationTime.getMinutes() + minutesOffset,
        repeats: true
      };

      // Στείλε άμεση ειδοποίηση αν:
      // 1. Η ώρα δεν έχει περάσει για σήμερα ΚΑΙ
      // 2. Είτε δεν έχουμε στείλει ειδοποίηση σήμερα, είτε η νέα ώρα είναι μεταγενέστερη
      if (scheduledTime > now && (hasNotifiedEarlierToday || !lastNotificationTimeStr)) {
        await Notifications.scheduleNotificationAsync({
          content: { title, body, data: { screen: 'reports' } },
          trigger: { seconds: 1 }
        });
        // Αποθήκευσε την ώρα που στείλαμε την ειδοποίηση
        await AsyncStorage.setItem('lastNotificationTime', now.toISOString());
      }

      // Προγραμμάτισε την καθημερινή ειδοποίηση
      await Notifications.scheduleNotificationAsync({
        content: { title, body, data: { screen: 'reports' } },
        trigger: notificationTrigger
      });
    };

    if (!databaseInstance) {
      throw new Error('Database service not initialized');
    }

    const expiredEvents = await databaseInstance.getExpiredEvents();
    if (expiredEvents.length > 0) {
      const expiredBody = `Έχετε ${expiredEvents.length} εκκρεμείς εργασίες που χρειάζονται την προσοχή σας.\n\n` +
        expiredEvents.map(event => {
          const type = getNotificationTitle(event);
          const date = event.endDate?.split('T')[0];
          const title = event.title || '';
          return `- ${type}: ${title} (${date})\n`;
        }).join('');

      await scheduleNotification('⚠️ Εκκρεμείς Εργασίες', expiredBody);
    }

    // Ημερήσια υπενθύμιση
    await scheduleNotification(
      '🐁 Καλημέρα από το Mouse Lab!',
      'Μην ξεχάσεις να ελέγξεις τις εργασίες σου για σήμερα.',
      1
    );

  } catch (error) {
    console.error('Error setting up daily notifications:', error);
  }
}

export async function scheduleUpcomingEventsNotification(scheduledTime?: Date) {
  try {
    if (!databaseInstance) {
      throw new Error('Database service not initialized');
    }

    const upcomingEvents = await databaseInstance.getUpcomingEvents();
    if (upcomingEvents.length > 0) {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: '📅 Επερχόμενες Εργασίες',
          body: `Έχετε ${upcomingEvents.length} εργασίες προγραμματισμένες για τις επόμενες 7 μέρες.\n\n` +
                upcomingEvents.map(event => {
                  const type = getNotificationTitle(event);
                  const date = event.endDate?.split('T')[0];
                  const title = event.title || '';
                  return `- ${type}: ${title} (${date})\n`;
                }).join(''),
          data: { screen: 'reports' }
        },
        trigger: scheduledTime ? {
          hour: 9,
          minute: 10,
          repeats: true
        } : { seconds: 1 }
      });
    }
  } catch (error) {
    console.error('Error scheduling upcoming events notification:', error);
  }
}



export async function setupNotifications() {
  try {
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

    // Ρύθμιση των καθημερινών ειδοποιήσεων
    await setupDailyNotifications();

    return true;
  } catch (error) {
    console.error('Error in setupNotifications:', error);
    return false;
  }
}

export async function sendTestNotification() {
  try {
    if (!databaseInstance) {
      throw new Error('Database service not initialized');
    }

    const expiredEvents = await databaseInstance.getExpiredEvents();
    const upcomingEvents = await databaseInstance.getUpcomingEvents();
    
    const content = {
      title: '🔔 Ειδοποίηση απο Mouse Lab',
      body: 'Κατάσταση Εργασιών:\n\n' +
            (expiredEvents.length > 0 ? 
              `📍 ${expiredEvents.length} Εκκρεμείς Εργασίες:\n` +
              expiredEvents.map(event => {
                const type = getNotificationTitle(event);
                const date = event.endDate?.split('T')[0];
                const title = event.title || '';
                return `  • ${type}: ${title} (${date})\n`;
              }).join('') + '\n' : '') +
            (upcomingEvents.length > 0 ?
              `📅 ${upcomingEvents.length} Επερχόμενες Εργασίες:\n` +
              upcomingEvents.map(event => {
                const type = getNotificationTitle(event);
                const date = event.endDate?.split('T')[0];
                const title = event.title || '';
                return `  • ${type}: ${title} (${date})\n`;
              }).join('') : ''),
      data: { screen: 'reports' }
    };

    await Notifications.scheduleNotificationAsync({
      content,
      trigger: {
        seconds: 1
      }
    });

    console.log('Test notification scheduled');
  } catch (error) {
    console.error('Error sending test notification:', error);
  }
}

export const scheduleEventNotification = async (event: any) => {
  if (!event.notificationDate) return;

  const notificationDate = new Date(event.notificationDate);
  const now = new Date();

  // Skip if notification date is in the past
  if (notificationDate < now) {
    console.log('Skipping notification for past date:', event.notificationDate);
    return;
  }

  try {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: getNotificationTitle(event),
        body: getNotificationBody(event),
        data: { screen: 'reports' },
      },
      trigger: {
        date: notificationDate,
      },
    });
  } catch (error) {
    console.error('Error scheduling event notification:', error);
  }
};

// Χειρισμός του tap στην ειδοποίηση
Notifications.addNotificationResponseReceivedListener((response) => {
  const screen = response.notification.request.content.data?.screen;
  if (screen === 'reports') {
    router.push('/(tabs)/reports');
  }
});
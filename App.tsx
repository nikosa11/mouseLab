import { RacksProvider } from './contexts/RacksContext';
import { CagesProvider } from './contexts/CagesContext';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { NavigationContainer } from '@react-navigation/native';
import { useEffect } from 'react';
import { database } from './services/database';
import { setupNotifications, scheduleExpiredEventsNotification } from './services/notifications';
import * as Notifications from 'expo-notifications';

const Stack = createNativeStackNavigator();

export default function App() {
  useEffect(() => {
    const setupDatabase = async () => {
      try {
        console.log('Starting database setup...');
        await database.initDatabase();
        console.log('Database initialized with dummy data');
      } catch (error) {
        console.error('Database setup failed:', error);
      }
    };

    setupDatabase();
  }, []);

  useEffect(() => {
    async function setupNotifications() {
      const { status } = await Notifications.requestPermissionsAsync();
      if (status === 'granted') {
        await scheduleExpiredEventsNotification();
      }
    }
    
    setupNotifications();
  }, []);

  return (
    <NavigationContainer>
      <RacksProvider>
        <CagesProvider>
          <Stack.Navigator>
          </Stack.Navigator>
        </CagesProvider>
      </RacksProvider>
    </NavigationContainer>
  );
} 
import { StyleSheet, View, TouchableOpacity, ScrollView, Image, Alert } from 'react-native';
import { Text } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { useCallback, useState, useEffect } from 'react';
import { database } from '../../services/database';
import { setupNotifications, initializeNotifications, sendTestNotification } from '../../services/notifications';
import { eventBus } from '../../services/eventBus';
import { Ionicons } from '@expo/vector-icons';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function HomeScreen() {
  const router = useRouter();
  const [showMorningAnimation, setShowMorningAnimation] = useState(false);
  const [stats, setStats] = useState({
    totalCages: 0,
    occupiedCages: 0,
    totalAnimals: 0
  });

  const loadStats = async () => {
    try {
      const [cages, animals] = await Promise.all([
        database.getAllCages(),
        database.getAllAnimals()
      ]);
      console.log('Loaded stats:', cages);

      setStats({
        totalCages: cages.length,
        occupiedCages: cages.filter(cage => cage.status === 'occupied').length,
        totalAnimals: animals.length
      });
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const checkMorningGreeting = async () => {
    try {
      const lastGreeting = await AsyncStorage.getItem('lastMorningGreeting');
      const today = new Date().toDateString();
      const currentHour = new Date().getHours();

      if (lastGreeting !== today && currentHour >= 5 && currentHour < 12) {
        await AsyncStorage.setItem('lastMorningGreeting', today);
        await sendTestNotification();
        setShowMorningAnimation(true);
        setTimeout(() => setShowMorningAnimation(false), 3000);
      }
    } catch (error) {
      console.error('Error checking morning greeting:', error);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadStats();
      
      const unsubscribe = eventBus.subscribe('dataChanged', () => {
        loadStats();
      });

      return () => unsubscribe();
    }, [])
  );

  useEffect(() => {
    const initializeApp = async () => {
      try {
        // Initialize notifications with database
        initializeNotifications(database);
        await setupNotifications();
        await loadStats();
      } catch (error) {
        console.error('Error initializing app:', error);
      }
    };

    initializeApp();
    checkMorningGreeting();
  }, []);

  return (
    <View style={styles.container}>
      {showMorningAnimation ? (
        <View style={styles.animationContainer}>
          <Image
            source={require('../../assets/goodmorning1.gif')}
            style={styles.animation}
            resizeMode="contain"
          />
        </View>
      ) : (
        <ScrollView style={styles.scrollContainer}>
          <View style={styles.header}>
            <Text style={styles.welcomeText}>Καλώς ήρθατε 👋</Text>
            <Text style={styles.headerText}>Mouse Lab</Text>
          </View>

          <View style={styles.statsContainer}>
            <View style={[styles.statCard, { backgroundColor: '#4f46e5' }]}>
              <Text style={styles.statNumber}>{stats.totalAnimals}</Text>
              <Text style={styles.statLabel}>Συνολικά Ζώα</Text>
            </View>
            <View style={[styles.statCard, { backgroundColor: '#0891b2' }]}>
              <Text style={styles.statNumber}>{stats.totalCages}</Text>
              <Text style={styles.statLabel}>Κλουβιά</Text>
            </View>
            <View style={[styles.statCard, { backgroundColor: '#f59e0b' }]}>
              <Text style={styles.statNumber}>{stats.occupiedCages}</Text>
              <Text style={styles.statLabel}>Κατειλημμένα</Text>
            </View>
          </View>

      
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Γρήγορη Πρόσβαση</Text>
            
            <View style={styles.menuGrid}>
              <TouchableOpacity 
                style={styles.menuItem}
                onPress={() => router.push('/racks')}
              >
                <View style={[styles.menuIcon, { backgroundColor: '#e0e7ff' }]}>
                  <Ionicons name="grid-outline" size={24} color="#4f46e5" />
                </View>
                <Text style={styles.menuTitle}>Κλουβιά</Text>
                <Text style={styles.menuSubtitle}>Διαχείριση και παρακολούθηση</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.menuItem}
                onPress={() => router.push('/reports')}
              >
                <View style={[styles.menuIcon, { backgroundColor: '#fff7ed' }]}>
                  <Ionicons name="analytics-outline" size={24} color="#f59e0b" />
                </View>
                <Text style={styles.menuTitle}>Αναφορές</Text>
                <Text style={styles.menuSubtitle}>Στατιστικά στοιχεία</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.menuItem}
                onPress={() => router.push('/calendar')}
              >
                <View style={[styles.menuIcon, { backgroundColor: '#f0fdf4' }]}>
                  <Ionicons name="calendar-outline" size={24} color="#22c55e" />
                </View>
                <Text style={styles.menuTitle}>Ημερολόγιο</Text>
                <Text style={styles.menuSubtitle}>Προγραμματισμός</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                                style={styles.menuItem}

                onPress={async () => {
                  await sendTestNotification();
                  Alert.alert(
                    'Έλεγχος Ειδοποιήσεων',
                    'Η ειδοποίηση θα εμφανιστεί σε λίγα δευτερόλεπτα'
                  );
                }}
              >
                <View style={[styles.menuIcon, { backgroundColor: '#fef2f2' }]}>
                  <Ionicons name="notifications-outline" size={24} color="#ef4444" />
                </View>
                <Text style={styles.menuTitle}>Ειδοποιήσεις</Text>
                <Text style={styles.menuSubtitle}>Υπενθυμίσεις</Text>
              </TouchableOpacity>
            </View>
          </View>
        
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    backgroundColor: '#fff',
    padding: 20,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 8,
    elevation: 5,
  },
  welcomeText: {
    fontSize: 16,
    color: '#64748b',
    marginBottom: 8,
    fontWeight: '500',
  },
  headerText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#0f172a',
  },
  content: {
    flex: 1,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 20,
    gap: 12,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    padding: 16,
    borderRadius: 20,
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  statNumber: {
    color: 'white',
    fontSize: 24,
    fontWeight: 'bold',
  },
  statLabel: {
    color: 'white',
    fontSize: 12,
    marginTop: 4,
    textAlign: 'center',
    fontWeight: '500',
    opacity: 0.9,
  },
  section: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#0f172a',
    marginBottom: 20,
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 16,
  },
  actionButton: {
    flex: 1,
    padding: 15,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  actionIcon: {
    marginBottom: 8,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  menuGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 16,
  },
  menuItem: {
    alignItems: 'center',
    width: '47%',
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 20,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  menuIcon: {
    width: 50,
    height: 50,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  menuEmoji: {
    fontSize: 24,
  },
  menuTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  menuSubtitle: {
    fontSize: 12,
    color: '#666',
    lineHeight: 16,
  },
  animationContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  animation: {
    width: '100%',
    height: '100%',
  },
  scrollContainer: {
    flex: 1,
  },
});
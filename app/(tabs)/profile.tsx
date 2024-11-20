import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, Alert, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { database } from '../../services/database';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface ProfileData {
  name: string;
  email: string;
  avatar: string;
}

interface ProfileStats {
  totalEvents: number;
  breedingEvents: number;
  completedEvents: number;
}

export default function ProfileScreen() {
  const router = useRouter();
  const [profileData, setProfileData] = useState<ProfileData>({
    name: '',
    email: '',
    avatar: ''
  });
  const [stats, setStats] = useState<ProfileStats>({
    totalEvents: 0,
    breedingEvents: 0,
    completedEvents: 0
  });
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');

  useEffect(() => {
    loadProfileData();
    loadStats();
  }, []);

  const loadProfileData = async () => {
    try {
      const savedProfile = await AsyncStorage.getItem('profileData');
      if (savedProfile) {
        setProfileData(JSON.parse(savedProfile));
      }
    } catch (error) {
      console.error('Error loading profile:', error);
    }
  };

  const loadStats = async () => {
    try {
      const events = await database.getAllEvents();
      const totalEvents = events.length;
      const breedingEvents = events.filter(e => 
        e.type === 'breeding' || e.type === 'expected_pregnancy'
      ).length;
      const completedEvents = events.filter(e => e.completed).length;

      setStats({
        totalEvents,
        breedingEvents,
        completedEvents
      });
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const handleSaveProfile = async () => {
    try {
      const newProfileData = {
        ...profileData,
        name: editName,
        email: editEmail
      };
      await AsyncStorage.setItem('profileData', JSON.stringify(newProfileData));
      setProfileData(newProfileData);
      setIsEditModalVisible(false);
      Alert.alert('Επιτυχία', 'Το προφίλ ενημερώθηκε');
    } catch (error) {
      console.error('Error saving profile:', error);
      Alert.alert('Σφάλμα', 'Δεν ήταν δυνατή η αποθήκευση του προφίλ');
    }
  };

  const handleEditProfile = () => {
    setEditName(profileData.name);
    setEditEmail(profileData.email);
    setIsEditModalVisible(true);
  };

  const menuItems = [
    {
      icon: 'person-outline',
      title: 'Επεξεργασία Προφίλ',
      description: 'Αλλαγή στοιχείων προφίλ',
      onPress: handleEditProfile
    },
    {
      icon: 'notifications-outline',
      title: 'Ειδοποιήσεις',
      description: 'Ρυθμίσεις ειδοποιήσεων',
      onPress: () => router.push('/calendar')
    },
    {
      icon: 'bar-chart-outline',
      title: 'Αναφορές',
      description: 'Προβολή αναλυτικών αναφορών',
      onPress: () => router.push('/reports')
    }
  ];

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.avatarContainer}>
          <Text style={styles.avatarText}>
            {profileData.name ? profileData.name.substring(0, 2).toUpperCase() : 'U'}
          </Text>
        </View>
        <Text style={styles.name}>{profileData.name || 'Χρήστης'}</Text>
        <Text style={styles.email}>{profileData.email || 'Δεν έχει οριστεί email'}</Text>
      </View>

      <View style={styles.statsContainer}>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{stats.totalEvents}</Text>
          <Text style={styles.statLabel}>Events</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{stats.breedingEvents}</Text>
          <Text style={styles.statLabel}>Breeding</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{stats.completedEvents}</Text>
          <Text style={styles.statLabel}>Ολοκληρωμένα</Text>
        </View>
      </View>

      <View style={styles.menuContainer}>
        {menuItems.map((item, index) => (
          <TouchableOpacity
            key={index}
            style={styles.menuItem}
            onPress={item.onPress}
          >
            <View style={styles.menuItemContent}>
              <View style={styles.menuItemIcon}>
                <Ionicons name={item.icon as any} size={24} color="#2563eb" />
              </View>
              <View style={styles.menuItemText}>
                <Text style={styles.menuItemTitle}>{item.title}</Text>
                <Text style={styles.menuItemDescription}>{item.description}</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#94a3b8" />
          </TouchableOpacity>
        ))}
      </View>

      <Modal
        visible={isEditModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setIsEditModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Επεξεργασία Προφίλ</Text>
            
            <TextInput
              style={styles.input}
              placeholder="Όνομα"
              value={editName}
              onChangeText={setEditName}
            />
            
            <TextInput
              style={styles.input}
              placeholder="Email"
              value={editEmail}
              onChangeText={setEditEmail}
              keyboardType="email-address"
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={[styles.modalButton, styles.cancelButton]} 
                onPress={() => setIsEditModalVisible(false)}
              >
                <Text style={styles.buttonText}>Ακύρωση</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.modalButton, styles.confirmButton]} 
                onPress={handleSaveProfile}
              >
                <Text style={styles.buttonText}>Αποθήκευση</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  header: {
    alignItems: 'center',
    padding: 24,
  },
  avatarContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#2563eb',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  avatarText: {
    color: '#ffffff',
    fontSize: 32,
    fontWeight: 'bold',
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  email: {
    fontSize: 16,
    color: '#64748b',
    marginTop: 4,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 16,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 24,
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2563eb',
  },
  statLabel: {
    fontSize: 14,
    color: '#64748b',
    marginTop: 4,
  },
  menuContainer: {
    paddingHorizontal: 16,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  menuItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  menuItemIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  menuItemText: {
    flex: 1,
  },
  menuItemTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
  },
  menuItemDescription: {
    fontSize: 14,
    color: '#64748b',
    marginTop: 2,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    width: '80%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    textAlign: 'center',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 10,
    marginBottom: 15,
    fontSize: 16,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  modalButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    marginHorizontal: 5,
  },
  confirmButton: {
    backgroundColor: '#51cf66',
  },
  cancelButton: {
    backgroundColor: '#ff6b6b',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '500',
  },
}); 
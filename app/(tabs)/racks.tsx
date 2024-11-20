// racks.tsx
import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { database } from '../../services/database';
import { eventBus } from '../../services/eventBus';
import { Rack } from '../../types';
import { Ionicons } from '@expo/vector-icons';
import AddRackModal from '../../components/modals/AddRackModal';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function RacksScreen() {
  const router = useRouter();
  const [racks, setRacks] = useState<Rack[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddModalVisible, setIsAddModalVisible] = useState(false);

  useEffect(() => {
    loadRacks();
    
    const unsubscribe = eventBus.subscribe('dataChanged', () => {
      loadRacks();
    });

    return () => unsubscribe();
  }, []);

  const loadRacks = async () => {
    try {
      setIsLoading(true);
      const racksData = await database.getAllRacks();
      console.log('Loaded racks:', racksData); // Για debugging
      setRacks(racksData);
    } catch (error) {
      console.error('Error loading racks:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddRack = async (rackData: Omit<Rack, 'id'>) => {
    try {
      await database.addRack(rackData);
      await loadRacks();
      setIsAddModalVisible(false);
    } catch (error) {
      console.error('Error adding rack:', error);
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Φόρτωση...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Διαχείριση Racks</Text>
        <TouchableOpacity 
          style={styles.addButton}
          onPress={() => setIsAddModalVisible(true)}
        >
          <Ionicons name="add-circle" size={24} color="white" />
          <Text style={styles.addButtonText}>Νέο Rack</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView}>
        <View style={styles.grid}>
          {racks.map((rack) => (
            <TouchableOpacity
              key={`rack-${rack.id}-${rack.position}`}
              style={styles.rackCard}
              onPress={() => router.push(`/rack/${rack.id}`)}
            >
              <View style={styles.rackHeader}>
                <Text style={styles.rackName}>{rack.name}</Text>
                <View style={styles.positionBadge}>
                  <Text style={styles.positionText}>Θέση {rack.position}</Text>
                </View>
              </View>
              
              <View style={styles.rackStats}>
                <View style={styles.statItem}>
                  <Ionicons name="grid-outline" size={20} color="#666" />
                  <Text style={styles.statText}>{rack.capacity} Κλουβιά</Text>
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      <AddRackModal
        visible={isAddModalVisible}
        onClose={() => setIsAddModalVisible(false)}
        onAdd={handleAddRack}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    padding: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2196F3',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 4,
  },
  addButtonText: {
    color: 'white',
    fontWeight: '500',
    fontSize: 14,
  },
  scrollView: {
    flex: 1,
  },
  grid: {
    padding: 8,
    gap: 8,
  },
  rackCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 12,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  rackHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  rackName: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
  },
  positionBadge: {
    backgroundColor: '#f5f5f5',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  positionText: {
    color: '#666',
    fontSize: 13,
    fontWeight: '500',
  },
  rackStats: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  statText: {
    color: '#666',
    fontSize: 14,
    fontWeight: '500',
  },
});
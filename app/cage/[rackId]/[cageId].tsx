import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, Alert } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { database, Animal, Cage } from '../../../services/database';
import { AddAnimalModal } from '../../../components/modals/AddAnimalModal';
import { EditAnimalModal } from '../../../components/modals/EditAnimalModal';

export default function CageScreen() {
  const { rackId, cageId } = useLocalSearchParams<{ rackId: string; cageId: string }>();
  const [cage, setCage] = useState<Cage | null>(null);
  const [animals, setAnimals] = useState<Animal[]>([]);
  const [isAddModalVisible, setIsAddModalVisible] = useState(false);
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [selectedAnimal, setSelectedAnimal] = useState<Animal | null>(null);

  useEffect(() => {
    loadCageAndAnimals();
  }, [cageId]);

  const loadCageAndAnimals = async () => {
    try {
      const cageData = await database.getCage(parseInt(cageId));
      setCage(cageData);
      const animalData = await database.getAnimalsByCageId(parseInt(cageId));
      setAnimals(animalData);
    } catch (error) {
      console.error('Error loading cage and animals:', error);
    }
  };

  const handleAddAnimal = async (animalData: { species: string; birthDate?: string; notes?: string }) => {
    try {
      await database.addAnimal({
        cage_id: parseInt(cageId),
        species: animalData.species,
        birth_date: animalData.birthDate,
        notes: animalData.notes,
        status: 'active'
      });
      loadCageAndAnimals();
    } catch (error) {
      console.error('Error adding animal:', error);
    }
  };

  const handleEditAnimal = async (animalData: Animal) => {
    try {
      await database.updateAnimal(animalData);
      loadCageAndAnimals();
    } catch (error) {
      console.error('Error updating animal:', error);
    }
  };

  const handleArchiveAnimal = (animal: Animal) => {
    Alert.alert(
      'Αρχειοθέτηση Ζώου',
      'Είστε σίγουροι ότι θέλετε να αρχειοθετήσετε αυτό το ζώο;',
      [
        { text: 'Άκυρο', style: 'cancel' },
        {
          text: 'Αρχειοθέτηση',
          style: 'destructive',
          onPress: async () => {
            try {
              await database.archiveAnimal(animal.id);
              loadCageAndAnimals();
            } catch (error) {
              console.error('Error archiving animal:', error);
            }
          }
        }
      ]
    );
  };

  return (
    <View style={styles.container}>
      {cage && (
        <View style={styles.cageInfo}>
          <Text style={styles.title}>Κλουβί #{cage.number}</Text>
          <Text>Χωρητικότητα: {cage.capacity}</Text>
          <Text>Ζώα: {animals.length}/{cage.capacity}</Text>
        </View>
      )}

      <FlatList
        data={animals}
        renderItem={({ item }) => (
          <TouchableOpacity 
            style={styles.animalCard}
            onPress={() => {
              setSelectedAnimal(item);
              setIsEditModalVisible(true);
            }}
          >
            <View style={styles.animalInfo}>
              <Text style={styles.species}>{item.species}</Text>
              {item.birth_date && (
                <Text style={styles.birthDate}>
                  Ημ. Γέννησης: {new Date(item.birth_date).toLocaleDateString()}
                </Text>
              )}
              {item.notes && <Text style={styles.notes}>{item.notes}</Text>}
            </View>
            <TouchableOpacity
              style={styles.archiveButton}
              onPress={() => handleArchiveAnimal(item)}
            >
              <Text style={styles.archiveButtonText}>Αρχειοθέτηση</Text>
            </TouchableOpacity>
          </TouchableOpacity>
        )}
        keyExtractor={item => item.id.toString()}
      />

      <TouchableOpacity 
        style={styles.addButton}
        onPress={() => setIsAddModalVisible(true)}
      >
        <Text style={styles.addButtonText}>+ Προσθήκη Ζώου</Text>
      </TouchableOpacity>

      <AddAnimalModal
        visible={isAddModalVisible}
        onClose={() => setIsAddModalVisible(false)}
        onAdd={handleAddAnimal}
      />

      {selectedAnimal && (
        <EditAnimalModal
          visible={isEditModalVisible}
          animal={selectedAnimal}
          onClose={() => {
            setIsEditModalVisible(false);
            setSelectedAnimal(null);
          }}
          onSave={handleEditAnimal}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f8fafc',
  },
  cageInfo: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  animalCard: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  animalInfo: {
    flex: 1,
  },
  species: {
    fontSize: 18,
    fontWeight: '600',
  },
  birthDate: {
    fontSize: 14,
    color: '#64748b',
    marginTop: 4,
  },
  notes: {
    fontSize: 14,
    color: '#64748b',
    marginTop: 4,
    fontStyle: 'italic',
  },
  archiveButton: {
    backgroundColor: '#ef4444',
    padding: 8,
    borderRadius: 8,
    marginLeft: 12,
  },
  archiveButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '500',
  },
  addButton: {
    backgroundColor: '#3b82f6',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 16,
  },
  addButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});
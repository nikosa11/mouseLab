import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, Alert, ScrollView, Dimensions, Platform } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useEffect, useState, useCallback } from 'react';
import { database } from '../../services/database';
import { Rack, Cage, Animal } from '../../types';
import { Ionicons } from '@expo/vector-icons';
import AddAnimalModal from '../../components/modals/AddAnimalModal';
import EditAnimalModal from '../../components/modals/EditAnimalModal';
import { useRouter } from 'expo-router';

const screenWidth = Dimensions.get('window').width;
const isMobile = screenWidth < 768;

const CageItem = ({ 
  cage, 
  onPress, 
  onAddExtra,
  onDelete,
  refreshTrigger
}: {
  cage: Cage;
  onPress: (cage: Cage) => void;
  onAddExtra: (cage: Cage) => void;
  onDelete: (cageId: string) => void;
  refreshTrigger: number;
}) => {
  const [animalCount, setAnimalCount] = useState(0);

  useEffect(() => {
    const loadAnimalCount = async () => {
      try {
        const count = await database.getAnimalCountForCage(cage.id);
        setAnimalCount(count);
      } catch (error) {
        console.error('Error loading animal count:', error);
        setAnimalCount(0);
      }
    };
    loadAnimalCount();
  }, [cage.id, refreshTrigger]);

  // Υπολογισμός του background color με βάση το status και το animalCount
  const getBackgroundColor = () => {
    if (animalCount > 0) {
      return '#e8f5e9'; // Πράσινο χρώμα για κλουβιά με ζώα
    }
    return '#fff'; // Λευκό για άδεια κλουβιά
  };

  return (
    <View style={[
      isMobile ? styles.cageItemMobile : styles.cageItemDesktop,
      { 
        backgroundColor: getBackgroundColor(),
        borderColor: animalCount > 0 ? '#4CAF50' : '#ddd', // Αλλαγή χρώματος περιγράμματος
        borderWidth: animalCount > 0 ? 2 : 1, // Πιο έντονο περίγραμμα για κλουβιά με ζώα
      }
    ]}>
      <TouchableOpacity 
        style={styles.cageContent}
        onPress={() => {
          if (animalCount === 0) {
            // Αν δεν έχει ζώα, ανοίγουμε το AddAnimalModal
            onPress(cage);
          }
        }}
      >
        <Text style={[
          styles.cageNumber,
          animalCount > 0 && styles.cageNumberOccupied // Προσθήκη στυλ για το κείμενο
        ]}>
          {cage.notes ? cage.notes : `Θέση ${cage.position}`}
        </Text>
        <Text style={[
          styles.cageStatus,
          animalCount > 0 && styles.cageStatusOccupied // Προσθήκη στυλ για το status
        ]}>
          {`${animalCount} ${animalCount === 1 ? 'ζώο' : 'ζώα'}`}
        </Text>
        {cage.type && (
          <Text style={[
            styles.cageType,
            animalCount > 0 && styles.cageTypeOccupied // Προσθήκη στυλ για τον τύπο
          ]}>
            {cage.type}
          </Text>
        )}
      </TouchableOpacity>
      
      <View style={styles.cageActions}>
        {animalCount > 0 && (
          <>
            <TouchableOpacity 
              style={styles.addExtraButton}
              onPress={() => onAddExtra(cage)}
            >
              <Ionicons name="add-circle" size={22} color="#4caf50" />
              <Text style={styles.addExtraText}>Προσθήκη ζώου</Text>
            </TouchableOpacity>
            
            {/* Νέο κουμπί για επεξεργασία */}
            <TouchableOpacity 
              style={styles.editButton}
              onPress={() => onPress(cage)}
            >
              <Ionicons name="create" size={20} color="#2196F3" />
            </TouchableOpacity>
          </>
        )}
        
        <TouchableOpacity 
          style={styles.deleteButton}
          onPress={() => onDelete(cage.id)}
        >
          <Ionicons name="trash" size={20} color="#dc3545" />
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default function RackScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [rack, setRack] = useState<Rack | null>(null);
  const [cages, setCages] = useState<Cage[]>([]);
  const [selectedCage, setSelectedCage] = useState<Cage | null>(null);
  const [selectedAnimals, setSelectedAnimals] = useState<Animal[]>([]);
  const [isAddModalVisible, setIsAddModalVisible] = useState(false);
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [cageAnimals, setCageAnimals] = useState<{ [key: string]: Animal[] }>({});
  const [isLoading, setIsLoading] = useState(true);
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const [modalMode, setModalMode] = useState<'preview' | 'addExtra' | 'add'>('preview');
  const [showDeleteCageModal, setShowDeleteCageModal] = useState(false);
  const [selectedCageForDelete, setSelectedCageForDelete] = useState<string | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const router = useRouter();

  const handleBack = () => {
    router.push('/racks');
  };

  const loadRackAndCages = async () => {
    console.log('=== START loadRackAndCages ===');
    setIsLoading(true);
    try {
      console.log('Loading rack data for ID:', id);
      const rackData = await database.getRackById(id);
      console.log('Loaded rack data:', rackData);

      console.log('Loading cages for rack');
      const cagesData = await database.getCagesByRackId(id);
      console.log('Loaded cages data:', cagesData);

      // Φόρτωση ζώων για κάθε κλουβί
      console.log('Loading animals for each cage');
      const animalsMap: { [key: string]: Animal[] } = {};
      for (const cage of cagesData) {
        const animals = await database.getAnimalsByCageId(cage.id);
        console.log(`Loaded animals for cage ${cage.id}:`, animals);
        animalsMap[cage.id] = animals;
      }

      console.log('Setting states with new data');
      setRack(rackData);
      setCages(cagesData);
      setCageAnimals(animalsMap);
      
      console.log('States updated successfully');
    } catch (error) {
      console.error('Error in loadRackAndCages:', error);
      Alert.alert('Σφάλμα', 'Δεν ήταν δυνατή η φόρτωση των δεδομένων');
    } finally {
      setIsLoading(false);
    }
  };

  // Αρχική φόρτωση
  useEffect(() => {
    console.log('Initial load effect triggered');
    loadRackAndCages();
  }, [id]);

  // Επαναφόρτωση όταν κλείνουν τα modals
  useEffect(() => {
    if (!isAddModalVisible && !isEditModalVisible) {
      loadRackAndCages();
    }
  }, [isAddModalVisible, isEditModalVisible]);

  // Προσήκη επιπλέον effect για άμεση ενημέρωση
  useEffect(() => {
    const reloadData = async () => {
      await loadRackAndCages();
    };
    reloadData();
  }, [selectedCage]); // Προσθήκη του selectedCage στις εξαρτήσεις

  const handleCagePress = async (cage: Cage) => {
    try {
      const animals = await database.getAnimalsByCageId(cage.id);
      if (animals.length === 0) {
        // Αν δεν έχει ζώα, ανοίγουμε το AddAnimalModal
        setSelectedCage(cage);
        setIsAddModalVisible(true);
      } else {
        // Αν έχει ζώα, ανοίγουμε το EditAnimalModal σε preview mode
        setSelectedCage(cage);
        setSelectedAnimals(animals);
        setModalMode('preview');
        setIsEditModalVisible(true);
      }
    } catch (error) {
      console.error('Error checking cage animals:', error);
      Alert.alert('Σφάλμα', 'Υπήρξε πρόβλημα κατά τον έλεγχο των ζώων.');
    }
  };

  const handleAddExtra = (cage: Cage) => {
    setSelectedCage(cage);
    setModalMode('addExtra');
    setIsEditModalVisible(true);
  };

  const handleAddAnimal = async (animalData: any) => {
    try {
      await database.addAnimalWithEvent(animalData);
      refreshData();
      setIsAddModalVisible(false);
    } catch (error) {
      console.error('Error adding animal:', error);
      Alert.alert('Σφάλμα', 'Υπήρξε πρόβλημα κατά την προσθήκη του ζώου.');
    }
  };

  const closeAllModals = () => {
    console.log('Closing all modals');
    setIsAddModalVisible(false);
    setIsEditModalVisible(false);
    setSelectedCage(null);
    setSelectedAnimals([]);
  };

  const handleDeleteRack = async () => {
    console.log('=== START handleDeleteRack ===');
    
    if (!rack?.id) {
      console.error('No rack ID available');
      return;
    }

    if (Platform.OS === 'web') {
      setShowConfirmDelete(true);
    } else {
      Alert.alert(
        'Διαγραφή Rack',
        'Είστε σίγουροι ότι θέλετε να διαγράψετε αυτό το rack; Θα διαγραφούν όλα τα κλά, τα ώα και τα events.',
        [
          {
            text: 'Άκυρο',
            style: 'cancel',
          },
          {
            text: 'Διαγραφή',
            style: 'destructive',
            onPress: performDelete,
          },
        ],
      );
    }
  };

  const performDelete = async () => {
    try {
      console.log('Starting deletion process for rack:', rack?.id);
      setIsLoading(true);
      await database.deleteRackWithRelations(rack!.id);
      console.log('Rack deleted successfully');
      router.push('/racks');
    } catch (error) {
      console.error('Error in handleDeleteRack:', error);
      // Εμφάνιση error message
    } finally {
      setIsLoading(false);
      setShowConfirmDelete(false);
    }
  };

  const handleDeleteCage = async (cageId: string) => {
    try {
      await database.deleteCage(cageId);
      
      // Άμεση ενημέρωση του UI
      setCages(prevCages => prevCages.filter(cage => cage.id !== cageId));
      
      // Επαναφόρτωση των δεδομένων
      loadCages();
      
      setShowDeleteCageModal(false);
    } catch (error) {
      console.error('Error deleting cage:', error);
      Alert.alert('Σφάλμα', 'Υπήρξε πρόβλημα κατά τη διαγραφή του κλουβιού.');
    }
  };

  const handleAddCage = async () => {
    try {
      if (!id) return;

      const newCage = await database.addCage(id);
      console.log('New cage added:', newCage);
      
      // Ανανέωση του UI
      setCages(prevCages => [...prevCages, newCage]);
      
      // Επαναφόρτωση των δεδομένων
      await loadRackAndCages();
    } catch (error) {
      console.error('Error in handleAddCage:', error);
      Alert.alert('Σφάλμα', 'Υπήρξε πρόβλημα κατά την προσθήκη του κλουβιού.');
    }
  };

  const renderCage = (cage: Cage) => {
    return (
      <TouchableOpacity 
        key={cage.id} 
        style={[styles.cage, getCageStyle(cage)]}
        onPress={() => handleCagePress(cage)}
      >
        <Text style={styles.cageText}>
          {cage.notes ? cage.notes : `Θέση ${cage.position}`}
        </Text>
        {/* ... υπόλοιπα στοιχεία ... */}
      </TouchableOpacity>
    );
  };

  const refreshData = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  // Φόρτωση των cages
  const loadCages = useCallback(async () => {
    try {
      if (!id) return;
      const rackCages = await database.getCagesByRackId(id);
      setCages(rackCages);
    } catch (error) {
      console.error('Error loading cages:', error);
    }
  }, [id]);

  // Αρχική φόρτωση
  useEffect(() => {
    loadCages();
  }, [loadCages, refreshTrigger]);

  const handleDeleteAnimal = async (animalId: string) => {
    console.log('=== START handleDeleteAnimal ===');
    try {
      if (!selectedCage) {
        throw new Error('No cage selected');
      }

      await database.deleteAnimal(animalId, selectedCage.id);
      
      // Ανανέωση του UI
      setSelectedAnimals(prev => prev.filter(animal => animal.id !== animalId));
      
      // Επαναφόρτωση των δεδομένων
      await loadRackAndCages();
      
      // Κλείσιμο του modal αν δεν υπάρχουν άλλα ζώα
      const remainingAnimals = await database.getAnimalsByCageId(selectedCage.id);
      if (remainingAnimals.length === 0) {
        setIsEditModalVisible(false);
      }

      console.log('Successfully handled animal deletion');
    } catch (error) {
      console.error('Error in handleDeleteAnimal:', error);
      Alert.alert('Σφάλμα', 'Υπήρξε πρόβλημα κατά τη διαγραφή του ζώου.');
    }
    console.log('=== END handleDeleteAnimal ===');
  };

  return (
    <View style={styles.container}>
      <ScrollView>
        {isLoading ? (
          <ActivityIndicator size="large" color="#0000ff" style={styles.loader} />
        ) : (
          <>
            <View style={styles.header}>
              {/* <View style={styles.headerLeft}>
                <TouchableOpacity onPress={handleBack} style={styles.backButton}>
                  <Ionicons name="arrow-back" size={24} color="#333" />
                </TouchableOpacity>
                <Text style={styles.title}>Rack {rack?.name}</Text>
              </View> */}
              
              <View style={styles.headerRight}>
                <TouchableOpacity 
                  style={styles.addCageButton}
                  onPress={handleAddCage}
                >
                  <Ionicons name="add-circle" size={24} color="#4CAF50" />
                  <Text style={styles.addCageButtonText}>Προσθήκη Κλουβιού</Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={isMobile ? styles.cagesColumnMobile : styles.cagesGridDesktop}>
              {cages.map((cage) => {
                if (!cage || !cage.id) {
                  return null;
                }
                
                return (
                  <CageItem
                    key={cage.id}
                    cage={cage}
                    onPress={handleCagePress}
                    onAddExtra={handleAddExtra}
                    onDelete={handleDeleteCage}
                    refreshTrigger={refreshTrigger}
                  />
                );
              })}
            </View>

            {/* Modals */}
            {selectedCage && isAddModalVisible && (
              <AddAnimalModal
                visible={isAddModalVisible}
                onClose={closeAllModals}
                onAdd={handleAddAnimal}
                cageNumber={selectedCage?.position}
                rackId={Number(id)}
                cageId={selectedCage.id}
                onUpdate={loadRackAndCages}
              />
            )}

            {selectedCage && isEditModalVisible && (
              <EditAnimalModal
                visible={isEditModalVisible}
                cage={selectedCage}
                onClose={() => setIsEditModalVisible(false)}
                onUpdate={() => loadRackAndCages()}
                selectedAnimals={selectedAnimals}
                mode={modalMode}
              />
            )}

            {showDeleteCageModal && (
              <View style={styles.modalOverlay}>
                <View style={styles.modalContent}>
                  <View style={styles.modalHeader}>
                    <Ionicons name="warning" size={32} color="#dc3545" />
                    <Text style={styles.modalTitle}>Διαγραφή Κλουβιού</Text>
                  </View>
                  <Text style={styles.modalText}>
                    Είστε σίγουροι ότι θέλετε να διαγράψετε αυτό το κλουβί; {'\n\n'}
                    Η ενέργεια αυτή θα διαγράψει μόνιμα:
                    {'\n'} • Όλα τα ζώα του κλουβιού
                    {'\n'} • Όλα τα events
                  </Text>
                  <View style={styles.modalButtons}>
                    <TouchableOpacity 
                      style={[styles.modalButton, styles.cancelButton]}
                      onPress={() => setShowDeleteCageModal(false)}
                    >
                      <Ionicons name="close" size={18} color="#fff" />
                      <Text style={styles.buttonText}>Άκυρο</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={[styles.modalButton, styles.modalDeleteButton]}
                      onPress={() => {
                        if (selectedCageForDelete) {
                          handleDeleteCage(selectedCageForDelete);
                        }
                      }}
                    >
                      <Ionicons name="trash-bin" size={18} color="#fff" />
                      <Text style={styles.buttonText}>Διαγραφή</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            )}
          </>
        )}
      </ScrollView>
    </View>
  );
}

const getCageTypeColor = (type: CageType): string => {
  switch (type) {
    case 'breeding':
      return '#e3f2fd';
    case 'expected_pregnancy':
      return '#fff3e0';
    case 'maintenance':
      return '#f5f5f5';
    default:
      return '#f5f5f5';
  }
};

const formatCageType = (type: CageType): string => {
  return type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  loader: {
    marginTop: 20,
  },
  cageItem: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  cageNumber: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  cageStatus: {
    fontSize: 12,
    color: '#666',
    textTransform: 'capitalize',
    backgroundColor: '#f8f9fa',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    textAlign: 'center',
  },
  cageType: {
    fontSize: 11,
    color: '#666',
    marginTop: 4,
    textTransform: 'capitalize',
    textAlign: 'center',
  },
  '@media (min-width: 768px)': {
    cageItem: {
      width: 'calc(20% - 8px)',
    },
    cageNumber: {
      fontSize: 18,
    },
    cageStatus: {
      fontSize: 16,
    },
    cageType: {
      fontSize: 14,
    }
  },
  // Mobile styles
  cagesColumnMobile: {
    padding: 16,
  },
  cageItemMobile: {
    width: '100%',
    height: 160,
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cageNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 12,
  },
  cageStatus: {
    fontSize: 16,
    color: '#666',
    backgroundColor: '#f8f9fa',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
    marginBottom: 8,
  },
  cageType: {
    fontSize: 14,
    color: '#666',
    textTransform: 'capitalize',
  },

  // Desktop styles
  cagesGridDesktop: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
    padding: 32,
    gap: 32,
    backgroundColor: '#f8f9fa',
  },
  cageItemDesktop: {
    width: 'calc(20% - 32px)',
    aspectRatio: 1,
    backgroundColor: 'white',
    borderRadius: 40,
    padding: 24,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#e0e0e0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 8,
    marginBottom: 32,
    overflow: 'hidden',
  },
  headerDeleteButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 24,
    width: '90%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  modalText: {
    fontSize: 15,
    color: '#4a5568',
    marginBottom: 24,
    lineHeight: 24,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
  },
  modalButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    minWidth: 120,
    justifyContent: 'center',
    gap: 8,
  },
  cancelButton: {
    backgroundColor: '#6c757d',
  },
  modalDeleteButton: {
    backgroundColor: '#dc3545',
  },
  buttonText: {
    color: 'white',
    fontSize: 15,
    fontWeight: '500',
  },
  cageContent: {
    flex: 1,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  
  addExtraButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    backgroundColor: '#e8f5e9',
    borderRadius: 25,
    gap: 10,
    marginTop: 12,
  },
  
  addExtraText: {
    fontSize: 13,
    color: '#4caf50',
    fontWeight: '500',
  },
  cageActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    marginTop: 16,
    gap: 16,
  },
  deleteButton: {
    padding: 12,
    borderRadius: 25,
    backgroundColor: '#ffebee',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  addCageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e8f5e9',
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 30,
    gap: 12,
    shadowColor: '#4CAF50',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  addCageButtonText: {
    color: '#4CAF50',
    fontSize: 15,
    fontWeight: '500',
  },
  cageNumberOccupied: {
    color: '#1b5e20',
    fontWeight: '600',
    backgroundColor: '#e8f5e9',
    borderRadius: 25,
  },
  
  cageStatusOccupied: {
    color: '#2e7d32',
    fontWeight: '500',
    backgroundColor: '#e8f5e9',
    borderRadius: 20,
  },
  
  cageTypeOccupied: {
    color: '#388e3c',
    fontWeight: '500',
    backgroundColor: '#e8f5e9',
    borderRadius: 20,
  },
  
  cageItemMobile: {
    // ... υπάρχον στυλ ...
  },
  
  cageItemDesktop: {
    width: 'calc(20% - 32px)',
    aspectRatio: 1,
    backgroundColor: 'white',
    borderRadius: 40,
    padding: 24,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#e0e0e0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 8,
    marginBottom: 32,
    overflow: 'hidden',
  },
  
  cageNumber: {
    fontSize: 20,
    fontWeight: '600',
    color: '#424242',
    textAlign: 'center',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 25,
    backgroundColor: '#f5f5f5',
    marginBottom: 12,
    overflow: 'hidden',
  },
  
  cageStatus: {
    fontSize: 16,
    color: '#757575',
    paddingVertical: 6,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: '#f5f5f5',
    marginVertical: 6,
  },
  
  cageType: {
    fontSize: 14,
    color: '#9e9e9e',
    paddingVertical: 6,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: '#f5f5f5',
    marginTop: 6,
  },
  
  // ... υπόλοιπα στυλ ...

  // Container για τα κλουβιά σε mobile
  cagesGridMobile: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between', // Καλύτερη κατανομή στο mobile
    padding: 16,
    gap: 16,
    backgroundColor: '#f8f9fa',
  },

  // Mobile-specific κλουβί
  cageItemMobile: {
    width: 'calc(50% - 12px)', // 2 κλουβιά ανά σειρά με κενό
    aspectRatio: 1,
    backgroundColor: 'white',
    borderRadius: 25, // Πιο κυκλικό για mobile
    padding: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#e0e0e0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    marginBottom: 16,
    overflow: 'hidden',
  },

  // Περιεχόμενο κλουβιού για mobile
  cageContent: {
    flex: 1,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },

  // Στυλ κειμένων για mobile
  cageNumber: {
    fontSize: 16,
    fontWeight: '600',
    color: '#424242',
    textAlign: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 15,
    backgroundColor: '#f5f5f5',
    marginBottom: 8,
    overflow: 'hidden',
  },

  cageStatus: {
    fontSize: 14,
    color: '#757575',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 12,
    backgroundColor: '#f5f5f5',
    marginVertical: 4,
  },

  cageType: {
    fontSize: 12,
    color: '#9e9e9e',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 12,
    backgroundColor: '#f5f5f5',
    marginTop: 4,
  },

  // Στυλ για κλουβιά με ζώα σε mobile
  cageNumberOccupied: {
    color: '#1b5e20',
    fontWeight: '600',
    backgroundColor: '#e8f5e9',
  },

  cageStatusOccupied: {
    color: '#2e7d32',
    fontWeight: '500',
    backgroundColor: '#e8f5e9',
  },

  cageTypeOccupied: {
    color: '#388e3c',
    fontWeight: '500',
    backgroundColor: '#e8f5e9',
  },

  // Κουμπιά για mobile
  addExtraButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    backgroundColor: '#e8f5e9',
    borderRadius: 15,
    gap: 6,
    marginTop: 8,
  },

  addExtraText: {
    fontSize: 12,
    color: '#2e7d32',
    fontWeight: '500',
  },

  deleteButton: {
    padding: 8,
    borderRadius: 15,
    backgroundColor: '#ffebee',
  },

  // Container για τα κουμπιά σε mobile
  cageActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    marginTop: 8,
    gap: 8,
  },

  // Κουμπί προσθήκης κλουβιού για mobile
  addCageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e8f5e9',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    gap: 8,
    shadowColor: '#4CAF50',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },

  editButton: {
    padding: 8,
    borderRadius: 15,
    backgroundColor: '#e3f2fd',
  }
});
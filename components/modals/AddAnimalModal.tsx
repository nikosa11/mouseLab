import React, { useState, useEffect } from 'react';
import { Modal, View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert, Platform } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { Animal, CageType, EventType } from '../../types';
import { addDays, format } from 'date-fns';
import DateTimePicker from '@react-native-community/datetimepicker';
import { database } from '../../services/database';

interface AddAnimalModalProps {
  visible: boolean;
  onClose: () => void;
  onAdd: (data: any) => Promise<void>;
  cageNumber: number;
  rackId: string;
  cageId: string;
  onUpdate: () => Promise<void>;
}

export default function AddAnimalModal({ visible, onClose, onAdd, cageNumber, rackId, cageId, onUpdate }: AddAnimalModalProps) {
  const [newAnimal, setNewAnimal] = useState<Partial<Animal>>({
    species: '',
    strain: '',
    sex: 'male',
    birth_date: new Date().toISOString().split('T')[0],
    status: 'active',
  });
  
  const [selectedType, setSelectedType] = useState<CageType>('breeding');
  const [eventDays, setEventDays] = useState(21); // Default για breeding
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [cageName, setCageName] = useState('');

  const handleTypeSelect = (newType: CageType) => {
    setSelectedType(newType);
    // Set default days when changing type
    switch (newType) {
      case 'breeding':
        setEventDays(3);
        break;
      case 'expected_pregnancy':
        setEventDays(21);
        break;
      case 'weaning':
        setEventDays(21);
        break;
      case 'maintenance':
        setEventDays(0);
        break;
    }
  };

  const handleDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(Platform.OS === 'ios');
    if (selectedDate) {
      setNewAnimal(prev => ({
        ...prev,
        birth_date: selectedDate.toISOString().split('T')[0]
      }));
    }
  };

  const handleAddAnimal = async () => {
    if (!newAnimal.species || !newAnimal.strain) {
      Alert.alert('Σφάλμα', 'Παρακαλώ συμπληρώστε όλα τα απαραίτητα πεδία');
      return;
    }

    try {
      const startDate = new Date();
      const endDate = new Date(Date.now() + eventDays * 24 * 60 * 60 * 1000);
      
      const animal: Omit<Animal, 'id'> = {
        species: newAnimal.species,
        strain: newAnimal.strain,
        sex: newAnimal.sex || 'male',
        birth_date: newAnimal.birth_date || new Date().toISOString().split('T')[0],
        status: 'active',
        cage_id: cageId
      };

      const updateData = {
        type: selectedType,
        notes: cageName,
        status: 'occupied',
        event: {
          startDate: startDate.toISOString().split('T')[0],
          endDate: endDate.toISOString().split('T')[0],
          notificationDate: endDate.toISOString().split('T')[0]
        }
      };

      await database.updateCageWithEvent(cageId, updateData);
      await database.addAnimal(animal);
      await onUpdate();
      onClose();

    } catch (error) {
      console.error('Error adding animal:', error);
      Alert.alert('Σφάλμα', 'Δεν ήταν δυνατή η προσθήκη του ζώου');
    }
  };

  const adjustBirthDate = (days: number) => {
    const currentDate = new Date(newAnimal.birth_date);
    currentDate.setDate(currentDate.getDate() + days);
    
    if (currentDate <= new Date()) {
      setNewAnimal(prev => ({
        ...prev,
        birth_date: currentDate.toISOString().split('T')[0]
      }));
    }
  };

  const adjustBirthMonth = (months: number) => {
    const currentDate = new Date(newAnimal.birth_date);
    currentDate.setMonth(currentDate.getMonth() + months);
    
    if (currentDate <= new Date()) {
      setNewAnimal(prev => ({
        ...prev,
        birth_date: currentDate.toISOString().split('T')[0]
      }));
    }
  };

  const setTodayAsBirthDate = () => {
    setNewAnimal(prev => ({
      ...prev,
      birth_date: new Date().toISOString().split('T')[0]
    }));
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={true} onRequestClose={onClose}>
      <View style={styles.centeredView}>
        <View style={styles.modalContent}>
          <Text style={styles.title}>Προσθήκη Νέου Ζώου στο Κλουβί {cageNumber}</Text>
          
          <ScrollView 
            style={styles.scrollView}
            showsVerticalScrollIndicator={true}
            contentContainerStyle={{ paddingBottom: 20 }}
          >
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Στοιχεία Ζώου</Text>
              <View style={styles.inputContainer}>
                <Text style={styles.label}>Είδος</Text>
                <TextInput
                  style={styles.input}
                  value={newAnimal.species}
                  onChangeText={(text) => setNewAnimal(prev => ({ ...prev, species: text }))}
                  placeholder="Εισάγετε είδος"
                />
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.label}>Φυλή</Text>
                <TextInput
                  style={styles.input}
                  value={newAnimal.strain}
                  onChangeText={(text) => setNewAnimal(prev => ({ ...prev, strain: text }))}
                  placeholder="Εισάγετε φυλή"
                />
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.label}>Φύλο</Text>
                <Picker
                  selectedValue={newAnimal.sex}
                  style={styles.picker}
                  onValueChange={(itemValue) =>
                    setNewAnimal(prev => ({ ...prev, sex: itemValue }))
                  }
                >
                  <Picker.Item label="Αρσενικό" value="male" />
                  <Picker.Item label="Θηλυκό" value="female" />
                </Picker>
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.label}>Ημερομηνία Γέννησης</Text>
                
                <View style={styles.dateControlContainer}>
                  <TouchableOpacity 
                    style={styles.dateAdjustButton}
                    onPress={() => adjustBirthMonth(-1)}
                  >
                    <Text style={styles.dateButtonText}>-1 μήνας</Text>
                  </TouchableOpacity>

                  <TouchableOpacity 
                    style={[styles.dateAdjustButton, styles.todayButton]}
                    onPress={() => setNewAnimal(prev => ({
                      ...prev,
                      birth_date: new Date().toISOString().split('T')[0]
                    }))}
                  >
                    <Text style={[styles.dateButtonText, { color: 'white' }]}>Σήμερα</Text>
                  </TouchableOpacity>

                  <TouchableOpacity 
                    style={styles.dateAdjustButton}
                    onPress={() => adjustBirthMonth(1)}
                  >
                    <Text style={styles.dateButtonText}>+1 μήνας</Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.dateControlContainer}>
                  <TouchableOpacity 
                    style={styles.dateAdjustButton}
                    onPress={() => adjustBirthDate(-1)}
                  >
                    <Text style={styles.dateButtonText}>-1 μέρα</Text>
                  </TouchableOpacity>

                  <Text style={styles.currentDate}>
                    {new Date(newAnimal.birth_date).toLocaleDateString('el-GR')}
                  </Text>

                  <TouchableOpacity 
                    style={styles.dateAdjustButton}
                    onPress={() => adjustBirthDate(1)}
                  >
                    <Text style={styles.dateButtonText}>+1 μέρα</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Στοιχεία Κλουβιού</Text>
          
              <View style={styles.typeButtons}>
                {['breeding', 'expected_pregnancy', 'weaning', 'maintenance'].map((type) => (
                  <TouchableOpacity 
                    key={type}
                    style={[
                      styles.typeButton,
                      selectedType === type && styles.selectedTypeButton
                    ]}
                    onPress={() => handleTypeSelect(type as CageType)}
                  >
                    <Text style={[
                      styles.typeButtonText,
                      selectedType === type && styles.selectedTypeButtonText
                    ]}>
                      {type === 'breeding' ? 'Γέννα' :
                       type === 'expected_pregnancy' ? 'Αναμονή' :
                       type === 'weaning' ? 'Απογαλακτισμός' : 'Συντήρηση'}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {selectedType !== 'maintenance' && (
                <View style={styles.durationContainer}>
                  <TouchableOpacity 
                    style={styles.durationButton}
                    onPress={() => setEventDays(prev => Math.max(1, prev - 1))}
                  >
                    <Text style={styles.durationButtonText}>-</Text>
                  </TouchableOpacity>
                  <Text style={styles.durationText}>{eventDays} μέρες</Text>
                  <TouchableOpacity 
                    style={styles.durationButton}
                    onPress={() => setEventDays(prev => prev + 1)}
                  >
                    <Text style={styles.durationButtonText}>+</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </ScrollView>

          <View style={styles.buttonContainer}>
            <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
              <Text style={styles.buttonText}>Άκυρο</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.addButton, (!newAnimal.species || !newAnimal.strain) && styles.disabledButton]}
              onPress={handleAddAnimal}
              disabled={!newAnimal.species || !newAnimal.strain}
            >
              <Text style={styles.buttonText}>Προσθήκη</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  centeredView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    paddingVertical: 20,
  },
  modalContent: {
    width: '90%',
    maxWidth: 400,
    height: '90%',
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 20,
  },
  scrollView: {
    flex: 1,
    marginBottom: 10,
    width: '100%',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
    textAlign: 'center',
  },
  section: {
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 10,
    marginBottom: 10,
    height: 40,
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    marginBottom: 10,
    backgroundColor: '#fff',
    height: 40,
  },
  picker: {
    height: 40,
  },
  dateInfo: {
    backgroundColor: '#f0f0f0',
    padding: 10,
    borderRadius: 8,
    marginBottom: 10,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#ff6b6b',
    padding: 12,
    borderRadius: 8,
    marginRight: 8,
    height: 45,
  },
  addButton: {
    flex: 1,
    backgroundColor: '#51cf66',
    padding: 12,
    borderRadius: 8,
    marginLeft: 8,
    height: 45,
  },
  disabledButton: {
    opacity: 0.5,
  },
  buttonText: {
    color: 'white',
    textAlign: 'center',
    fontWeight: 'bold',
  },
  typeButtons: {
    flexDirection: 'column',
    gap: 8,
    marginTop: 8,
  },
  typeButton: {
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
    alignItems: 'center',
  },
  selectedTypeButton: {
    backgroundColor: '#4caf50',
  },
  typeButtonText: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  selectedTypeButtonText: {
    color: 'white',
  },
  durationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
    gap: 16,
  },
  durationButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#f0f0f0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  durationButtonText: {
    fontSize: 18,
    color: '#444',
  },
  durationText: {
    fontSize: 16,
    color: '#333',
    minWidth: 80,
    textAlign: 'center',
  },
  dateControlContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 8,
    gap: 8,
  },
  dateAdjustButton: {
    backgroundColor: '#f0f0f0',
    padding: 10,
    borderRadius: 8,
    minWidth: 80,
    alignItems: 'center',
  },
  todayButton: {
    backgroundColor: '#4CAF50',
  },
  currentDate: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    minWidth: 100,
  },
  dateButtonText: {
    fontSize: 14,
    color: '#333',
    textAlign: 'center',
  },
  label: {
    fontSize: 16,
    color: '#333',
    marginBottom: 4,
  },
}); 
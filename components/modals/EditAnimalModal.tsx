import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, Platform, ScrollView, Modal, TextInput, Alert } from 'react-native';
import { Animal, Cage, CageType, Event, CageStatus } from '../../types';
import { Ionicons } from '@expo/vector-icons';
import { format } from 'date-fns';
import { database } from '../../services/database';

interface EditAnimalModalProps {
  visible: boolean;
  cage: Cage;
  onClose: () => void;
  onUpdate: () => void;
  selectedAnimals: Animal[];
  mode: 'preview' | 'addExtra' | 'add';
}

export default function EditAnimalModal({ 
  visible, 
  cage, 
  onClose, 
  onUpdate,
  selectedAnimals,
  mode 
}: EditAnimalModalProps) {
  const [animals, setAnimals] = useState<Animal[]>(selectedAnimals);
  const [event, setEvent] = useState<Event | null>(null);
  const [newAnimal, setNewAnimal] = useState<Partial<Animal>>({
    species: '',
    strain: '',
    sex: 'male',
    birth_date: new Date().toISOString().split('T')[0],
    status: 'active',
  });
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [cageName, setCageName] = useState(cage.notes || '');
  const [isEditing, setIsEditing] = useState(false);

  const [showTransferModal, setShowTransferModal] = useState(false);
  const [selectedAnimalForTransfer, setSelectedAnimalForTransfer] = useState<string | null>(null);
  const [targetCageId, setTargetCageId] = useState<string>('');
  const [availableCagesWithRackNames, setAvailableCagesWithRackNames] = useState<(Cage & { rackName: string })[]>([]);

  useEffect(() => {
    console.log('=== START Loading Animals for Cage ===');
    console.log('Cage:', cage);
    console.log('Cage animalIds:', cage.animalIds);
    
    const loadAnimals = async () => {
      console.log('=== START loadAnimals ===');
      try {
        if (!cage.id) {
          console.error('No cage ID available');
          setAnimals([]);
          return;
        }
    
        console.log('Loading animals for cage:', cage.id);
        // Χρησιμοποιούμε το getAnimalsByCageId (πληθυντικός)
        const loadedAnimals = await database.getAnimalsByCageId(cage.id);
        console.log('Loaded animals:', loadedAnimals);
        
        setAnimals(loadedAnimals || []);
      } catch (error) {
        console.error('Error loading animals:', error);
        Alert.alert('Σφάλμα', 'Δεν ήταν δυνατή η φόρτωση των ζώων');
        setAnimals([]);
      }
      console.log('=== END loadAnimals ===');
    };

    loadAnimals();
  }, [cage.animalIds]);

  useEffect(() => {
    loadEvent();
  }, [cage.id]);

  const loadEvent = async () => {
    try {
      const eventData = await database.getEventByCageId(cage.id);
      setEvent(eventData);
    } catch (error) {
      console.error('Error loading event:', error);
    }
  };
  function generateId(): string {
    return Math.random().toString(36).substring(2) + Date.now().toString(36);
  }
  // Handler για προσθήκη νέου ζώου
  const handleAddAnimal = async () => {
    if (!newAnimal.species || !newAnimal.strain) {
      Alert.alert('Σφάλμα', 'Παρακαλώ συμπληρώστε όλα τα απαραίτητα πεδία');
      return;
    }

    try {
      const animal: Animal = {
        id: generateId(),
        species: newAnimal.species,
        strain: newAnimal.strain,
        sex: newAnimal.sex || 'male',
        birth_date: newAnimal.birth_date || new Date().toISOString().split('T')[0],
        status: 'active',
        cage_id: cage.id
      };

      await database.addAnimal(animal);
      
      const updatedCage = {
        ...cage,
        animalIds: [...(cage.animalIds || []), animal.id],
        status: 'occupied'
      } ;
      
      await database.updateCage(cage.id, updatedCage);
      
      setAnimals(prev => [...prev, animal]);
      
      setNewAnimal({
        species: '',
        strain: '',
        sex: 'male',
        birth_date: new Date().toISOString().split('T')[0],
        status: 'active',
      });

      onUpdate();
      onClose();

    } catch (error) {
      console.error('Error adding animal:', error);
      Alert.alert('Σφάλμα', 'Δεν ήταν δυνατή η προσθήκη του ζώου');
    }
  };
  const handleClearCage = async () => {
    console.log('=== START handleClearCage ===');
    try {
      if (!cage.id) {
        console.error('No cage ID available');
        return;
      }
      
      await database.clearCage(cage.id);
      console.log('Successfully cleared cage');
      onClose();
      onUpdate();
    } catch (error) {
      console.error('Error clearing cage:', error);
      Alert.alert('Σφάλμα', 'Δεν ήταν δυνατή η διαγραφή των δεδομένων');
    }
    console.log('=== END handleClearCage ===');
  };
    
    
 
  // Handler για διαγραφή ζώου
  const handleDeleteAnimal = async (animalId: string) => {
    console.log('=== START handleDeleteAnimal ===');
    console.log('Deleting animal:', animalId);
    console.log('Current cage:', cage);
    
    try {
      if (animals.length === 1) {
        handleClearCage();
        return;
      }
    
      console.log('Updating cage animalIds');
      await database.updateCageNew(cage.id, {
        ...cage,
        animalIds: (cage.animalIds || []).filter(id => id !== animalId)
      });

      console.log('Removing animal from database');
      await database.removeAnimal(animalId);

      console.log('Updating local state');
      setAnimals(prev => prev.filter(animal => animal.id !== animalId));
      
      console.log('Calling onUpdate');
      onUpdate();

      console.log('Animal successfully deleted');
    } catch (error) {
      console.error('Error in handleDeleteAnimal:', error);
      Alert.alert('Σφάλμα', 'Δεν ήταν δυνατή η αφαίρεση του ζώου');
    }
    console.log('=== END handleDeleteAnimal ===');
  };

  // Handler για ενημέρωση event
  const handleUpdateEvent = async (updatedEvent: Partial<Event>) => {
    if (!event?.id) return;
    
    try {
      await database.updateEvent(event.id, updatedEvent);
      await loadEvent();
      onUpdate();
      onClose();

    } catch (error) {
      console.error('Error updating event:', error);
      Alert.alert('Σφάλμα', 'Δεν ήταν δυνατή η ενημέρωση του event');
    }
  };

  // Προσθήκη των συναρτήσεων για χειρισμό ημερομηνιών
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

  // Preview mode UI
  const renderPreviewMode = () => {
    const [isEditing, setIsEditing] = useState(false);
    const [selectedType, setSelectedType] = useState<CageType>(cage.type);
    const [eventDays, setEventDays] = useState(() => {
      // Default days based on current type
      switch (cage.type) {
        case 'expected_pregnancy': return 21;
        case 'breeding': return 3;
        case 'weaning': return 21;
        case 'maintenance': return 0;
        default: return 0;
      }
    });

    // Υπολογισμός υπολοίπου ημερών
    const calculateRemainingDays = () => {
      if (!event?.startDate || !event?.endDate) return null;
      
      const endDate = new Date(event.endDate);
      const today = new Date();
      const diffTime = endDate.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      return diffDays;
    };

    const remainingDays = calculateRemainingDays() || 0;
    
    // Υπολογισμός προόδου
    const calculateProgress = () => {
      if (!event?.startDate || !event?.endDate) return null;
      
      const startDate = new Date(event.startDate);
      const endDate = new Date(event.endDate);
      const today = new Date();
      
      const totalDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
      const passedDays = Math.ceil((today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
      
      return Math.min(Math.max(0, passedDays), totalDays);
    };

    const progress = calculateProgress() ||0;

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

    const handleUpdateCage = async () => {
      console.log('=== START handleUpdateCage ===');
      try {
        const startDate = new Date();
        const endDate = new Date(Date.now() + eventDays * 24 * 60 * 60 * 1000);
        
        const updateData: any = {
          type: selectedType,
          notes: cageName,
          event: {
            startDate: startDate.toISOString().split('T')[0],
            endDate: endDate.toISOString().split('T')[0],
            notificationDate: endDate.toISOString().split('T')[0]
          }
        };
    
        console.log('Updating cage with:', updateData);
    
        await database.updateCageWithEvent(cage.id, updateData);
        
        // Πρώτα βγαίνουμε από το editing mode
        setIsEditing(false);
        
        // Μετά ενημερώνουμε το parent component
        onUpdate();
        onClose();

        console.log('Cage updated successfully');
      } catch (error) {
        console.error('Error updating cage:', error);
        Alert.alert('Σφάλμα', 'Δεν ήταν δυνατή η ενημέρωση του κλουβιού');
      }
      console.log('=== END handleUpdateCage ===');
    };

    return (
      <ScrollView style={styles.scrollContent}>
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Στοιχεία Κλουβιού</Text>
            <TouchableOpacity 
              style={styles.editButton}
              onPress={() => setIsEditing(true)}
            >
              <Ionicons name="pencil" size={20} color="#4caf50" />
            </TouchableOpacity>
          </View>

          <View style={styles.cageInfoContainer}>
            <Text style={styles.cagePosition}>Θέση: {cage.position}</Text>
            <View style={styles.nameInputContainer}>
              {isEditing ? (
                <>
                  <TextInput
                    style={[styles.nameInput]}
                    value={cageName}
                    onChangeText={setCageName}
                    placeholder="Όνομα κλουβιού"
                  />
                  <TouchableOpacity 
                    style={styles.saveNameButton}
                    onPress={handleSaveCageName}
                  >
                    <Text style={styles.saveNameButtonText}>Αποθήκευση</Text>
                  </TouchableOpacity>
                </>
              ) : (
                <>
                  <Text style={[styles.nameInput, styles.nameInputDisabled]}>
                    {cage.notes || 'Χωρίς όνομα'}
                  </Text>
                  <TouchableOpacity 
                    style={styles.editButton}
                    onPress={() => setIsEditing(true)}
                  >
                    <Ionicons name="pencil" size={24} color="#4CAF50" />
                  </TouchableOpacity>
                </>
              )}
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Ζώα στο κλουβί ({animals.length})</Text>
          {animals.map(animal => {
                const birthDate = new Date(animal.birth_date);
                return (
                  <View key={animal.id} style={styles.animalItem}>
                    <View style={styles.animalInfo}>
                      <Text style={styles.animalName}>{animal.species} - {animal.strain}</Text>
                      <Text style={styles.animalDetail}>
                        {animal.sex === 'male' ? 'Αρσενικό' : 'Θηλυκό'} • 
                        Γέννηση: {isNaN(birthDate.getTime()) ? 'Άγνωστη' : format(birthDate, 'dd/MM/yyyy')}
                      </Text>
                    </View>
                    <View style={styles.actionButtons}>
                      <TouchableOpacity 
                        style={[styles.actionButton, { backgroundColor: '#3b82f6' }]}
                        onPress={() => handleTransferAnimal(animal)}
                      >
                        <Ionicons name="arrow-forward-circle-outline" size={20} color="white" />
                      </TouchableOpacity>
                      <TouchableOpacity 
                        style={[styles.actionButton, { backgroundColor: '#ef4444' }]}
                        onPress={() => handleDeleteAnimal(animal.id)}
                      >
                        <Ionicons name="trash-outline" size={20} color="white" />
                      </TouchableOpacity>
                    </View>
                  </View>
                );
              })}
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Τύπος Κλουβιού</Text>
            {!isEditing && (
              <TouchableOpacity 
                style={styles.editButton}
                onPress={() => setIsEditing(true)}
              >
                <Ionicons name="pencil" size={20} color="#4caf50" />
              </TouchableOpacity>
            )}
          </View>

          {!isEditing ? (
            <View style={styles.currentStatus}>
              <Text style={styles.statusType}>
                {cage.type === 'breeding' ? 'Ώρα για ζευγάρωμα' :
                 cage.type === 'expected_pregnancy' ? 'Προγραμματισμένη Γέννα' :
                 cage.type === 'weaning' ? 'Απογαλακτισμός' : 'Συντήρηση'}
              </Text>
              {event && cage.type !== 'maintenance' && (
                <>
                  <View style={styles.progressBar}>
                    <View 
                      style={[
                        styles.progressFill, 
                        { width: `${(progress / eventDays) * 100}%` }
                      ]} 
                    />
                  </View>
                  <View style={styles.eventDetails}>
                    <Text style={styles.eventDate}>
                      Έναρξη: {format(new Date(event.startDate), 'dd/MM/yyyy')}
                    </Text>
                    <Text style={styles.eventDate}>
                      Λήξη: {format(new Date(event.endDate), 'dd/MM/yyyy')}
                    </Text>
                  </View>
                  <Text style={[styles.remainingDays, remainingDays <= 3 && styles.urgentDays]}>
                    {remainingDays > 0 
                      ? `Απομένουν ${remainingDays} ${remainingDays === 1 ? 'μέρα' : 'μέρες'}` 
                      : remainingDays === 0 
                        ? 'Ολοκληρώνεται σήμερα!' 
                        : 'Έχει ολοκηρωθεί'}
                  </Text>
                  <Text style={styles.progressText}>
                    Πρόοδος: {progress} από {eventDays} μέρες
                  </Text>
                </>
              )}
            </View>
          ) : (
            // Edit mode
            <>
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

              <View style={styles.editActions}>
                <TouchableOpacity 
                  style={[styles.actionButton, styles.cancelButton]}
                  onPress={() => setIsEditing(false)}
                >
                  <Text style={styles.buttonText}>Άκυρο</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.actionButton, styles.saveButton]}
                  onPress={handleUpdateCage}
                >
                  <Text style={styles.buttonText}>Αποθήκευση</Text>
                </TouchableOpacity>
              </View>
            </>
          )}
        </View>
        <View style={styles.footer}>
   
      <TouchableOpacity 
        style={[styles.footerButton, styles.deleteButton]} 
        onPress={handleClearCage}
      >
        <Text style={styles.buttonText}>Εκκαθαριση κλουβιου</Text>
      </TouchableOpacity>
      
      
    </View>
      </ScrollView>
    );
  };

  // Add Extra Animal mode UI
  const renderAddExtraMode = () => (
    <ScrollView style={styles.scrollContent}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Προσθήκη Νέου Ζώου</Text>
        
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
          <View style={styles.radioGroup}>
            <TouchableOpacity
              style={[
                styles.radioButton,
                newAnimal.sex === 'male' && styles.radioButtonSelected
              ]}
              onPress={() => setNewAnimal(prev => ({ ...prev, sex: 'male' }))}
            >
              <Text style={styles.radioText}>Αρσενικό</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.radioButton,
                newAnimal.sex === 'female' && styles.radioButtonSelected
              ]}
              onPress={() => setNewAnimal(prev => ({ ...prev, sex: 'female' }))}
            >
              <Text style={styles.radioText}>Θηλυκό</Text>
            </TouchableOpacity>
          </View>
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

        <TouchableOpacity 
          style={styles.addButton}
          onPress={handleAddAnimal}
        >
          <Text style={styles.buttonText}>Προσήκη Ζώου</Text>
        </TouchableOpacity>
      </View>

      {event && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Στοιχεία Event</Text>
          <View style={styles.eventDetails}>
            <Text style={styles.eventType}>
              {
               event.type === 'expected_pregnancy' ? 'Αναμονή' :
               event.type === 'breeding' ? 'Γέννα' :
               event.type === 'weaning' ? 'Απογαλακτισμός' : 'Συντήρηση'}
            </Text>
            <Text style={styles.eventDate}>Έναρξη: {event.startDate}</Text>
            <Text style={styles.eventDate}>Λήξη: {event.endDate}</Text>
          
          </View>
        </View>
      )}
    </ScrollView>
  );

  // Προσθήκη του handleSaveCageName
  const handleSaveCageName = async () => {
    console.log('=== START handleSaveCageName ===');
    try {
      if (!cage.id) {
        throw new Error('No cage ID available');
      }

      await database.updateCageName(cage.id, cageName);
      
      // Ενημέρωση του UI
      onUpdate();
      setIsEditing(false);
      console.log('Successfully saved cage name');
      await onClose();

    } catch (error) {
      console.error('Error updating cage name:', error);
      Alert.alert('Σφάλμα', 'Δεν ήταν δυνατή η αποθήκευση του ονόματος');
    }
  };
  const handleTransferAnimal = async (animalId: Animal) => {
    console.log('=== START handleTransferAnimal ===');
    console.log('Transferring animal with ID:', animalId);
    
    try {
      // Load available cages before showing the modal
      const availableCagesForTransfer = await database.getAvailableCagesForTransfer(cage.rackId, cage.id);
      
      // Get rack names for each cage
      const cagesWithRackNames = await Promise.all(
        availableCagesForTransfer.map(async (cage) => {
          const rack = await database.getRackById(cage.rackId);
          return {
            ...cage,
            rackName: rack?.name || 'Άγνωστο Rack'
          };
        })
      );
      setAvailableCagesWithRackNames(cagesWithRackNames);
      setSelectedAnimalForTransfer(animalId);
      setShowTransferModal(true);
    } catch (error) {
      console.error('Error loading available cages:', error);
      Alert.alert('Σφάλμα', 'Δεν ήταν δυνατή η φόρτωση των διαθέσιμων κλουβιών');
    }
  };

  const executeTransfer = async () => {
    console.log('=== START executeTransfer ===');
    if (!selectedAnimalForTransfer || !targetCageId) {
      Alert.alert('Σφάλμα', 'Παρακαλώ επιλέξτε κλουβί προορισμού');
      return;
    }

    try {
      console.log('Selected animal :', selectedAnimalForTransfer);
      console.log('Current cage :', cage); 
      console.log('Target cage ID:', targetCageId);
      
   

      // Get the animal to verify it exists
      const animal = await database.getAnimal(selectedAnimalForTransfer.id);
      if (!animal) {
        throw new Error('Animal not found in database');
      }
      console.log('Animal to transfer:', animal);
      const count = await database.getAnimalCountForCage(cage.id);
      if (count === 1) { 
        await database.updateCageType(cage.id, 'maintenance');
       }
       const countOfTargetAnimalCage = await database.getAnimalCountForCage(targetCageId);
       if (countOfTargetAnimalCage === 0) { 
        console.log('Count of target animal cage:', targetCageId);
        await database.createNewEventAfterTransfer(targetCageId, 'maintenance');
       }
       await database.updateanimalCageId(selectedAnimalForTransfer.id, targetCageId);

  

        setShowTransferModal(false);
        setSelectedAnimalForTransfer(null);
        setTargetCageId('');
        onUpdate();
        onClose();
        Alert.alert('Επιτυχία', 'Το ζώο μεταφέρθηκε επιτυχώς');
      // }
    } catch (error) {
      console.error('Error transferring animal:', error);
      Alert.alert('Σφάλμα', 'Δεν ήταν δυνατή η μεταφορά του ζώου');
    }
    console.log('=== END executeTransfer ===');
  };

  const handleUpdateCage = async (updateData: Partial<Cage>) => {
    console.log('=== START handleUpdateCage ===');
    try {
      if (!cage.id) {
        throw new Error('No cage ID available');
      }

      await database.updateCage(cage.id, updateData);
      
      // Ενημέρωση του UI
      onUpdate();
      console.log('Successfully updated cage');
    } catch (error) {
      console.error('Error updating cage:', error);
      Alert.alert('Σφάλμα', 'Δεν ήταν δυνατή η ενημέρωση του κλουβιού');
    }
  };

  return (
    <Modal visible={visible} onRequestClose={onClose} animationType="slide">
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>
            {mode === 'preview' ? 'Στοιχεία Κλουβιού' : 'Προσθήκη Ζώου'}
          </Text>
          <TouchableOpacity onPress={onClose}>
            <Ionicons name="close" size={24} color="#666" />
          </TouchableOpacity>
        </View>

        {mode === 'preview' ? renderPreviewMode() : renderAddExtraMode()}

        <View style={styles.footer}>
          <TouchableOpacity 
            style={[styles.footerButton, styles.cancelButton]} 
            onPress={onClose}
          >
            <Text style={styles.buttonText}>Κλείσιμο</Text>
          </TouchableOpacity>
        </View>
        {/* Transfer Modal */}
        <Modal
          visible={showTransferModal}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setShowTransferModal(false)}
        >
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Επιλέξτε κλουβί για μεταφορά</Text>
              
              <ScrollView style={styles.cageList}>
                {availableCagesWithRackNames.map((cage) => (
                  <TouchableOpacity
                    key={cage.id}
                    style={[
                      styles.cageItem,
                      targetCageId === cage.id && styles.selectedCage
                    ]}
                    onPress={() => setTargetCageId(cage.id)}
                  >
                    <Text style={styles.cageText}>
                      Rack: {cage.rackName}{'\n'}
                      Κλουβί: 
                      {cage.position ? ` (${cage.position})` : ` (${cage.notes})`} {cage.notes?`όνομα ${cage.notes}`:''}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={[styles.button, styles.cancelButton]}
                  onPress={() => {
                    setShowTransferModal(false);
                    setTargetCageId('');
                  }}
                >
                  <Text style={styles.buttonText}>Ακύρωση</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.button, styles.confirmButton]}
                  onPress={executeTransfer}
                  disabled={!targetCageId}
                >
                  <Text style={styles.buttonText}>Μεταφορά</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  scrollContent: {
    flex: 1,
    padding: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#2c3e50',
  },
  animalItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    marginBottom: 8,
  },
  animalInfo: {
    flex: 1,
  },
  animalName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#2c3e50',
  },
  animalDetail: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  eventDetails: {
    backgroundColor: '#f8f9fa',
    padding: 16,
    borderRadius: 8,
  },
  eventType: {
    fontSize: 16,
    fontWeight: '500',
    color: '#2c3e50',
    marginBottom: 8,
  },
  eventDate: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  statusButton: {
    padding: 12,
    borderRadius: 6,
    marginTop: 16,
    alignItems: 'center',
  },
  inputContainer: {
    marginBottom: 16,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  radioGroup: {
    flexDirection: 'row',
    gap: 12,
  },
  radioButton: {
    flex: 1,
    padding: 12,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 6,
    alignItems: 'center',
  },
  radioButtonSelected: {
    backgroundColor: '#e8f5e9',
    borderColor: '#4caf50',
  },
  radioText: {
    fontSize: 16,
    color: '#2c3e50',
  },
  addButton: {
    backgroundColor: '#4caf50',
    padding: 14,
    borderRadius: 6,
    alignItems: 'center',
    marginTop: 16,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '500',
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
  currentStatus: {
    padding: 16,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    marginTop: 8,
  },
  statusType: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2c3e50',
    textAlign: 'center',
    marginBottom: 12,
  },
  progressBar: {
    height: 8,
    backgroundColor: '#e0e0e0',
    borderRadius: 4,
    marginVertical: 12,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#4caf50',
    borderRadius: 4,
  },
  remainingDays: {
    fontSize: 16,
    fontWeight: '500',
    color: '#2c3e50',
    textAlign: 'center',
    marginTop: 12,
  },
  urgentDays: {
    color: '#f44336',
  },
  progressText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginTop: 8,
  },
  editActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
    marginTop: 16,
  },
  actionButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  selectedTypeButtonText: {
    color: 'white',
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#eee',
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12
  },
  footerButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center'
  },
  deleteButton: {
    backgroundColor: '#dc3545',
    padding: 8,
  },
  saveButton: {
    backgroundColor: '#28a745',
  },
  cancelButton: {
    backgroundColor: '#6c757d',
  },
  dateButton: {
    backgroundColor: '#f0f0f0',
    padding: 12,
    borderRadius: 8,
    marginTop: 4,
  },
  label: {
    fontSize: 16,
    color: '#333',
    marginBottom: 4,
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
  nameInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  saveNameButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  
  cageInfoContainer: {
    backgroundColor: '#f5f5f5',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  
  cagePosition: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  nameInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: 'white',
  },
  
  nameInputDisabled: {
    backgroundColor: '#f5f5f5',
    borderColor: '#eee',
    color: '#666',
  },
  
  saveNameButton: {
    backgroundColor: '#4CAF50',
    padding: 8,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  editButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#e8f5e9',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    padding: 20,
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    width: '100%',
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 16,
    textAlign: 'center',
  },
  cageList: {
    maxHeight: 300,
  },
  cageItem: {
    padding: 16,
    borderRadius: 8,
    backgroundColor: '#f8f9fa',
    marginBottom: 8,
  },
  selectedCage: {
    backgroundColor: '#e0f2fe',
    borderColor: '#3b82f6',
    borderWidth: 1,
  },
  cageText: {
    fontSize: 16,
    color: '#2c3e50',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
    gap: 12,
  },
  button: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  confirmButton: {
    backgroundColor: '#3b82f6',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
    marginLeft: 8,
  }
});
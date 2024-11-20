import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Alert, Modal, TextInput } from 'react-native';
import { database } from '../../services/database';
import { Animal, Cage } from '../../types';
import { Event } from '../../types';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useFocusEffect } from 'expo-router';
import { useCallback } from 'react';
import { testExpiredEventsNotification } from '../../services/notifications';

export default function ReportsScreen() {
  const [stats, setStats] = useState({ totalAnimals: 0, activeCages: 0 });
  const [animals, setAnimals] = useState<Animal[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [selectedDays, setSelectedDays] = useState(21);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [showAllFutureEvents, setShowAllFutureEvents] = useState(false);
  const [showAllBirthEvents, setShowAllBirthEvents] = useState(false);
  const [showAllGeneralEvents, setShowAllGeneralEvents] = useState(false);
  const [showAllPastGeneralEvents, setShowAllPastGeneralEvents] = useState(false);
  const [racks, setRacks] = useState<Rack[]>([]);
  const [cages, setCages] = useState<Cage[]>([]);


  // Χρήση του useFocusEffect για ανανέωση κάθε φορά που η οθόνη έρχεται στο προσκήνιο
  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [])
  );

  const loadData = async () => {
    try {
      const [statsData, animalsData, eventsData, racksData, cageData] = await Promise.all([
        database.getStats(),
        database.getAllAnimals(),
        database.getAllEvents(),
        database.getAllRacks(),
        database.getAllCages(),

      ]);
      setEvents(eventsData);
      setStats(statsData);
      setAnimals(animalsData);
      setRacks(racksData);
      setCages(cageData);
      console.log(events);
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('el-GR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };
  // Φιλτράρισμα των events που δεν έχουν περάσει
  const futureEvents = events.filter(event => {
    const eventDate = new Date(event.endDate);
    const reason = event.type === 'expected_pregnancy' ? 'Προγραμματισμένη Γέννα' : event.type === 'breeding' ? 'Γέννα' : 'Συντήρηση';
    const now = new Date();
    return eventDate > now;
  });
  const futurebirthEvents = events.filter(event => {
    const eventDate = new Date(event.endDate);
    const reason = event.type === 'expected_pregnancy' ? 'Προγραμματισμένη Γέννα' : event.type === 'breeding' ? 'Γέννα' : 'Συντήρηση';
    const now = new Date();
    return (eventDate < now) && (reason === 'Προγραμματισμένη Γέννα' || reason === 'Γέννα');
  });

  const handleChangeTopregnand = async (event: Event) => {
    try {
      const startDate = new Date();
      const endDate = new Date(startDate);
      endDate.setDate(startDate.getDate() + 21); // 21 μέρες για expected_pregnancy alla 8elw na vazei o xristis timi alla default 

      const updatedEvent = {
        ...event,
        type: 'breeding',
        startDate: startDate.toISOString().split('T')[0],
        endDate: endDate.toISOString().split('T')[0],
        notificationDate: endDate.toISOString().split('T')[0],
        completed: false
      };

      await database.updateEvent(updatedEvent);
      
      // Ανανέωση των δεδομένων
      loadData();
      
      Alert.alert('Επιτυχία', 'Το event ενημερώθηκε σε γέννα');
    } catch (error) {
      console.error('Error updating event:', error);
      Alert.alert('Σφάλμα', 'Δεν ήταν δυνατή η ενημέρωση του event');
    }
  };

  const handleOpenModal = (event: Event) => {
    setSelectedEvent(event);
    setSelectedDays(21); // Default τιμή
    setIsModalVisible(true);
  };

  const handleConfirmChange = async () => {
    if (!selectedEvent) return;
  
    try {
      const startDate = new Date();
      const endDate = new Date(startDate);
      endDate.setDate(startDate.getDate() + selectedDays);
  
      const eventUpdates = {
        type: 'expected_pregnancy',
        startDate: startDate.toISOString().split('T')[0],
        endDate: endDate.toISOString().split('T')[0],
        notificationDate: endDate.toISOString().split('T')[0],
        completed: false
      };
  
      await database.updateEvent(selectedEvent.id, eventUpdates);
      await loadData();
      setIsModalVisible(false);
      Alert.alert('Επιτυχία', 'Το event ενημερώθηκε σε αναμονή');
    } catch (error) {
      console.error('Error updating event:', error);
      Alert.alert('Σφάλμα', 'Δεν ήταν δυνατή η ενημέρωση του event');
    }
  };

  const handleOpenModalForPregnancy = (event: Event) => {
    setSelectedEvent(event);
    setSelectedDays(21); // Default τιμή
    setIsModalVisible(true);
  };

  const handleChangeToMaintenance = async (event: Event) => {
    try {
      const startDate = new Date();
      const endDate = new Date(startDate);

      const eventUpdates = {
        type: 'maintenance',
        startDate: startDate.toISOString().split('T')[0],
        endDate: endDate.toISOString().split('T')[0],
        notificationDate: endDate.toISOString().split('T')[0],
        completed: false
      };

      await database.updateEvent(event.id, eventUpdates);
      loadData();
      Alert.alert('Επιτυχία', 'Το event ενημερώθηκε σε συντήρηση');
    } catch (error) {
      console.error('Error updating event:', error);
      Alert.alert('Σφάλμα', 'Δεν ήταν δυνατή η ενημέρωση του event');
    }
  };

  // Προσθήκη νέου φίλτρου για general events
  const generalEvents = events.filter(event => {
    const eventDate = new Date(event.endDate);
    const now = new Date();
    return event.type === 'general' && !event.completed;
  });

  // Προσθήκη νέου φίλτρου για completed general events
  const pastGeneralEvents = events.filter(event => {
    const eventDate = new Date(event.endDate);
    const now = new Date();
    return event.type === 'general' && eventDate < now && !event.completed;
  });

  // Προσθήκη νέας συνάρτησης για την ολοκλήρωση event
  const handleCompleteEvent = async (event: Event) => {
    try {
      const eventUpdates = {
        ...event,
        completed: true
      };

      await database.updateEvent(event.id, eventUpdates);
      loadData();
      Alert.alert('Επιτυχία', 'Το event ολοκληρώθηκε');
    } catch (error) {
      console.error('Error completing event:', error);
      Alert.alert('Σφάλμα', 'Δεν ήταν δυνατή η ολοκλήρωση του event');
    }
  };

  const handleTestNotification = async () => {
    await testExpiredEventsNotification();
    Alert.alert('Test', 'Η ειδοποίηση θα εμφανιστεί σε 30 δευτερόλεπτα');
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Αναφορές</Text>

        {/* Stats Section */}
        <View style={styles.statsRow}>
          <View style={[styles.statCard, { backgroundColor: '#4f46e5' }]}>
            <Ionicons name="paw" size={24} color="white" />
            <Text style={styles.statNumber}>{stats.totalAnimals}</Text>
            <Text style={styles.statLabel}>Συνολικά Ζώα</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: '#0891b2' }]}>
            <Ionicons name="grid" size={24} color="white" />
            <Text style={styles.statNumber}>{stats.activeCages}</Text>
            <Text style={styles.statLabel}>Ενεργά Κλουβιά</Text>
          </View>
        </View>
        <TouchableOpacity 
                      style={[styles.actionButton, { backgroundColor: '#10b981' }]}
                      onPress={handleTestNotification}
                    >
                      <Text style={styles.actionButtonText}>Test Notification</Text>
                    </TouchableOpacity>

        {/* Events Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="calendar" size={24} color="#374151" />
            <Text style={styles.sectionTitle}>Προγραμματισμνα Events</Text>
          </View>
          {futureEvents.length > 0 ? (
            <>
              {(showAllFutureEvents ? futureEvents : futureEvents.slice(0, 5)).map((event, index) => (
                <View key={index} style={styles.eventCard}>
                  <View style={styles.eventHeader}>
                    <View style={[
                      styles.eventTypeTag, 
                      { backgroundColor: 
                        event.type === 'expected_pregnancy' ? '#818cf8' : 
                        event.type === 'breeding' ? '#4f46e5' :
                        event.type === 'weaning' ? '#0891b2' : 
                        '#374151'
                      }
                    ]}>
                      <Text style={styles.eventTypeText}>
                        {event.type === 'expected_pregnancy' ? 'Αναμονή' : 
                         event.type === 'breeding' ? 'Γέννα' : 
                         event.type === 'weaning' ? 'Απογαλακτισμός' : 
                         'Συντήρηση'}
                      </Text>
                    </View>
                    
                    <Text style={styles.eventDate}>
                      {new Date(event.endDate).toLocaleDateString('el-GR')}
                    </Text>
                  </View>

                  <View style={styles.locationInfo}>
                    <View style={styles.locationItem}>
                      <Ionicons name="grid-outline" size={16} color="#666" />
                      <Text style={styles.locationText}>
                        Rack: {racks.find(r => cages.find(c => c.id === event.cageId)?.rackId === r.id)?.name || 'Άγνωστο'}
                      </Text>
                    </View>
                    <View style={styles.locationItem}>
                      <Ionicons name="cube-outline" size={16} color="#666" />
                      <Text style={styles.locationText}>
                        Κλουβί: {cages.find(c => c.id === event.cageId)?.notes || cages.find(c => c.id === event.cageId)?.position || 'Άγνωστο'}
                      </Text>
                    </View>
                  </View>

                  {event.description && (
                    <Text style={styles.eventDescription}>{event.description}</Text>
                  )}
                </View>
              ))}
              {futureEvents.length > 5 && (
                <TouchableOpacity 
                  style={styles.showMoreButton}
                  onPress={() => setShowAllFutureEvents(!showAllFutureEvents)}
                >
                  <Text style={styles.showMoreButtonText}>
                    {showAllFutureEvents ? 'Λιγότερα' : `Περισσότερα (${futureEvents.length - 5})`}
                  </Text>
                </TouchableOpacity>
              )}
            </>
          ) : (
            <View style={styles.emptyState}>
              <Ionicons name="calendar-outline" size={48} color="#9ca3af" />
              <Text style={styles.emptyText}>Δεν υπάρχουν προγραμματισμένα events</Text>
            </View>
          )}
        </View>

        {/* Birth Events Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="git-branch" size={24} color="#374151" />
            <Text style={styles.sectionTitle}>Ημερομηνίες Γέννας</Text>
          </View>
          {futurebirthEvents.length > 0 ? (
            <>
              {(showAllBirthEvents ? futurebirthEvents : futurebirthEvents.slice(0, 5)).map((event) => (
                <View key={event.id} style={styles.eventCard}>
                  <View style={styles.eventHeader}>
                    <View style={[styles.eventTypeTag, { backgroundColor: '#818cf8' }]}>
                      <Text style={styles.eventTypeText}>
                        {event.type === 'expected_pregnancy' ? 'Αναμονή' : 'Γέννα'}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.locationInfo}>
                    <View style={styles.locationItem}>
                      <Ionicons name="grid-outline" size={16} color="#666" />
                      <Text style={styles.locationText}>
                        Rack: {racks.find(r => cages.find(c => c.id === event.cageId)?.rackId === r.id)?.name || 'Άγνωστο'}
                      </Text>
                    </View>
                    <View style={styles.locationItem}>
                      <Ionicons name="cube-outline" size={16} color="#666" />
                      <Text style={styles.locationText}>
                        Κλουβί: {cages.find(c => c.id === event.cageId)?.notes || cages.find(c => c.id === event.cageId)?.position || 'Άγνωστο'}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.eventDetails}>
                    <Text style={styles.eventDate}>{formatDate(new Date(event.endDate))}</Text>
                    {event.type === 'breeding' && (
                      <TouchableOpacity 
                        style={styles.actionButton}
                        onPress={() => handleOpenModalForPregnancy(event)}
                      >
                        <Text style={styles.actionButtonText}>Αλλαγή σε Αναμονή</Text>
                      </TouchableOpacity>
                    )}
                    {event.type === 'expected_pregnancy' && (
                      <TouchableOpacity 
                        style={[styles.actionButton, { backgroundColor: '#0891b2' }]}
                        onPress={() => handleChangeToMaintenance(event)}
                      >
                        <Text style={styles.actionButtonText}>Αλλαγή σε Συντήρηση</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              ))}
              {futurebirthEvents.length > 5 && (
                <TouchableOpacity 
                  style={styles.showMoreButton}
                  onPress={() => setShowAllBirthEvents(!showAllBirthEvents)}
                >
                  <Text style={styles.showMoreButtonText}>
                    {showAllBirthEvents ? 'Λιγότερα' : `Περισσότερα (${futurebirthEvents.length - 5})`}
                  </Text>
                </TouchableOpacity>
              )}
            </>
          ) : (
            <View style={styles.emptyState}>
              <Ionicons name="paw-outline" size={48} color="#9ca3af" />
              <Text style={styles.emptyText}>Δεν υπάρχουν καταχωρημένες γέννες</Text>
            </View>
          )}
        </View>

        {/* General Events Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="document-text" size={24} color="#374151" />
            <Text style={styles.sectionTitle}>Γενικά Events</Text>
          </View>
          {generalEvents.length > 0 ? (
            <>
              {(showAllGeneralEvents ? generalEvents : generalEvents.slice(0, 5)).map((event) => (
                <View key={event.id} style={styles.eventCard}>
                  <View style={styles.eventHeader}>
                    <View style={[styles.eventTypeTag, { backgroundColor: '#10b981' }]}>
                      <Text style={styles.eventTypeText}>Γενικό</Text>
                    </View>
                  </View>
                  <View style={styles.eventDetails}>
                    <Text style={styles.eventDate}>{formatDate(new Date(event.endDate))}</Text>
                    <Text style={styles.eventTitle}>{event.title}</Text>
                    {event.description && (
                      <Text style={styles.eventDescription}>{event.description}</Text>
                    )}
                  </View>
                </View>
              ))}
              {generalEvents.length > 5 && (
                <TouchableOpacity 
                  style={styles.showMoreButton}
                  onPress={() => setShowAllGeneralEvents(!showAllGeneralEvents)}
                >
                  <Text style={styles.showMoreButtonText}>
                    {showAllGeneralEvents ? 'Λιγότερα' : `Περισσότερα (${generalEvents.length - 5})`}
                  </Text>
                </TouchableOpacity>
              )}
            </>
          ) : (
            <View style={styles.emptyState}>
              <Ionicons name="document-outline" size={48} color="#9ca3af" />
              <Text style={styles.emptyText}>Δεν υπάρχουν γενικά events</Text>
            </View>
          )}
        </View>

        {/* Past General Events Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="time" size={24} color="#374151" />
            <Text style={styles.sectionTitle}>Ειδοποιήσεις Για Γενικά Events</Text>
          </View>
          {pastGeneralEvents.length > 0 ? (
            <>
              {(showAllPastGeneralEvents ? pastGeneralEvents : pastGeneralEvents.slice(0, 5)).map((event) => (
                <View key={event.id} style={styles.eventCard}>
                  <View style={styles.eventHeader}>
                    <View style={[styles.eventTypeTag, { backgroundColor: '#6b7280' }]}>
                      <Text style={styles.eventTypeText}>Ειδοποιήσεις</Text>
                    </View>
                  </View>
                  <View style={styles.eventDetails}>
                    <Text style={styles.eventDate}>{formatDate(new Date(event.endDate))}</Text>
                    <Text style={styles.eventTitle}>{event.title}</Text>
                    {event.description && (
                      <Text style={styles.eventDescription}>{event.description}</Text>
                    )}
                    <TouchableOpacity 
                      style={[styles.actionButton, { backgroundColor: '#10b981' }]}
                      onPress={() => handleCompleteEvent(event)}
                    >
                      <Text style={styles.actionButtonText}>Ολοκλήρωση</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
              {pastGeneralEvents.length > 5 && (
                <TouchableOpacity 
                  style={styles.showMoreButton}
                  onPress={() => setShowAllPastGeneralEvents(!showAllPastGeneralEvents)}
                >
                  <Text style={styles.showMoreButtonText}>
                    {showAllPastGeneralEvents ? 'Λιγότερα' : `Περισσότερα (${pastGeneralEvents.length - 5})`}
                  </Text>
                </TouchableOpacity>
              )}
            </>
          ) : (
            <View style={styles.emptyState}>
              <Ionicons name="checkmark-circle-outline" size={48} color="#9ca3af" />
              <Text style={styles.emptyText}>Δεν υπάρχουν ληγμένα events</Text>
            </View>
          )}
        </View>
      </View>
      <Modal
        visible={isModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setIsModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Επιλογή Ημερών</Text>
            <TextInput
              style={styles.daysInput}
              keyboardType="numeric"
              value={selectedDays.toString()}
              onChangeText={(text) => setSelectedDays(parseInt(text) || 21)}
              placeholder="Αριθμός ημερών"
            />
            <Text style={styles.modalText}>
              Ημερομηνία λήξης: {formatDate(new Date(Date.now() + selectedDays * 24 * 60 * 60 * 1000))}
            </Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setIsModalVisible(false)}
              >
                <Text style={styles.buttonText}>Ακύρωση</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.modalButton, styles.confirmButton]}
                onPress={handleConfirmChange}
              >
                <Text style={styles.buttonText}>Επιβεβαίωση</Text>
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
    backgroundColor: '#f9fafb',
  },
  content: {
    padding: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 24,
    marginTop: 12,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
    gap: 16,
  },
  statCard: {
    flex: 1,
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginVertical: 8,
  },
  statLabel: {
    fontSize: 14,
    color: 'white',
    opacity: 0.9,
  },
  section: {
    marginBottom: 24,
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
  },
  eventCard: {
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  eventHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  eventTypeTag: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 16,
  },
  eventTypeText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '500',
  },
  daysLeft: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '500',
  },
  eventDetails: {
    gap: 8,
  },
  eventDate: {
    fontSize: 15,
    color: '#374151',
    fontWeight: '500',
  },
  eventNotes: {
    fontSize: 14,
    color: '#6b7280',
    fontStyle: 'italic',
  },
  actionButton: {
    backgroundColor: '#4f46e5',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    alignSelf: 'flex-start',
    marginTop: 8,
  },
  actionButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    padding: 24,
    gap: 12,
  },
  emptyText: {
    color: '#9ca3af',
    fontSize: 16,
    textAlign: 'center',
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
  daysInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 10,
    marginBottom: 15,
    fontSize: 16,
  },
  modalText: {
    marginBottom: 15,
    fontSize: 14,
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
  eventTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
    color: '#1f2937',
  },
  eventDescription: {
    fontSize: 14,
    color: '#4b5563',
    marginBottom: 8,
  },
  showMoreButton: {
    alignSelf: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: '#f3f4f6',
    borderRadius: 20,
    marginTop: 10,
    marginBottom: 5,
  },
  showMoreButtonText: {
    color: '#4b5563',
    fontSize: 14,
    fontWeight: '500',
  },
  actionButtonsContainer: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  locationInfo: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
    marginBottom: 4,
  },
  locationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 8,
    gap: 4,
  },
  locationText: {
    fontSize: 13,
    color: '#666',
    fontWeight: '500',
  },
}); 
import React, { useState, useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity, Text } from 'react-native';
import { Calendar as RNCalendar, DateData } from 'react-native-calendars';
import { AddEventModal } from '../../components/modals/AddEventModal';
import { database } from '../../services/database';
import { Event } from '../../types';
import { useFocusEffect } from 'expo-router';
import { useCallback } from 'react';

export default function CalendarScreen() {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [events, setEvents] = useState<Event[]>([]);

  // Φόρτωση events από τη βάση
  const loadEvents = async () => {
    try {
      const allEvents = await database.getAllEvents();
      setEvents(allEvents);
    } catch (error) {
      console.error('Error loading events:', error);
    }
  };

  // Ανανέωση στο focus
  useFocusEffect(
    useCallback(() => {
      loadEvents();
    }, [])
  );

  const handleDayPress = (day: DateData) => {
    setSelectedDate(day.dateString);
    setIsModalVisible(true);
  };

  const handleAddEvent = async (eventData: { 
    title: string; 
    description?: string;
    type: string;
    date: string;
  }) => {
    try {
      const newEvent = {
        title: eventData.title,
        description: eventData.description || '',
        type: 'general',
        date: eventData.date,
        startDate: eventData.date,
        endDate: eventData.date,
        notificationDate: eventData.date,
        completed: false
      };

      await database.addEvent(newEvent);
      await loadEvents(); // Επαναφόρτωση των events
      setIsModalVisible(false);
    } catch (error) {
      console.error('Error adding event:', error);
    }
  };

  // Μετατροπή των events σε μορφή για το calendar
  const markedDates = events.reduce<Record<string, { marked: boolean; dotColor: string }>>((acc, event) => {
    const dateStr = event.startDate;
    return {
      ...acc,
      [dateStr]: { 
        marked: true, 
        dotColor: '#3b82f6'
      }
    };
  }, {});

  return (
    <View style={styles.container}>
      <RNCalendar
        onDayPress={handleDayPress}
        markedDates={markedDates}
        theme={{
          todayTextColor: '#3b82f6',
          selectedDayBackgroundColor: '#3b82f6',
          selectedDayTextColor: '#ffffff',
        }}
      />

      <AddEventModal
        visible={isModalVisible}
        onClose={() => setIsModalVisible(false)}
        onAdd={handleAddEvent}
        initialDate={selectedDate}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
}); 
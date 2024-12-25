import React, { createContext, useContext, useState, useEffect } from 'react';
import { database } from '../services/database';
import { Event } from '../types';

interface EventsContextType {
  events: Event[];
  addEvent: (event: Omit<Event, 'id'>) => Promise<void>;
  deleteEvent: (id: number) => Promise<void>;
  refreshEvents: () => Promise<void>;
}

const EventsContext = createContext<EventsContextType | undefined>(undefined);

export function EventsProvider({ children }: { children: React.ReactNode }) {
  const [events, setEvents] = useState<any[]>([]);

  const loadEvents = async () => {
    try {
      const loadedEvents = await database.getAllEvents();
      // Μετατροπή των ημερομηνιών σε Date objects
      const formattedEvents = loadedEvents.map(event => ({
        ...event,
        date: new Date(event.date)
      }));
      setEvents(formattedEvents);
    } catch (error) {
      console.error('Error loading events:', error);
    }
  };

  useEffect(() => {
    loadEvents();
  }, []);

  const addEvent = async (newEvent: Omit<Event, 'id'>) => {
    try {
      console.log('Adding event:', newEvent); // Debug log
      const event = await database.addEvent(newEvent);
      console.log('Added event:', event); // Debug log
      setEvents((prevEvents: any) => [...prevEvents, event]);
    } catch (error) {
      console.error('Error adding event:', error);
      throw error;
    }
  };

  const deleteEvent = async (id: number) => {
    try {
      setEvents((prevEvents: any[]) => prevEvents.filter(event => event.id !== id));
    } catch (error) {
      console.error('Error deleting event:', error);
      throw error;
    }
  };

  const refreshEvents = async () => {
    await loadEvents();
  };

  return (
    <EventsContext.Provider value={{ events, addEvent, deleteEvent, refreshEvents }}>
      {children}
    </EventsContext.Provider>
  );
}

export function useEvents() {
  const context = useContext(EventsContext);
  if (context === undefined) {
    throw new Error('useEvents must be used within an EventsProvider');
  }
  return context;
} 
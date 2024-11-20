import React, { createContext, useContext, useState, useEffect } from 'react';
import { Alert } from 'react-native';
import { database, Rack } from '../services/database';

interface RacksContextType {
  racks: Rack[];
  loadRacks: (cageId: number) => Promise<void>;
  addRack: (cageId: number, name: string) => Promise<void>;
  deleteRack: (rackId: number) => Promise<void>;
}

const RacksContext = createContext<RacksContextType | undefined>(undefined);

export function RacksProvider({ children }: { children: React.ReactNode }) {
  const [racks, setRacks] = useState<Rack[]>([]);

  const loadRacks = async (cageId: number) => {
    try {
      const loadedRacks = await database.getRacksByCageId(cageId);
      setRacks(loadedRacks);
    } catch (error) {
      Alert.alert('Σφάλμα', 'Αποτυχία φόρτωσης racks');
      console.error(error);
    }
  };

  const addRack = async (cageId: number, name: string) => {
    try {
      const position = racks.length + 1;
      const newRackId = await database.addRack({
        position: position,
        capacity: 10,
        name: name,
        notes: ''
      });
      
      await loadRacks(cageId);
      Alert.alert('Επιτυχία', 'Το rack προστέθηκε');
    } catch (error) {
      Alert.alert('Σφάλμα', 'Αποτυχία προσθήκης rack');
      console.error(error);
    }
  };

  const deleteRack = async (rackId: number) => {
    try {
      await database.deleteRack(rackId);
      setRacks(prev => prev.filter(rack => rack.id !== rackId));
      Alert.alert('Επιτυχία', 'Το rack διαγράφηκε');
    } catch (error) {
      Alert.alert('Σφάλμα', 'Αποτυχία διαγραφής rack');
      console.error(error);
    }
  };

  return (
    <RacksContext.Provider value={{
      racks,
      loadRacks,
      addRack,
      deleteRack
    }}>
      {children}
    </RacksContext.Provider>
  );
}

export const useRacks = () => {
  const context = useContext(RacksContext);
  if (context === undefined) {
    throw new Error('useRacks must be used within a RacksProvider');
  }
  return context;
}; 
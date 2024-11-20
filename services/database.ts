import 'react-native-get-random-values';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import * as SQLite from 'expo-sqlite';
import { Animal, Event, Cage, Rack, EventData, CageType } from '../types';
import { scheduleEventNotification } from './notifications';
import { eventBus } from './eventBus';
import { addDays, format } from 'date-fns';
import { v4 as uuidv4 } from 'uuid';

interface DatabaseInterface {
  getStats(): Promise<{ totalAnimals: number; activeCages: number }>;
  getAllAnimals(): Promise<Animal[]>;
  getAllEvents(): Promise<Event[]>;
  getAllCages(): Promise<Cage[]>;
  getAllRacks(): Promise<Rack[]>;
  addEvent(EventData: any): Promise<number>;
  addAnimal(animal: Omit<Animal, 'id'>): Promise<Animal>;
  addCage(cage: Omit<Cage, 'id'>): Promise<Cage>;
  addRack(rack: Omit<Rack, 'id'>): Promise<Rack>;
  updateAnimal(id: number, animal: Partial<Animal>): Promise<void>;
  updateCageNew(cageId: number, cageData: Partial<Cage>): Promise<void>;
  updateRack(id: number, rack: Partial<Rack>): Promise<void>;
  deleteEvent(id: number): Promise<void>;
  deleteAnimal(id: number): Promise<void>;
  deleteCage(id: number): Promise<void>;
  deleteRack(id: number): Promise<void>;
  getRackById(id: number): Promise<Rack | null>;
  getCagesByRackId(rackId: number): Promise<Cage[]>;
  fixDuplicateRackIds(): Promise<void>;
  getCage(id: number): Promise<Cage | null>;
  getAnimalsByCageId(cageId: number): Promise<Animal[]>;
  updateCage(updatedCage: Cage): Promise<void>;
  getAnimalByCageId(cageId: number): Promise<Animal | null>;
  removeAnimal(animalId: number): Promise<void>;
  addAnimal(animalData: any): Promise<void>;
  getEventsForCage(cageId: number): Promise<Event[]>;
  createCage(rackId: number, position: number): Promise<Cage>;
  initializeCagesForRack(rackId: number, capacity: number): Promise<void>;
  cleanupDuplicateCages(): Promise<void>;
  resetDatabase(): Promise<void>;
  createCageWithEvents(rackId: number, position: number, type: CageType): Promise<Cage>;
  updateCageType(cageId: number, newType: CageType): Promise<void>;
  getCageEvents(cageId: number): Promise<Event[]>;
  getEventByCageId(cageId: number): Promise<Event | null>;
  updateCage(updatedCage: Cage): Promise<void>;
  updateEvent(id: number, eventUpdate: Partial<Event>): Promise<void>;
  getAnimalCountForCage(cageId: string): Promise<number>;
  getExpiredEvents(): Promise<Event[]>;
}

function generateId(): string {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
}

export class Database implements DatabaseInterface {
  private static instance: Database;
  private DB_KEY = 'lab_management_db';
  private db: any = null;

  private constructor() {
    this.initialize().catch(error => 
      console.error('Failed to initialize database:', error)
    );
  }

  public static getInstance(): Database {
    if (!Database.instance) {
      Database.instance = new Database();
    }
    return Database.instance;
  }

  async getAllEvents(): Promise<Event[]> {
    try {
      const db = await this.getDB();
      return db.tables.events || [];
    } catch (error) {
      console.error('Error getting all events:', error);
      return [];
    }
  }

  async getAllCages(): Promise<Cage[]> {
    try {
      const db = await this.getDB();
      return db.tables.cages || [];
    } catch (error) {
      console.error('Error getting all cages:', error);
      return [];
    }
  }

  async getAllAnimals(): Promise<Animal[]> {
    try {
      const db = await this.getDB();
      return db.tables.animals || [];
    } catch (error) {
      console.error('Error getting all animals:', error);
      return [];
    }
  }

  async getStats(): Promise<{ totalAnimals: number; activeCages: number }> {
    try {
      const db = await this.getDB();
      console.log('db.tables');

      console.log(db.tables.cages);

      return {
        totalAnimals: db.tables.animals.length || 0,
        activeCages: db.tables.cages.filter(cage => cage.status === 'occupied').length || 0
      };
    } catch (error) {
      console.error('Error getting stats:', error);
      return {
        totalAnimals: 0,
        activeCages: 0
      };
    }
  }

  private async getDB(): Promise<DatabaseSchema> {
    try {
      const data = await AsyncStorage.getItem('database');
      return data ? JSON.parse(data) : {
        tables: {
          racks: [],
          cages: [],
          animals: [],
          events: []
        }
      };
    } catch (error) {
      console.error('Error getting database:', error);
      throw error;
    }
  }

  private async saveDB(db: DatabaseSchema): Promise<void> {
    try {
      await AsyncStorage.setItem('database', JSON.stringify(db));
    } catch (error) {
      console.error('Error saving database:', error);
      throw error;
    }
  }

  async getCagesByRackId(rackId: string): Promise<Cage[]> {
    try {
      const db = await this.getDB();
      return db.tables.cages
        .filter(c => c.rackId === rackId)
        .sort((a, b) => a.position - b.position);
    } catch (error) {
      console.error('Error getting cages:', error);
      return [];
    }
  }

  async addRack(rack: Omit<Rack, 'id'>): Promise<Rack> {
    try {
      const db = await this.getDB();
      
      if (!db.tables.racks) {
        db.tables.racks = [];
      }

      const newRack = {
        ...rack,
        id: generateId()
      };

      // Προσθήκη του rack
      db.tables.racks.push(newRack);
      
      // Δημιουργία cages για το rack
      if (!db.tables.cages) {
        db.tables.cages = [];
      }

      // Προσθήκη cages για το νέο rack
      for (let i = 1; i <= rack.capacity; i++) {
        const newCage: Cage = {
          id: generateId(),
          rackId: newRack.id,
          position: i,
          status: 'empty',
          type: 'maintenance',
          animalIds: [],
          event_id: null,
          capacity: 8,
          maxEvents: 8,
          notes: null
        };
        db.tables.cages.push(newCage);
      }

      await this.saveDB(db);
      
      console.log('Added new rack:', newRack);
      console.log('Current racks after adding:', db.tables.racks);

      return newRack;
    } catch (error) {
      console.error('Error adding rack:', error);
      throw error;
    }
  }

  async getAllRacks(): Promise<Rack[]> {
    try {
      const db = await this.getDB();
      console.log('Current racks in DB:', db.tables.racks);
      return db.tables.racks || [];
    } catch (error) {
      console.error('Error getting racks:', error);
      return [];
    }
  }

  async addAnimalWithEvent(data: {
    animal: Omit<Animal, 'id'>;
    cage: Cage;
    event?: Omit<Event, 'id'>;
  }): Promise<{ animalId: string; eventId?: string }> {
    try {
      const db = await this.getDB();
      
      // Δημιουργία νέου animal
      const animalId = generateId();
      const newAnimal: Animal = {
        ...data.animal,
        id: animalId,
        cage_id: data.cage.id
      };

      // Προσθήκη του animal στη βάση
      if (!db.tables.animals) {
        db.tables.animals = [];
      }
      db.tables.animals.push(newAnimal);

      // Δημιουργία event αν υπάρχει
      let eventId: string | undefined;
      if (data.event) {
        eventId = generateId();
        const newEvent: Event = {
          ...data.event,
          id: eventId,
          cageId: data.cage.id
        };

        if (!db.tables.events) {
          db.tables.events = [];
        }
        db.tables.events.push(newEvent);
      }

      // Ενημέρωση του cage
      const updatedCage = {
        ...data.cage,
        status: 'occupied',
        animalIds: [...(data.cage.animalIds || []), animalId]
      };

      db.tables.cages = db.tables.cages.map(cage => 
        cage.id === data.cage.id ? updatedCage : cage
      );

      await this.saveDB(db);
      console.log('Added new animal:', newAnimal);
      
      return { animalId, eventId };
    } catch (error) {
      console.error('Error adding animal with event:', error);
      throw error;
    }
  }

  async updateCageWithEvent(cageId: string, data: {
    type: CageType;
    notes?: string;
    event: {
      startDate: string;
      endDate: string;
      notificationDate: string;
    }
  }): Promise<void> {
    console.log('=== START updateCageWithEvent ===', { cageId, data });
    try {
      const db = await this.getDB();
      
      // Βρες το υπάρχον cage
      const cageIndex = db.tables.cages.findIndex(c => c.id === cageId);
      if (cageIndex === -1) {
        throw new Error('Cage not found');
      }

      const existingCage = db.tables.cages[cageIndex];
      
      // Έλεγχος για υπάρχον event
      let eventId = existingCage.event_id;
      let eventIndex = -1;
      
      if (eventId) {
        // Βρες το υπάρχον event
        eventIndex = db.tables.events.findIndex(e => e.id === eventId);
      }

      if (eventIndex !== -1) {
        // Ενημέρωση υπάρχοντος event
        console.log('Updating existing event:', eventId);
        db.tables.events[eventIndex] = {
          ...db.tables.events[eventIndex],
          type: data.type,
          startDate: data.event.startDate,
          endDate: data.event.endDate,
          notificationDate: data.event.notificationDate,
          status: 'active'
        };
      } else {
        // Δημιουργία νέου event μόνο αν δεν υπάρχει
        eventId = generateId();
        console.log('Creating new event:', eventId);
        const newEvent = {
          id: eventId,
          cageId,
          type: data.type,
          startDate: data.event.startDate,
          endDate: data.event.endDate,
          notificationDate: data.event.notificationDate,
          status: 'active'
        };
        db.tables.events.push(newEvent);
      }

      // Ενημέρωση του cage
      db.tables.cages[cageIndex] = {
        ...existingCage,
        type: data.type,
        notes: data.notes || existingCage.notes,
        event_id: eventId,
        status: data.status || 'empty'
      };

      await this.saveDB(db);
      console.log('Successfully updated cage and event');
    } catch (error) {
      console.error('Error updating cage with event:', error);
      throw error;
    }
    console.log('=== END updateCageWithEvent ===');
  }

  async clearCage(cageId: number): Promise<void> {
    try {
      const db = await this.getDB();
      const cage = db.tables.cages.find(c => c.id === cageId);
      
      if (!cage) {
        throw new Error(`Cage with id ${cageId} not found`);
      }

      // 1. Διαγραφή του event
      if (cage.event_id) {
        db.tables.events = db.tables.events.filter(e => e.id !== cage.event_id);
      }

      // 2. Ενημέρωση των ζώων σε ανενεργά
      const cageAnimals = db.tables.animals.filter(a => a.cage_id === cageId);
      cageAnimals.forEach(animal => {
        const animalIndex = db.tables.animals.findIndex(a => a.id === animal.id);
        if (animalIndex !== -1) {
          db.tables.animals[animalIndex] = {
            ...animal,
            status: 'inactive',
            cage_id: null
          };
        }
      });

      // 3. Επαναφορά του cage
      const cageIndex = db.tables.cages.findIndex(c => c.id === cageId);
      db.tables.cages[cageIndex] = {
        ...cage,
        status: 'empty',
        type: 'maintenance',
        event_id: null,
        animalIds: [] // Άδειασμα της λίστας των ζώων
      };

      await this.saveDB(db);
    } catch (error) {
      console.error('Error in clearCage:', error);
      throw error;
    }
  }

  async addEvent(EventData: any): Promise<number> {
    try {
      const db = await this.getDB();
      const event = {
        ...EventData,
        id: this.getNextId('events'),
      };

      if (!db.tables.events) {
        db.tables.events = [];
      }

      db.tables.events.push(event);
      await this.saveDB(db);

      // Στέλνουμε notification για το νέο event
      if (Platform.OS !== 'web') {
        await scheduleEventNotification(event);
      }
      return event.id
    } catch (error) {
      console.error('Error adding event:', error);
      throw error;
    }
  }

  async updateCageWithAnimals(cageId: number, data: {
    animals: Animal[];
    eventUpdate: Partial<Event>;
    cageType: CageType;
  }): Promise<void> {
    try {
      const db = await this.getDB();
      
      // Ενημέρωση του cage
      const cageIndex = db.tables.cages.findIndex(c => c.id === cageId);
      if (cageIndex === -1) throw new Error('Cage not found');

      const cage = db.tables.cages[cageIndex];
      
      // Ενημέρωση των animals
      // Διαγραφή παλιών animals
      db.tables.animals = db.tables.animals.filter(a => a.cage_id !== cageId);
      
      // Προσθήκη νέων animals
      data.animals.forEach(animal => {
        const newAnimal = {
          ...animal,
          cage_id: cageId,
          id: animal.id || this.getNextId('animals')
        };
        db.tables.animals.push(newAnimal);
      });

      // Ενημέρωση του event
      if (cage.event_id) {
        const eventIndex = db.tables.events.findIndex(e => e.id === cage.event_id);
        if (eventIndex !== -1) {
          db.tables.events[eventIndex] = {
            ...db.tables.events[eventIndex],
            ...data.eventUpdate
          };
        }
      }

      // Ενημέρωση του cage
      db.tables.cages[cageIndex] = {
        ...cage,
        type: data.cageType,
        status: data.animals.length > 0 ? 'occupied' : 'empty'
      };

      await this.saveDB(db);
    } catch (error) {
      console.error('Error updating cage with animals:', error);
      throw error;
    }
  }

  async getEventById(eventId: number): Promise<Event | null> {
    try {
      const db = await this.getDB();
      const event = db.tables.events.find(e => e.id === eventId);
      return event || null;
    } catch (error) {
      console.error('Error getting event:', error);
      throw error;
    }
  }

  async addAnimal(animalData: any): Promise<void> {
    try {
      const db = await this.getDB();
      
      // Προσθήκη ζώου
      const animal = {
        id: this.getNextId('animals'),
        ...animalData
      };
      db.tables.animals.push(animal);

      // Δημιουργία event με βάση τον τύπο του κλουβ��ού
      const today = new Date();
      let notificationDate = null;
      
      switch (animalData.cageType) {
        case 'breeding':
          notificationDate = addDays(today, 3);
          break;
        case 'expected_pregnancy':
          notificationDate = addDays(today, 21);
          break;
      }

      // if (notificationDate) {
      //   const event = {

      //     id: this.getNextId('events'),
      //     cageId: animalData.cageId,
      //     type: animalData.cageType,
      //     startDate: format(today, 'yyyy-MM-dd'),
      //     endDate: format(notificationDate, 'yyyy-MM-dd'),
      //     notificationDate: format(notificationDate, 'yyyy-MM-dd'),
      //     completed: false
      //   };
        
      //   db.tables.events.push(event);
     // }

      // Ενημέρωση του cage
      const cageIndex = db.tables.cages.findIndex(c => c.id === animalData.cageId);
      if (cageIndex !== -1) {
        db.tables.cages[cageIndex] = {
          ...db.tables.cages[cageIndex],
          status: 'occupied',
          type: animalData.cageType
        };
      }

      await this.saveDB(db);
    } catch (error) {
      console.error('Error adding animal and event:', error);
      throw error;
    }
  }


  async updateCage(updatedCage: Cage): Promise<void> {
    try {
      const db = await this.getDB();
      
      // Ενημέρωση του cage στη βάση
      db.tables.cages = db.tables.cages.map(cage => 
        cage.id === updatedCage.id ? updatedCage : cage
      );

      await this.saveDB(db);
      console.log('Updated cage:', updatedCage);
    } catch (error) {
      console.error('Error updating cage:', error);
      throw error;
    }
  }

  async addCage(rackId: string): Promise<Cage> {
    console.log('=== START addCage ===');
    try {
      const db = await this.getDB();
      
      // Βρίσκουμε την επόμενη διαθέσιμη θέση
      const position = await this.getNextAvailablePosition(rackId);
      console.log('Got next position:', position);

      // Ελέγχουμε αν υπάρχει ήδη κλουβί στη θέση αυτή
      const existingCage = db.tables.cages.find(
        cage => cage.rackId === rackId && cage.position === position
      );

      if (existingCage) {
        throw new Error(`Cage already exists at position ${position} in rack ${rackId}`);
      }

      // Δημιουργία νέου κλουβιού
      const newCage: Cage = {
        id: generateId(),
        rackId,
        position,
        status: 'empty',
        type: 'maintenance',
        animalIds: [],
        event_id: null,
        capacity: 8,
        maxEvents: 8,
        notes: ''
      };

      // Προσθήκη του νέου κλουβιού
      db.tables.cages.push(newCage);

      // Ενημέρωση του rack
      const rack = db.tables.racks.find(r => r.id === rackId);
      if (rack) {
        rack.capacity = (rack.capacity || 0) + 1;
      }

      await this.saveDB(db);
      console.log('Successfully added new cage:', newCage);
      return newCage;
    } catch (error) {
      console.error('Error adding cage:', error);
      throw error;
    }
  }


  async updateCageNew(cageId: number, cageData: Partial<Cage>): Promise<void> {
    return this.updateCage(cageId, cageData);
  }

  async updateRack(id: number, rackUpdate: Partial<Rack>): Promise<void> {
    try {
      const db = await this.getDB();
      const index = db.tables.racks.findIndex(r => r.id === id);
      if (index !== -1) {
        db.tables.racks[index] = {
          ...db.tables.racks[index],
          ...rackUpdate
        };
        await this.saveDB(db);
      }
    } catch (error) {
      console.error('Web: Error updating rack:', error);
      throw error;
    }
  }

  async fixDuplicateRackIds(): Promise<void> {
    try {
      const db = await this.getDB();
      const seenIds = new Set();
      let nextId = 1;

      // Διόρθωση των IDs των racks
      db.tables.racks = db.tables.racks.map(rack => {
        while (seenIds.has(nextId)) {
          nextId++;
        }
        seenIds.add(nextId);
        
        return {
          ...rack,
          id: nextId++
        };
      });

      // Ενημέρωση των σχετικών cages
      db.tables.cages = db.tables.cages.map(cage => ({
        ...cage,
        rackId: db.tables.racks.find(r => r.name === cage.rackName)?.id || cage.rackId
      }));

      await this.saveDB(db);
      console.log('Fixed duplicate rack IDs');
    } catch (error) {
      console.error('Error fixing duplicate rack IDs:', error);
      throw error;
    }
  }

  async getCage(id: number): Promise<Cage | null> {
    try {
      const db = await this.getDB();
      return db.tables.cages.find(cage => cage.id === id) || null;
    } catch (error) {
      console.error('Error getting cage:', error);
      throw error;
    }
  }

  async getAnimalsByCageId(cageId: string): Promise<Animal[]> {
    try {
      const db = await this.getDB();
      return db.tables.animals.filter(a => a.cage_id === cageId);
    } catch (error) {
      console.error('Error getting animals:', error);
      return [];
    }
  }

  async getRackById(id: string): Promise<Rack | null> {
    try {
      const db = await this.getDB();
      return db.tables.racks.find(r => r.id === id) || null;
    } catch (error) {
      console.error('Error getting rack:', error);
      throw error;
    }
  }

  async getCagesByRackId(rackId: string): Promise<Cage[]> {
    try {
      const db = await this.getDB();
      return db.tables.cages
        .filter(c => c.rackId === rackId)
        .sort((a, b) => a.position - b.position);
    } catch (error) {
      console.error('Error getting cages:', error);
      return [];
    }
  }

  // Βοηθητική μέθοδος για να ελέγξουμε αν υπάρχει το rack
  async checkRackExists(id: number): Promise<boolean> {
    try {
      const db = await this.getDB();
      return db.tables.racks.some(r => r.id === id);
    } catch (error) {
      console.error('Error checking rack existence:', error);
      return false;
    }
  }

  async updateCage(updatedCage: Cage): Promise<void> {
    try {
      const db = await this.getDB();
      const cageIndex = db.tables.cages.findIndex(c => c.id === updatedCage.id);
      
      if (cageIndex === -1) {
        throw new Error(`Cage with id ${updatedCage.id} not found`);
      }

      db.tables.cages[cageIndex] = updatedCage;
      await this.saveDB(db);
    } catch (error) {
      console.error('Error updating cage:', error);
      throw error;
    }
  }

  async getAnimalByCageId(cageId: number): Promise<Animal | null> {
    try {
      const db = await this.getDB();
      return db.tables.animals.find(animal => animal.cage_id === cageId) || null;
    } catch (error) {
      console.error('Error getting animal by cage id:', error);
      throw error;
    }
  }

  async removeAnimal(animalId: number): Promise<void> {
    try {
      const db = await this.getDB();
      db.tables.animals = db.tables.animals.filter(animal => animal.id !== animalId);
      await this.saveDB(db);
    } catch (error) {
      console.error('Error removing animal:', error);
      throw error;
    }
  }

  async getEventsForCage(cageId: number): Promise<Event[]> {
    try {
      const db = await this.getDB();
      return db.tables.events.filter(event => event.cageId === cageId);
    } catch (error) {
      console.error('Error getting events for cage:', error);
      throw error;
    }
  }

  async createCage(rackId: number, position: number): Promise<Cage> {
    try {
      const db = await this.getDB();
      
      // Βρίσκουμε το μεγαλύτερο ID από τα υπάρχοντα cages
      const maxId = Math.max(...db.tables.cages.map(c => c.id), 0);
      
      const newCage: Cage = {
        id: maxId + 1, // Εξασφαλίζουμε μοναδιό ID
        rack_id: rackId,
        position: position,
        number: position,
        status: 'empty',
        type: 'maintenance',
        animalId: null,
        capacity: 8,
        maxEvents: 8,
        notes: null
      };

      // Ελέγχουμε για διπλότυπα
      const existingCage = db.tables.cages.find(
        c => c.rack_id === rackId && c.position === position
      );

      if (existingCage) {
        throw new Error(`Cage already exists at position ${position} in rack ${rackId}`);
      }

      db.tables.cages.push(newCage);
      await this.saveDB(db);
      
      return newCage;
    } catch (error) {
      console.error('Error creating cage:', error);
      throw error;
    }
  }

  async initializeCagesForRack(rackId: number, capacity: number): Promise<void> {
    try {
      const db = await this.getDB();
      const lastCageId = Math.max(...db.tables.cages.map(c => c.id), 0);
      
      const newCages = Array.from({ length: capacity }, (_, index) => ({
        id: lastCageId + index + 1, // Μοναδικό ID για κάθε cage
        rack_id: rackId,
        number: index + 1,
        position: index + 1,
        status: 'empty' as const,
        type: 'maintenance' as const,
        animalId: null,
        capacity: 8,
        maxEvents: 8
      }));

      db.tables.cages.push(...newCages);
      await this.saveDB(db);
    } catch (error) {
      console.error('Error initializing cages:', error);
      throw error;
    }
  }

  // Μέθοδος για να καθαρίσουμε τα διπλότυπα cages
  async cleanupDuplicateCages(): Promise<void> {
    try {
      const db = await this.getDB();
      
      // Κρατάμε μόνο το πρώτο cage για κάθε συνδυασμό rackId και position
      const uniqueCages = Array.from(
        new Map(
          db.tables.cages.map(cage => 
            [`${cage.rack_id}-${cage.position}`, cage]
          )
        ).values()
      );

      // Αναθέτουμε νέα μοναδικά IDs
      const updatedCages = uniqueCages.map((cage, index) => ({
        ...cage,
        id: index + 1
      }));

      db.tables.cages = updatedCages;
      await this.saveDB(db);
    } catch (error) {
      console.error('Error cleaning up duplicate cages:', error);
      throw error;
    }
  }

  private getLastCageId(): number {
    const db = this.getDB();
    return Math.max(...db.tables.cages.map(c => c.id), 0);
  }

  async createRackWithCages(name: string, capacity: number): Promise<Rack> {
    try {
      const db = await this.getDB();
      
      // Δημιουργία του rack
      const newRack: Rack = {
        id: generateId(),
        name,
        position: await this.getNextPosition(),
        capacity,
        notes: ''
      };
      
      // Υπλογισμός του startingCageId
      const lastCageId = db.tables.cages.length > 0 
        ? Math.max(...db.tables.cages.map(c => c.id))
        : 0;
      
      // Δημιουργία των cages με διαδοχικά IDs
      const cages = Array.from({ length: capacity }, (_, index) => ({
        id: generateId(),
        rackId: newRack.id,
        position: index + 1,
        status: 'empty' as const,
        animalId: null,
        type: 'maintenance' as const,
        capacity: 8,
        maxEvents: 8,
        notes: null
      }));

      // Αποθήκευση ση βάση
      db.tables.racks.push(newRack);
      db.tables.cages.push(...cages);
      
      await this.saveDB(db);
      console.log('Created rack with cages:', { rack: newRack, cages });
      
      return newRack;
    } catch (error) {
      console.error('Error creating rack with cages:', error);
      throw error;
    }
  }

  async resetDatabase(): Promise<void> {
    const db = await this.getDB();
    let currentCageId = 1;
    
    // Κρατάμε τα racks αλλά επαναδημιουργούμε τα cages
    const racks = [...db.tables.racks];
    db.tables.cages = [];
    
    // Δημιουργούμε νέα cages με σωστά IDs
    for (const rack of racks) {
      const newCages = Array.from({ length: rack.capacity }, (_, index) => ({
        id: currentCageId + index,
        rackId: rack.id,
        position: index + 1,
        status: 'empty' as const,
        animalId: null,
        type: 'maintenance' as const,
        capacity: 8,
        maxEvents: 8,
        notes: null
      }));
      
      db.tables.cages.push(...newCages);
      currentCageId += rack.capacity;
    }
    
    // Καθαρίζουμε τα σχετικά δεδομένα
    db.tables.animals = [];
    db.tables.events = [];
    
    await this.saveDB(db);
    console.log('Database reset completed');
  }

  async updateEvent(eventId: number, eventUpdates: Partial<Event>): Promise<void> {
    try {
      const db = await this.getDB();
      const eventIndex = db.tables.events.findIndex(e => e.id === eventId);
      
      if (eventIndex === -1) {
        throw new Error(`Event with id ${eventId} not found`);
      }

      // Ενημέρωση του event
      const oldEvent = db.tables.events[eventIndex];
      const updatedEvent = {
        ...oldEvent,
        ...eventUpdates
      };
      db.tables.events[eventIndex] = updatedEvent;

      // Εάν αλλάζει ο τύπος του event, ενημέρωσε και το αντίστοιχο cage
      if (eventUpdates.type && oldEvent.type !== eventUpdates.type) {
        // Βρες το cage που σχετίζεται με αυτό τ event
        const cage = db.tables.cages.find(c => c.event_id === eventId);
        
        if (cage) {
          const cageIndex = db.tables.cages.findIndex(c => c.id === cage.id);
          if (cageIndex !== -1) {
            // Ενημέρωσε τον τύπο του cage
            db.tables.cages[cageIndex] = {
              ...cage,
              type: eventUpdates.type as CageType
            };
          }
        }
      }

      await this.saveDB(db);
      
      // Ενημέρωση των notifications αν χρειάζεται
      if (Platform.OS !== 'web' && eventUpdates.notificationDate) {
        await scheduleEventNotification(updatedEvent);
      }

      // Εκπομπή event για ενημέρωση του UI

    } catch (error) {
      console.error('Error updating event:', error);
      throw error;
    }
  }

  async deleteRackWithRelations(rackId: number): Promise<void> {
    console.log('=== START deleteRackWithRelations ===');
    console.log('Deleting rack and all related data for rackId:', rackId);

    try {
      const db = await this.getDB();

      // 1. Βρίσκουμε όλα τα cages του rack
      const cages = db.tables.cages.filter(cage => cage.rackId === rackId);
      console.log('Found cages to delete:', cages);
      const cageIds = cages.map(cage => cage.id);

      // 2. Βρίσκουμε όλα τα animals που σχετίζονται με αυτά τα cages
      const animalsToDelete = db.tables.animals.filter(animal => 
        cageIds.includes(animal.cage_id) || 
        (animal.rackId === rackId)
      );
      const animalIds = animalsToDelete.map(animal => animal.id);
      console.log('Found animals to delete:', animalIds);

      // 3. Διαγράφουμε όλα τα events που σχετίζονται με το rack ή τα cages
      db.tables.events = db.tables.events.filter(event => 
        event.rackId !== rackId && 
        !cageIds.includes(event.cageId)
      );

      // 4. Διαγράφουμε όλα τα animals
      db.tables.animals = db.tables.animals.filter(animal => 
        !animalIds.includes(animal.id) && 
        !cageIds.includes(animal.cage_id) && 
        animal.rackId !== rackId
      );

      // 5. Διαγράφουμε όλα τα cages του rack
      db.tables.cages = db.tables.cages.filter(cage => 
        cage.rackId !== rackId
      );

      // 6. Διαγράφουμε το rack
      db.tables.racks = db.tables.racks.filter(rack => 
        rack.id !== rackId
      );

      // Αποθήκευση των αλλαγών
      await this.saveDB(db);
      console.log('Successfully deleted rack and all related data');

    } catch (error) {
      console.error('Error in deleteRackWithRelations:', error);
      throw error;
    }
  }

  async deleteCage(cageId: string): Promise<void> {
    console.log('=== START deleteCage ===');
    try {
      const db = await this.getDB();
      
      // Βρίσκουμε το cage για να πάρουμε το rackId
      const cage = db.tables.cages.find(c => c.id === cageId);
      if (!cage) {
        throw new Error('Cage not found');
      }

      // Παίρνουμε το rack για να ενημερώσουμε το capacity
      const rack = db.tables.racks.find(r => r.id === cage.rackId);
      if (!rack) {
        throw new Error('Rack not found');
      }

      // Διαγραφή του cage
      db.tables.cages = db.tables.cages.filter(c => c.id !== cageId);
      
      // Ενημέρωση του capacity του rack
      const updatedRack = {
        ...rack,
        capacity: Math.max(0, rack.capacity - 1)
      };
      
      // Ενημέρωση του rack
      db.tables.racks = db.tables.racks.map(r => 
        r.id === rack.id ? updatedRack : r
      );
      
      // Διαγραφή σχετικών animals και events
      db.tables.animals = db.tables.animals.filter(a => a.cage_id !== cageId);
      db.tables.events = db.tables.events.filter(e => e.cageId !== cageId);
      
      await this.saveDB(db);
      console.log('Deleted cage:', cageId);
      console.log('Updated rack capacity:', updatedRack.capacity);
    } catch (error) {
      console.error('Error deleting cage:', error);
      throw error;
    }
  }

  // Helper method για να ελέγξουμε αν η SQLite είναι έτοιμη
  private async ensureDatabase() {
    if (Platform.OS !== 'web' && !this.db) {
      throw new Error('SQLite database not initialized');
    }
  }

  // Προσθήκη στο constructor ή init method
  async initialize() {
    if (Platform.OS !== 'web') {
      await this.createTables();
    }
  }

  private async createTables() {
    if (Platform.OS !== 'web' && this.db) {
      await new Promise<void>((resolve, reject) => {
        this.db.transaction(tx => {
          tx.executeSql(`
            CREATE TABLE IF NOT EXISTS racks (
              id TEXT PRIMARY KEY,
              name TEXT,
              position INTEGER,
              capacity INTEGER,
              notes TEXT
            )
          `);
          tx.executeSql(`
            CREATE TABLE IF NOT EXISTS cages (
              id TEXT PRIMARY KEY,
              rack_id TEXT,
              position INTEGER,
              status TEXT,
              type TEXT,
              animal_ids TEXT,
              event_id TEXT,
              capacity INTEGER,
              max_events INTEGER,
              notes TEXT
            )
          `);
        }, reject, resolve);
      });
    }
  }

  private async getNextId(tableName: string): Promise<string> {
    try {
      const db = await this.getDB();
      const table = db.tables[tableName] || [];
      
      // Αν ο πίνακας είναι άδειος, επέστρεψε το πρώτο ID
      if (table.length === 0) {
        return Date.now().toString();
      }

      // ρες το μεγαλύτερο ID και πρόσθεσε 1
      const maxId = Math.max(...table.map(item => 
        typeof item.id === 'string' ? parseInt(item.id) : item.id
      ));
      
      return (maxId + 1).toString();
    } catch (error) {
      console.error('Error getting next ID:', error);
      return Date.now().toString(); // Fallback σε timestamp
    }
  }

  async addAnimal(animal: Omit<Animal, 'id'>): Promise<void> {
    try {
      const db = await this.getDB();
      const id = await this.getNextId('animals');
      
      const newAnimal: Animal = {
        ...animal,
        id,
        status: animal.status || 'active'
      };

      db.tables.animals.push(newAnimal);
      await this.saveDB(db);
      
      console.log('Added animal successfully:', newAnimal);
    } catch (error) {
      console.error('Error adding animal:', error);
      throw error;
    }
  }

  async getEventByCageId(cageId: string): Promise<Event | null> {
    try {
      const db = await this.getDB();
      
      // Βρες το cage για να πάρουμε το event_id
      const cage = db.tables.cages.find(c => c.id === cageId);
      if (!cage || !cage.event_id) return null;

      // Βρες το event με βάση το event_id
      const event = db.tables.events.find(e => e.id === cage.event_id);
      return event || null;

    } catch (error) {
      console.error('Error getting event by cage ID:', error);
      return null;
    }
  }

  async getEventsForCage(cageId: string): Promise<Event[]> {
    try {
      const db = await this.getDB();
      return db.tables.events.filter(event => event.cageId === cageId);
    } catch (error) {
      console.error('Error getting events for cage:', error);
      return [];
    }
  }

  async getActiveEventForCage(cageId: string): Promise<Event | null> {
    try {
      const db = await this.getDB();
      return db.tables.events.find(event => 
        event.cageId === cageId && 
        event.status === 'active'
      ) || null;
    } catch (error) {
      console.error('Error getting active event for cage:', error);
      return null;
    }
  }

  async updateCage(cageId: string, updateData: Partial<Cage>): Promise<void> {
    console.log('=== START updateCage ===', { cageId, updateData });
    try {
      const db = await this.getDB();
      
      // Βρες το cage
      const cageIndex = db.tables.cages.findIndex(c => c.id === cageId);
      if (cageIndex === -1) {
        throw new Error(`Cage not found with id: ${cageId}`);
      }

      const existingCage = db.tables.cages[cageIndex];

      // Ενημέρωση του cage διατηρώντας τα υπάρχοντα δεδομένα
      const updatedCage = {
        ...existingCage,
        ...updateData,
        id: cageId, // Διατήρηση του αρχικού ID
        animalIds: updateData.animalIds || existingCage.animalIds || [], // Διατήρηση ή ενημέρωση των animalIds
        status: updateData.status || existingCage.status, // Διατήρηση ή ενημέρωση του status
        type: updateData.type || existingCage.type // Διατήρηση ή ενημέρωση του type
      };

      // Ενημέρωση του cage στη βάση
      db.tables.cages[cageIndex] = updatedCage;

      await this.saveDB(db);
      console.log('Successfully updated cage:', updatedCage);
    } catch (error) {
      console.error('Error updating cage:', error);
      throw error;
    }
    console.log('=== END updateCage ===');
  }

  async updateCageName(cageId: string, newName: string): Promise<void> {
    console.log('=== START updateCageName ===', { cageId, newName });
    try {
      const db = await this.getDB();
      
      const cageIndex = db.tables.cages.findIndex(c => c.id === cageId);
      if (cageIndex === -1) {
        throw new Error(`Cage not found with id: ${cageId}`);
      }

      // Ενημέρωση μόνο του ονόματος
      db.tables.cages[cageIndex] = {
        ...db.tables.cages[cageIndex],
        notes: newName
      };

      await this.saveDB(db);
      console.log('Successfully updated cage name');
    } catch (error) {
      console.error('Error updating cage name:', error);
      throw error;
    }
  }

  async updateCageStatus(cageId: string, status: 'empty' | 'occupied'): Promise<void> {
    try {
      const db = await this.getDB();
      if (!db) throw new Error('Database not initialized');

      const cageIndex = db.tables.cages.findIndex(c => c.id === cageId);
      if (cageIndex === -1) throw new Error('Cage not found');

      // Ενημέρωση μόνο του status
      db.tables.cages[cageIndex] = {
        ...db.tables.cages[cageIndex],
        status
      };

      await this.saveDB(db);
      console.log('Cage status updated successfully');
    } catch (error) {
      console.error('Error updating cage status:', error);
      throw error;
    }
  }

  // Προσθήκη της μεθόδου getNextPosition
  private async getNextPosition(): Promise<number> {
    try {
      const db = await this.getDB();
      const maxPosition = Math.max(...db.tables.racks.map(r => r.position || 0), 0);
      return maxPosition + 1;
    } catch (error) {
      console.error('Error getting next position:', error);
      return 1; // Επιστρέφουμε 1 ως προεπιλογή αν κάτι πάει στραβά
    }
  }

  async getAnimalCountForCage(cageId: string): Promise<number> {
    try {
      const db = await this.getDB();
      // Μετράμε τα ενεργά ζώα στο συγκεκριμένο κλουβί
      const animals = db.tables.animals.filter(
        animal => animal.cage_id === cageId && animal.status !== 'deleted'
      );
      return animals.length;
    } catch (error) {
      console.error('Error getting animal count:', error);
      return 0;
    }
  }

  async deleteAnimal(animalId: string, cageId: string): Promise<void> {
    console.log('=== START deleteAnimal ===');
    try {
      const db = await this.getDB();

      // Διαγραφή του animal
      db.tables.animals = db.tables.animals.filter(a => a.id !== animalId);

      // Ενημέρωση του cage
      const cageIndex = db.tables.cages.findIndex(c => c.id === cageId);
      if (cageIndex !== -1) {
        const cage = db.tables.cages[cageIndex];
        const remainingAnimals = db.tables.animals.filter(a => a.cage_id === cageId);
        
        db.tables.cages[cageIndex] = {
          ...cage,
          status: remainingAnimals.length > 0 ? 'occupied' : 'empty',
          animalIds: remainingAnimals.map(a => a.id)
        };
      }

      await this.saveDB(db);
      console.log('Successfully deleted animal:', animalId);
    } catch (error) {
      console.error('Error deleting animal:', error);
      throw error;
    }
  }

  async getNextAvailablePosition(rackId: string): Promise<number> {
    console.log('=== START getNextAvailablePosition ===');
    try {
      const db = await this.getDB();
      
      // Παίρνουμε όλα τα κλουβιά του συγκεκριμένου rack
      const rackCages = db.tables.cages.filter(cage => cage.rackId === rackId);
      
      if (rackCages.length === 0) {
        console.log('No cages found, returning position 1');
        return 1;
      }

      // Βρίσκουμε όλες τις χρησιμοποιούμενες θέσεις
      const usedPositions = rackCages.map(cage => cage.position).filter(pos => pos !== undefined);
      
      if (usedPositions.length === 0) {
        console.log('No valid positions found, returning position 1');
        return 1;
      }

      // Βρίσκουμε την πρώτη διαθέσι��η θέση
      let position = 1;
      while (usedPositions.includes(position)) {
        position++;
      }

      console.log('Next available position:', position);
      return position;
    } catch (error) {
      console.error('Error getting next position:', error);
      throw error;
    }
  }

  async getExpiredEvents() {
    try {
      const now = new Date().toISOString();
      return await this.db.all(`
        SELECT * FROM events 
        WHERE endDate <e ? 
        AND completed = 0 
        AND type IN ('breeding', 'expected_pregnancy', 'weaning')
      `, [now]);
    } catch (error) {
      console.error('Error getting expired events:', error);
      throw error;
    }
  }
}

interface DatabaseSchema {
  tables: {
    racks: Rack[];
    cages: Cage[];
    animals: Animal[];
    events: Event[];
  };
}

export const database = Database.getInstance();

export { Database };
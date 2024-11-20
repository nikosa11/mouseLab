export interface Rack {
  id: string;
  position: number;
  capacity: number;
  name: string;
  notes?: string;
}

export interface Cage {
  id: string;
  rackId: string;
  position: number;
  capacity: number;
  status: 'empty' | 'occupied';
  type: CageType;
  notes?: string | null;
  maxEvents: number;
  event_id: string | null;
  animalIds: string[];
}

export interface Animal {
  id: string;
  cage_id: string | null;
  species: string;
  strain: string;
  sex: 'male' | 'female';
  birth_date: string;
  status: 'active' | 'inactive';
  notes?: string | null;
}

export type EventType = 'general' | 'breeding' | 'medical' | 'expected_pregnancy' | 'maintenance' | 'weaning';
export type EventStatus = 'pending' | 'success' | 'failed';

export interface EventData {
  title: string;
  description?: string;
  date: string;
  type: EventType;
  status?: EventStatus;
  time?: string;
  cage_id?: number;
  notification_date?: string | null;
}

export interface Event extends EventData {
  id: string;
  notificationId?: string;
  completed: boolean;
  startDate: string;
  endDate: string;
  cageId: string;
}

// Βοηθητικοί τύποι
export type CageType = 'breeding' | 'expected_pregnancy' | 'weaning' | 'maintenance';
export type CageStatus = 'empty' | 'occupied';
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
  number: number;
  capacity: number;
  status: any;
  type: CageType;
  notes?: string | null;
  maxEvents: number;
  event_id: string | null;
  animalIds: string[];
}

export interface Animal {
  id: string;
  cage_id: string ;
  species: string;
  strain: string;
  sex: 'male' | 'female';
  birth_date: any;
  status: 'active' | 'inactive'  | 'deleted';
  notes?: string | null;
}

export type EventType = 'general' | 'breeding' | 'medical' | 'expected_pregnancy' | 'maintenance' | 'weaning';
export type EventStatus = 'pending' | 'success' | 'failed' | 'active' | 'completed';

export interface EventData {
  title: string;
  description?: string;
  date: string;
  type: EventType;
  status?: EventStatus;
  time?: string;
  cage_id?: number;
  notificationDate?: string | null;
}

export interface Event extends EventData {
  details: any;
  rackId: any;
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
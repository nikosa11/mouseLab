export interface Animal {
  id: string;
  species: string;
  birthDate?: Date;
  notes?: string;
}

export interface Cage {
  id: string;
  number: number;
  rackId: string;
  animals: Animal[];
  notes: string;
}

export interface CageData {
  number: string;
  location?: string;
  notes?: string;
} 
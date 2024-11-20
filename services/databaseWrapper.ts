import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export class DatabaseWrapper {
  private static instance: DatabaseWrapper;
  private storage: typeof AsyncStorage | Storage;

  private constructor() {
    this.storage = Platform.OS === 'web' ? localStorage : AsyncStorage;
  }

  static getInstance(): DatabaseWrapper {
    if (!DatabaseWrapper.instance) {
      DatabaseWrapper.instance = new DatabaseWrapper();
    }
    return DatabaseWrapper.instance;
  }

  async getItem(key: string): Promise<string | null> {
    try {
      if (Platform.OS === 'web') {
        return (this.storage as Storage).getItem(key);
      } else {
        return await (this.storage as typeof AsyncStorage).getItem(key);
      }
    } catch (error) {
      console.error('Error getting item:', error);
      return null;
    }
  }

  async setItem(key: string, value: string): Promise<void> {
    try {
      if (Platform.OS === 'web') {
        (this.storage as Storage).setItem(key, value);
      } else {
        await (this.storage as typeof AsyncStorage).setItem(key, value);
      }
    } catch (error) {
      console.error('Error setting item:', error);
      throw error;
    }
  }
} 
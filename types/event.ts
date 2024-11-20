export interface EventData {
  title: string;
  description?: string;
  date: string;
  type: 'general' | 'breeding' | 'medical';
  status?: 'pending' | 'success' | 'failed';
  time?: string;
}

export interface Event extends EventData {
  id: number;
  notificationId?: string;
} 
type EventCallback = (...args: any[]) => void;

class EventBus {
  private listeners: { [key: string]: EventCallback[] } = {};

  subscribe(event: string, callback: EventCallback) {
    if (!this.listeners[event]) {
      this.listeners[event] = [];
    }
    this.listeners[event].push(callback);

    // Επιστρέφουμε μια συνάρτηση για unsubscribe
    return () => {
      this.listeners[event] = this.listeners[event].filter(cb => cb !== callback);
    };
  }

  emit(event: string, ...args: any[]) {
    if (this.listeners[event]) {
      this.listeners[event].forEach(callback => callback(...args));
    }
  }
}

export const eventBus = new EventBus(); 
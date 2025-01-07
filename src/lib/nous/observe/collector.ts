import { Event, EventType } from "@/lib/nous/types/core";
import logger from "@/lib/shared/logger";

export interface EventObserver {
  on_event(event: Event): void | Promise<void>;
}

export class EventCollector {
  private _observers: Map<EventType, Set<EventObserver>>;
  private eventQueue: Event[];
  private processing: boolean;

  constructor() {
    this._observers = new Map();
    this.eventQueue = [];
    this.processing = false;
  }

  register(eventType: EventType, observer: EventObserver): void {
    if (!this._observers.has(eventType)) {
      this._observers.set(eventType, new Set());
    }
    const observers = this._observers.get(eventType)!;
    if (observers.has(observer)) {
      logger.warn("Observer already registered for event type", { eventType });
      return;
    }
    observers.add(observer);
  }

  async collect(event: Event): Promise<void> {
    try {
      this.validateEvent(event);
      this.eventQueue.push({ ...event }); // Clone event to prevent mutations
      
      if (!this.processing) {
        await this.processEvents();
      }
    } catch (error) {
      logger.error("Failed to collect event", { error, event });
      throw error;
    }
  }

  remove(eventType: EventType, observer: EventObserver): void {
    const observers = this._observers.get(eventType);
    if (observers) {
      observers.delete(observer);
      if (observers.size === 0) {
        this._observers.delete(eventType);
      }
    }
  }

  private validateEvent(event: Event): void {
    if (!event || typeof event !== 'object' || Array.isArray(event)) {
      throw new Error('Invalid event: must be an object');
    }

    if (!('type' in event) || typeof event.type !== 'string' || !Object.values(EventType).includes(event.type)) {
      throw new Error('Invalid event: missing or invalid type');
    }

    if (!('timestamp' in event) || !(event.timestamp instanceof Date)) {
      throw new Error('Invalid event: missing or invalid timestamp');
    }

    if (!('data' in event) || typeof event.data !== 'object' || Array.isArray(event.data)) {
      throw new Error('Invalid event: missing or invalid data');
    }
  }

  private async processEvents(): Promise<void> {
    if (this.eventQueue.length === 0) return;

    this.processing = true;
    try {
      while (this.eventQueue.length > 0) {
        const event = this.eventQueue.shift()!;
        const observers = this._observers.get(event.type);

        if (observers) {
          const notificationPromises = Array.from(observers).map(async (observer) => {
            try {
              await Promise.resolve(observer.on_event(event));
            } catch (error) {
              logger.error("Error in observer", { error, event });
            }
          });

          await Promise.all(notificationPromises);
        }
      }
    } catch (error) {
      logger.error("Error processing events", { error });
    } finally {
      this.processing = false;
    }
  }
}

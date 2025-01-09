import logger from "@/lib/shared/logger";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { Event, EventType } from "../types/core";
import { EventCollector, EventObserver } from "./collector";

const createTestEvent = (overrides: Partial<Event> = {}): Event => ({
  type: EventType.SEARCH,
  timestamp: new Date(),
  data: { value: 42 },
  ...overrides,
});

describe("EventCollector", () => {
  let collector: EventCollector;
  const eventType = EventType.SEARCH;
  const mockObserver = {
    on_event: vi.fn(),
  } as unknown as EventObserver;

  beforeEach(() => {
    collector = new EventCollector();
    vi.clearAllMocks();
  });

  describe("observer management", () => {
    it("should register observer", () => {
      collector.register(eventType, mockObserver);
      const observers = (collector as any)._observers.get(eventType);
      expect(observers).toContain(mockObserver);
    });

    it("should not register duplicate observer", async () => {
      collector.register(eventType, mockObserver);
      collector.register(eventType, mockObserver);

      const event = createTestEvent();
      await collector.collect(event);
      expect(mockObserver.on_event).toHaveBeenCalledTimes(1);
    });

    it("should remove observer", () => {
      collector.register(eventType, mockObserver);
      collector.remove(eventType, mockObserver);
      const observers = (collector as any)._observers.get(eventType);
      expect(observers || []).not.toContain(mockObserver);
    });

    it("should handle removing non-registered observer", () => {
      expect(() => collector.remove(eventType, mockObserver)).not.toThrow();
    });

    it("should cleanup empty observer sets", () => {
      collector.register(eventType, mockObserver);
      collector.remove(eventType, mockObserver);
      expect((collector as any)._observers.has(eventType)).toBe(false);
    });

    it("should handle observer removal during event processing", async () => {
      const processingPromise = new Promise<void>((resolve) => {
        setTimeout(resolve, 50);
      });
      const asyncObserver = {
        on_event: vi.fn().mockImplementation(async () => {
          await processingPromise;
        }),
      } as unknown as EventObserver;
      collector.register(eventType, asyncObserver);

      const event = createTestEvent();
      const collectPromise = collector.collect(event);
      collector.remove(eventType, asyncObserver);

      await collectPromise;
      expect(asyncObserver.on_event).toHaveBeenCalledWith(event);
    });

    it("should handle observer registration during event processing", async () => {
      const processingPromise = new Promise<void>((resolve) => {
        setTimeout(resolve, 50);
      });
      const asyncObserver = {
        on_event: vi.fn().mockImplementation(async () => {
          await processingPromise;
        }),
      } as unknown as EventObserver;
      const newObserver = {
        on_event: vi.fn(),
      } as unknown as EventObserver;

      collector.register(eventType, asyncObserver);

      const event1 = createTestEvent();
      const event2 = createTestEvent();

      const collectPromise1 = collector.collect(event1);
      collector.register(eventType, newObserver);
      const collectPromise2 = collector.collect(event2);

      await Promise.all([collectPromise1, collectPromise2]);

      expect(asyncObserver.on_event).toHaveBeenCalledTimes(2);
      expect(newObserver.on_event).toHaveBeenCalledTimes(2);
    });
  });

  describe("event collection", () => {
    beforeEach(() => {
      collector.register(eventType, mockObserver);
    });

    it("should notify observer of event", async () => {
      const event = createTestEvent();
      await collector.collect(event);
      expect(mockObserver.on_event).toHaveBeenCalledWith(event);
    });

    it("should notify multiple observers", async () => {
      const observer2 = {
        on_event: vi.fn(),
      } as unknown as EventObserver;
      collector.register(eventType, observer2);
      const event = createTestEvent();
      await collector.collect(event);
      expect(mockObserver.on_event).toHaveBeenCalledWith(event);
      expect(observer2.on_event).toHaveBeenCalledWith(event);
    });
    it("should handle observer errors", async () => {
      const error = new Error("Test error");
      vi.mocked(mockObserver.on_event).mockImplementation(() => {
        throw error;
      });
      const event = createTestEvent();
      await collector.collect(event);

      expect(mockObserver.on_event).toHaveBeenCalledWith(event);
      expect(logger.error).toHaveBeenCalledWith("Error in observer", {
        error,
        event,
        observer: mockObserver,
      });
    });
  });

  describe("event filtering", () => {
    beforeEach(() => {
      collector.register(eventType, mockObserver);
    });

    it("should filter events by type", async () => {
      const filteredObserver = {
        on_event: vi.fn(),
      } as unknown as EventObserver;
      collector.register(EventType.USER, filteredObserver);

      const event1 = createTestEvent({ type: EventType.USER });
      const event2 = createTestEvent({ type: EventType.SYSTEM });

      await collector.collect(event1);
      await collector.collect(event2);

      expect(filteredObserver.on_event).toHaveBeenCalledTimes(1);
      expect(filteredObserver.on_event).toHaveBeenCalledWith(event1);
    });

    it("should handle multiple event types", async () => {
      const filteredObserver = {
        on_event: vi.fn(),
      } as unknown as EventObserver;
      collector.register(EventType.USER, filteredObserver);
      collector.register(EventType.SYSTEM, filteredObserver);

      const events = [
        createTestEvent({ type: EventType.USER, data: { value: 1 } }),
        createTestEvent({ type: EventType.SYSTEM, data: { value: 2 } }),
        createTestEvent({ type: EventType.SEARCH, data: { value: 3 } }),
      ];

      await Promise.all(events.map((event) => collector.collect(event)));

      expect(filteredObserver.on_event).toHaveBeenCalledTimes(2);
      expect(filteredObserver.on_event).toHaveBeenCalledWith(events[0]);
      expect(filteredObserver.on_event).toHaveBeenCalledWith(events[1]);
    });
  });

  describe("event validation", () => {
    beforeEach(() => {
      collector.register(eventType, mockObserver);
    });

    it("should validate event structure", async () => {
      const invalidEvent = null as unknown as Event;
      await expect(collector.collect(invalidEvent)).rejects.toThrow(
        "Invalid event: must be an object"
      );
    });

    it("should validate event timestamp", async () => {
      const invalidEvent = createTestEvent({ timestamp: "invalid" as any });
      await expect(collector.collect(invalidEvent)).rejects.toThrow(
        "Invalid event: missing or invalid timestamp"
      );
    });

    it("should validate event type", async () => {
      const invalidEvent = createTestEvent({ type: "invalid" as EventType });
      await expect(collector.collect(invalidEvent)).rejects.toThrow(
        "Invalid event: missing or invalid type"
      );
    });

    it("should validate event data structure", async () => {
      const invalidEvent = createTestEvent({ data: "invalid" as any });
      await expect(collector.collect(invalidEvent)).rejects.toThrow(
        "Invalid event: missing or invalid data"
      );
    });

    it("should validate event data is not an array", async () => {
      const invalidEvent = createTestEvent({ data: [] as any });
      await expect(collector.collect(invalidEvent)).rejects.toThrow(
        "Invalid event: missing or invalid data"
      );
    });

    it("should validate missing fields", async () => {
      const invalidEvent = { type: EventType.SEARCH } as Event;
      await expect(collector.collect(invalidEvent)).rejects.toThrow(
        "Invalid event: missing or invalid timestamp"
      );
    });
  });

  describe("event processing", () => {
    beforeEach(() => {
      collector.register(eventType, mockObserver);
    });

    it("should process events in order", async () => {
      const events = Array.from({ length: 5 }, (_, i) =>
        createTestEvent({
          timestamp: new Date(Date.now() + i),
          data: { value: i + 1 },
        })
      );

      await Promise.all(events.map((event) => collector.collect(event)));

      const calls = (mockObserver.on_event as any).mock.calls as Array<[Event]>;
      expect(calls).toHaveLength(5);
      calls.forEach((call, i) => {
        expect(call[0]).toMatchObject(events[i]);
      });
    });

    it("should handle high event frequency", async () => {
      const events = Array.from({ length: 100 }, (_, i) =>
        createTestEvent({
          timestamp: new Date(Date.now() + i),
          data: { value: i + 1 },
        })
      );

      await Promise.all(events.map((event) => collector.collect(event)));
      expect((mockObserver.on_event as any).mock.calls).toHaveLength(100);
      const calls = (mockObserver.on_event as any).mock.calls as Array<[Event]>;
      calls.forEach((call, i) => {
        expect(call[0]).toMatchObject(events[i]);
      });
    });

    it("should maintain event order with async observers", async () => {
      const asyncObserver = {
        on_event: vi.fn().mockImplementation(async (event: Event) => {
          await new Promise((resolve) =>
            setTimeout(resolve, Math.random() * 10)
          );
        }),
      } as unknown as EventObserver;
      collector.register(eventType, asyncObserver);

      const events = Array.from({ length: 5 }, (_, i) =>
        createTestEvent({
          timestamp: new Date(Date.now() + i),
          data: { value: i + 1 },
        })
      );

      await Promise.all(events.map((event) => collector.collect(event)));
      expect((asyncObserver.on_event as any).mock.calls).toHaveLength(5);
    });

    it("should handle concurrent event processing", async () => {
      const processingPromise = new Promise<void>((resolve) => {
        setTimeout(resolve, 50);
      });
      const asyncObserver = {
        on_event: vi.fn().mockImplementation(async () => {
          await processingPromise;
        }),
      } as unknown as EventObserver;
      collector.register(eventType, asyncObserver);

      const event1 = createTestEvent({ data: { value: 1 } });
      const event2 = createTestEvent({ data: { value: 2 } });

      await Promise.all([collector.collect(event1), collector.collect(event2)]);

      expect(asyncObserver.on_event).toHaveBeenCalledTimes(2);
      expect(asyncObserver.on_event).toHaveBeenNthCalledWith(1, event1);
      expect(asyncObserver.on_event).toHaveBeenNthCalledWith(2, event2);
    });

    it("should handle errors during event processing", async () => {
      const error = new Error("Processing error");
      vi.spyOn(logger, "error").mockReturnValue(logger);
      const errorObserver = {
        on_event: vi.fn().mockRejectedValue(error),
      } as unknown as EventObserver;
      collector.register(eventType, errorObserver);

      const event = createTestEvent();
      await collector.collect(event);

      expect(logger.error).toHaveBeenCalledWith("Error in observer", {
        error,
        event,
        observer: errorObserver,
      });
    });

    it("should continue processing after observer error", async () => {
      const errorObserver = {
        on_event: vi.fn().mockRejectedValue(new Error("Error 1")),
      } as unknown as EventObserver;
      const successObserver = {
        on_event: vi.fn(),
      } as unknown as EventObserver;

      collector.register(eventType, errorObserver);
      collector.register(eventType, successObserver);

      const event = createTestEvent();
      await collector.collect(event);

      expect(errorObserver.on_event).toHaveBeenCalledWith(event);
      expect(successObserver.on_event).toHaveBeenCalledWith(event);
    });
  });
});

import { describe, it, expect, vi, beforeEach } from "vitest";
import { SignalRouter, BaseSignalProcessor } from "./signals";
import { Signal, SignalType } from "@prisma/client";

describe("SignalRouter", () => {
  let router: SignalRouter;

  beforeEach(() => {
    router = new SignalRouter();
  });

  describe("route", () => {
    it("should route signals to matching processors", () => {
      const criteria = {
        signal_types: [SignalType.SEARCH],
        min_strength: 0.5,
        max_strength: 1.0,
        required_fields: ["query"],
      };

      router.register_processor("test_processor", criteria);

      const signal: Signal = {
        id: "test_signal",
        type: SignalType.SEARCH,
        timestamp: new Date(),
        metadata: { strength: 0.7 },
        value: { query: "test query" },
        error: null,
        source: "test",
        priority: 1,
        processed: false,
        processedAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        strength: 0.7,
        retries: null,
        manual: false
      };

      const processors = router.route(signal);
      expect(processors).toContain("test_processor");
    });

    it("should not route signals that don't match criteria", () => {
      const criteria = {
        signal_types: [SignalType.SEARCH],
        min_strength: 0.5,
        max_strength: 1.0,
        required_fields: ["query"],
      };

      router.register_processor("test_processor", criteria);

      const signal: Signal = {
        id: "test_signal",
        type: SignalType.FEEDBACK,
        timestamp: new Date(),
        metadata: { strength: 0.3 },
        value: { feedback: "test feedback" },
        error: null,
        source: "test",
        priority: 1,
        processed: false,
        processedAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        strength: 0.3,
        retries: null,
        manual: false
      };

      const processors = router.route(signal);
      expect(processors).not.toContain("test_processor");
    });

    it("should handle custom filter criteria", () => {
      const criteria = {
        signal_types: [SignalType.SEARCH],
        min_strength: 0.5,
        max_strength: 1.0,
        required_fields: ["query"],
        custom_filter: (signal: Signal): boolean => 
          !!signal.value && typeof signal.value === "object" && 
          "query" in signal.value && 
          (signal.value as any).query.length > 5,
      };

      router.register_processor("test_processor", criteria);

      const validSignal: Signal = {
        id: "test_signal_1",
        type: SignalType.SEARCH,
        timestamp: new Date(),
        metadata: { strength: 0.7 },
        value: { query: "long query" },
        error: null,
        source: "test",
        priority: 1,
        processed: false,
        processedAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        strength: 0.7,
        retries: null,
        manual: false
      };

      const invalidSignal: Signal = {
        id: "test_signal_2",
        type: SignalType.SEARCH,
        timestamp: new Date(),
        metadata: { strength: 0.7 },
        value: { query: "short" },
        error: null,
        source: "test",
        priority: 1,
        processed: false,
        processedAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        strength: 0.7,
        retries: null,
        manual: false
      };

      expect(router.route(validSignal)).toContain("test_processor");
      expect(router.route(invalidSignal)).not.toContain("test_processor");
    });
  });

  describe("processor registration", () => {
    it("should register and unregister processors", () => {
      const criteria = {
        signal_types: [SignalType.SEARCH],
        min_strength: 0.5,
        max_strength: 1.0,
        required_fields: ["query"],
      };

      router.register_processor("test_processor", criteria);
      expect(router["_processors"].has("test_processor")).toBe(true);

      router.unregister_processor("test_processor");
      expect(router["_processors"].has("test_processor")).toBe(false);
    });
  });
});

class TestSignalProcessor extends BaseSignalProcessor {
  extract_features(signal: Signal): Record<string, unknown> {
    return {
      test_feature: true,
      signal_type: signal.type,
    };
  }

  detect_patterns(signals: Signal[]) {
    return [];
  }
}

describe("BaseSignalProcessor", () => {
  let processor: TestSignalProcessor;

  beforeEach(() => {
    processor = new TestSignalProcessor("test_processor");
  });

  describe("process_batch", () => {
    it("should process multiple signals in batch", () => {
      const signals: Signal[] = [
        {
          id: "test_signal_1",
          type: SignalType.SEARCH,
          timestamp: new Date(),
          metadata: { priority: 2 },
          value: { query: "test query 1" },
          error: null,
          source: "test",
          priority: 2,
          processed: false,
          processedAt: null,
          createdAt: new Date(),
          updatedAt: new Date(),
          strength: 0.7,
          retries: null,
          manual: false
        },
        {
          id: "test_signal_2",
          type: SignalType.SEARCH,
          timestamp: new Date(),
          metadata: { priority: 1 },
          value: { query: "test query 2" },
          error: null,
          source: "test",
          priority: 1,
          processed: false,
          processedAt: null,
          createdAt: new Date(),
          updatedAt: new Date(),
          strength: 0.7,
          retries: null,
          manual: false
        },
      ];

      const processed = processor.process_batch(signals);
      expect(processed).toHaveLength(2);
      expect(processed[0].id).toContain("proc_");
      expect(processed[0].value).toHaveProperty("features");
      expect(processed[0].metadata).toHaveProperty("processing_time");
    });

    it("should prioritize signals based on priority", () => {
      const signals: Signal[] = [
        {
          id: "test_signal_1",
          type: SignalType.SEARCH,
          timestamp: new Date(),
          metadata: { priority: 1 },
          value: { query: "test query 1" },
          error: null,
          source: "test",
          priority: 1,
          processed: false,
          processedAt: null,
          createdAt: new Date(),
          updatedAt: new Date(),
          strength: 0.7,
          retries: null,
          manual: false
        },
        {
          id: "test_signal_2",
          type: SignalType.SEARCH,
          timestamp: new Date(),
          metadata: { priority: 2 },
          value: { query: "test query 2" },
          error: null,
          source: "test",
          priority: 2,
          processed: false,
          processedAt: null,
          createdAt: new Date(),
          updatedAt: new Date(),
          strength: 0.7,
          retries: null,
          manual: false
        },
      ];

      const processed = processor.process_batch(signals);
      expect(processed[0].id).toContain("test_signal_2"); // Higher priority
      expect(processed[1].id).toContain("test_signal_1"); // Lower priority
    });
  });

  describe("process_signal", () => {
    it("should process a single signal", () => {
      const signal: Signal = {
        id: "test_signal",
        type: SignalType.SEARCH,
        timestamp: new Date(),
        metadata: {},
        value: { query: "test query" },
        error: null,
        source: "test",
        priority: 1,
        processed: false,
        processedAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        strength: 0.7,
        retries: null,
        manual: false
      };

      const processed = processor.process_signal(signal);
      expect(processed.value).toHaveProperty("features");
      expect((processed.value as any).features).toEqual({
        test_feature: true,
        signal_type: SignalType.SEARCH,
      });
    });
  });

  describe("prioritize", () => {
    it("should sort signals by priority", () => {
      const signals: Signal[] = [
        {
          id: "low_priority",
          type: SignalType.SEARCH,
          timestamp: new Date(),
          metadata: { priority: 1 },
          value: {},
          error: null,
          source: "test",
          priority: 1,
          processed: false,
          processedAt: null,
          createdAt: new Date(),
          updatedAt: new Date(),
          strength: 0.7,
          retries: null,
          manual: false
        },
        {
          id: "high_priority",
          type: SignalType.SEARCH,
          timestamp: new Date(),
          metadata: { priority: 3 },
          value: {},
          error: null,
          source: "test",
          priority: 3,
          processed: false,
          processedAt: null,
          createdAt: new Date(),
          updatedAt: new Date(),
          strength: 0.7,
          retries: null,
          manual: false
        },
        {
          id: "medium_priority",
          type: SignalType.SEARCH,
          timestamp: new Date(),
          metadata: { priority: 2 },
          value: {},
          error: null,
          source: "test",
          priority: 2,
          processed: false,
          processedAt: null,
          createdAt: new Date(),
          updatedAt: new Date(),
          strength: 0.7,
          retries: null,
          manual: false
        },
      ];

      const prioritized = processor.prioritize(signals);
      expect(prioritized[0].id).toBe("high_priority");
      expect(prioritized[1].id).toBe("medium_priority");
      expect(prioritized[2].id).toBe("low_priority");
    });

    it("should handle signals without priority metadata", () => {
      const signals: Signal[] = [
        {
          id: "no_priority",
          type: SignalType.SEARCH,
          timestamp: new Date(),
          metadata: {},
          value: {},
          error: null,
          source: "test",
          priority: null,
          processed: false,
          processedAt: null,
          createdAt: new Date(),
          updatedAt: new Date(),
          strength: 0.7,
          retries: null,
          manual: false
        },
        {
          id: "with_priority",
          type: SignalType.SEARCH,
          timestamp: new Date(),
          metadata: { priority: 1 },
          value: {},
          error: null,
          source: "test",
          priority: 1,
          processed: false,
          processedAt: null,
          createdAt: new Date(),
          updatedAt: new Date(),
          strength: 0.7,
          retries: null,
          manual: false
        },
      ];

      const prioritized = processor.prioritize(signals);
      expect(prioritized[0].id).toBe("with_priority");
      expect(prioritized[1].id).toBe("no_priority");
    });
  });
});
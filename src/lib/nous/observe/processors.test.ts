import { describe, it, expect, vi, beforeEach } from "vitest";
import { TimeBasedProcessor, SearchSignalProcessor } from "./processors";
import { Logger } from "@/lib/shared/types";

describe("TimeBasedProcessor", () => {
  let processor: TimeBasedProcessor;
  let mockLogger: Logger;

  beforeEach(() => {
    mockLogger = {
      debug: vi.fn(),
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
      child: vi.fn().mockReturnThis(),
    } as unknown as Logger;

    processor = new TimeBasedProcessor({
      logger: mockLogger,
    });

    // Mock Date.now() to return a fixed timestamp during business hours on a weekday
    vi.spyOn(Date, "now").mockImplementation(() => new Date("2024-01-08T14:00:00").getTime());
  });

  describe("extract_features", () => {
    it("should extract features from a signal", () => {
      const signal = {
        id: "signal1",
        type: "search",
        timestamp: new Date("2024-01-08T14:00:00"),
        metadata: {
          query: "test query",
          results: [1, 2],
          responseTime: 100,
          errors: [],
        },
      };

      const features = processor.extract_features(signal);
      expect(features).toEqual({
        query_length: 10,
        results_count: 2,
        response_time: 100,
        error_count: 0,
        is_weekend: false,
        is_business_hours: true,
      });
    });

    it("should handle missing or invalid values", () => {
      const signal = {
        id: "signal1",
        type: "search",
        timestamp: new Date("2024-01-08T14:00:00"),
        metadata: {},
      };

      const features = processor.extract_features(signal);
      expect(features).toEqual({
        query_length: 0,
        results_count: 0,
        response_time: 0,
        error_count: 0,
        is_weekend: false,
        is_business_hours: true,
      });
    });
  });

  describe("detect_patterns", () => {
    it("should detect patterns from multiple signals", () => {
      const signals = [
        {
          id: "signal1",
          type: "search",
          timestamp: new Date("2024-01-08T14:00:00"),
          metadata: {
            query: "test query 1",
            results: [1, 2],
            responseTime: 100,
            errors: [],
          },
        },
        {
          id: "signal2",
          type: "search",
          timestamp: new Date("2024-01-08T14:05:00"),
          metadata: {
            query: "test query 2",
            results: [1, 2, 3],
            responseTime: 150,
            errors: [],
          },
        },
      ];

      const patterns = processor.detect_patterns(signals);
      expect(patterns.length).toBeGreaterThan(0);
      expect(patterns[0]).toHaveProperty("confidence");
      expect(patterns[0]).toHaveProperty("type", "time_based");
    });

    it("should not detect patterns with insufficient signals", () => {
      const signals = [
        {
          id: "signal1",
          type: "search",
          timestamp: new Date("2024-01-08T14:00:00"),
          metadata: {
            query: "test query",
            results: [1, 2],
            responseTime: 100,
            errors: [],
          },
        },
      ];

      const patterns = processor.detect_patterns(signals);
      expect(patterns.length).toBe(0);
    });
  });
});

describe("SearchSignalProcessor", () => {
  let processor: SearchSignalProcessor;
  let mockLogger: Logger;

  beforeEach(() => {
    mockLogger = {
      debug: vi.fn(),
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
      child: vi.fn().mockReturnThis(),
    } as unknown as Logger;

    processor = new SearchSignalProcessor({
      logger: mockLogger,
    });
  });

  describe("process_signal", () => {
    it("should process search signals", () => {
      const signal = {
        id: "signal1",
        type: "search",
        timestamp: new Date("2024-01-08T14:00:00"),
        metadata: {
          query: "test query",
          results: [1, 2],
          responseTime: 100,
          relevance: 0.8,
        },
      };

      const result = processor.process_signal(signal);
      expect(result).toBeDefined();
      expect(result).toEqual({
        id: "signal1",
        type: "search",
        timestamp: expect.any(Date),
        metadata: {
          query: "test query",
          results: [1, 2],
          responseTime: 100,
          relevance: 0.8,
          features: {
            query_length: 10,
            results_count: 2,
            response_time: 100,
            relevance_score: 0.8,
          },
          patterns: [],
        },
      });
    });

    it("should handle non-search signals", () => {
      const signal = {
        id: "signal1",
        type: "other",
        timestamp: new Date("2024-01-08T14:00:00"),
        metadata: {},
      };

      const result = processor.process_signal(signal);
      expect(result).toBeNull();
    });

    it("should handle processing errors gracefully", () => {
      const signal = {
        id: "signal1",
        type: "search",
        timestamp: new Date("2024-01-08T14:00:00"),
        metadata: null,
      };

      const result = processor.process_signal(signal);
      expect(mockLogger.error).toHaveBeenCalledWith("Failed to process search signal", {
        error: expect.any(String),
        signal: expect.any(Object),
      });
      expect(result).toBeNull();
    });
  });

  describe("extract_features", () => {
    it("should extract search-specific features", () => {
      const signal = {
        id: "signal1",
        type: "search",
        timestamp: new Date("2024-01-08T14:00:00"),
        metadata: {
          query: "test query",
          results: [1, 2],
          responseTime: 100,
          relevance: 0.8,
        },
      };

      const features = processor.extract_features(signal);
      expect(features).toEqual({
        query_length: 10,
        results_count: 2,
        response_time: 100,
        relevance_score: 0.8,
      });
    });

    it("should handle missing metadata", () => {
      const signal = {
        id: "signal1",
        type: "search",
        timestamp: new Date("2024-01-08T14:00:00"),
        metadata: {},
      };

      const features = processor.extract_features(signal);
      expect(features).toEqual({
        query_length: 0,
        results_count: 0,
        response_time: 0,
        relevance_score: 0,
      });
    });

    it("should handle invalid metadata", () => {
      const signal = {
        id: "signal1",
        type: "search",
        timestamp: new Date("2024-01-08T14:00:00"),
        metadata: {
          query: null,
          results: "invalid",
          responseTime: "invalid",
          relevance: "invalid",
        },
      };

      const features = processor.extract_features(signal);
      expect(features).toEqual({
        query_length: 0,
        results_count: 0,
        response_time: 0,
        relevance_score: 0,
      });
    });
  });

  describe("detect_patterns", () => {
    it("should detect search patterns", () => {
      const signals = [
        {
          id: "signal1",
          type: "search",
          timestamp: new Date("2024-01-08T14:00:00"),
          metadata: {
            query: "test query 1",
            results: [1, 2],
            responseTime: 100,
            relevance: 0.8,
          },
        },
        {
          id: "signal2",
          type: "search",
          timestamp: new Date("2024-01-08T14:05:00"),
          metadata: {
            query: "test query 2",
            results: [1, 2, 3],
            responseTime: 150,
            relevance: 0.9,
          },
        },
      ];

      const patterns = processor.detect_patterns(signals);
      expect(patterns.length).toBeGreaterThan(0);
      expect(patterns[0]).toHaveProperty("confidence");
      expect(patterns[0]).toHaveProperty("type", "search_pattern");
    });
  });
});
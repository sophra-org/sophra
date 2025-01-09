import { beforeEach, describe, expect, it, vi } from "vitest";

// Mock modules must be defined before any imports
vi.mock("@lib/shared/database/client", () => {
  const mockPrisma = {
    modelState: {
      findMany: vi.fn().mockResolvedValue([]),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      count: vi.fn(),
      $queryRaw: vi.fn(),
    },
    $transaction: vi.fn().mockImplementation((callback) => {
      if (Array.isArray(callback)) {
        return Promise.resolve(callback.map(operation => operation));
      }
      return callback(mockPrisma);
    }),
  };
  return { prisma: mockPrisma };
});

vi.mock("@lib/shared/logger", () => ({
  default: {
    error: vi.fn(),
    info: vi.fn(),
  },
}));

// Import after mocks
import { ModelType } from "@prisma/client";
import { NextRequest } from "next/server";
import { GET, POST } from "./route";
import { prisma } from "@lib/shared/database/client";

// Type assertion to help TypeScript understand the mock functions
const mockModelState = prisma.modelState as unknown as {
  findMany: ReturnType<typeof vi.fn>;
  findFirst: ReturnType<typeof vi.fn>;
  create: ReturnType<typeof vi.fn>;
  update: ReturnType<typeof vi.fn>;
  delete: ReturnType<typeof vi.fn>;
  count: ReturnType<typeof vi.fn>;
  $queryRaw: ReturnType<typeof vi.fn>;
};

const mockTransaction = prisma.$transaction as unknown as ReturnType<typeof vi.fn>;

describe("Search Patterns Route Handler", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("GET /api/nous/learn/search-patterns", () => {
    it("should fetch patterns with default parameters", async () => {
      const now = new Date();
      const mockPatterns = [{
        id: "1",
        modelType: ModelType.PATTERN_DETECTOR,
        featureNames: ["query1"],
        versionId: "v1",
        weights: [0.1, 0.2],
        bias: 0.5,
        scaler: { mean: [0], std: [1] },
        hyperparameters: { learning_rate: 0.01 },
        isTrained: true,
        currentEpoch: 10,
        trainingProgress: 1,
        lastTrainingError: null,
        createdAt: now.toISOString(),
        updatedAt: now.toISOString(),
        metrics: [{
          modelVersionId: "metrics-1",
          accuracy: 0.9,
          precision: 0.85,
          recall: 0.88,
          f1Score: 0.86,
          latencyMs: 100,
          loss: 0.1,
          timestamp: now.toISOString(),
          validationMetrics: {
            pattern_confidence: 0.8,
            searchType: "exact",
            adaptationRulesApplied: 1
          }
        }]
      }];

      mockModelState.findMany.mockResolvedValue(mockPatterns);

      const request = new NextRequest(
        "http://localhost:3000/api/nous/learn/search-patterns"
      );
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual({
        success: true,
        data: mockPatterns,
        metadata: {
          count: mockPatterns.length,
          query: "",
          limit: 10,
          offset: 0,
        },
      });
    });

    it("should handle database errors gracefully", async () => {
      mockModelState.findMany.mockRejectedValue(new Error("DB Error"));

      const request = new NextRequest(
        "http://localhost:3000/api/nous/learn/search-patterns"
      );
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data).toEqual({
        success: false,
        error: "Failed to search patterns",
      });
    });
  });

  describe("POST /api/nous/learn/search-patterns", () => {
    it("should create patterns with valid data", async () => {
      const now = new Date();
      const mockResponse = {
        id: "pattern-1",
        modelType: ModelType.PATTERN_DETECTOR,
        featureNames: ["test query"],
        versionId: `pattern_${now.getTime()}_abc123`,
        weights: [0],
        bias: 0,
        scaler: {},
        isTrained: true,
        hyperparameters: {},
        currentEpoch: 0,
        trainingProgress: 1,
        metrics: [{
          modelVersionId: `metrics_${now.getTime()}_abc123`,
          accuracy: 0.8,
          precision: 0,
          recall: 0,
          f1Score: 0,
          latencyMs: 50,
          loss: 0,
          validationMetrics: {
            pattern_confidence: 0.8,
            searchType: "exact",
            adaptationRulesApplied: 1
          },
          timestamp: now.toISOString()
        }]
      };

      mockTransaction.mockResolvedValueOnce([mockResponse]);

      const request = new NextRequest(
        "http://localhost:3000/api/nous/learn/search-patterns"
      );
      request.json = vi.fn().mockResolvedValue({
        patterns: [{
          query: "test query",
          timestamp: new Date().toISOString(),
          metadata: {
            relevantHits: 8,
            totalHits: 10,
            took: 50,
            adaptationRulesApplied: 1,
            searchType: "exact",
            facetsUsed: true,
            source: "test"
          }
        }]
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toMatchObject({
        success: true,
        data: mockResponse,
        metadata: {
          processedCount: 1,
          processingTime: expect.any(Number),
          timestamp: expect.any(String)
        }
      });
    });

    it("should reject invalid pattern data", async () => {
      const request = new NextRequest(
        "http://localhost:3000/api/nous/learn/search-patterns"
      );
      request.json = vi.fn().mockResolvedValue({
        patterns: [
          {
            query: "", // Invalid - empty query
            timestamp: "invalid-date", // Invalid date format
          },
        ],
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data).toEqual({
        success: false,
        error: "Invalid request format",
        details: expect.any(Object),
        received: expect.any(Object)
      });
    });
  });
});

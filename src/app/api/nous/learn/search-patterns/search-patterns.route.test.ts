import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import logger from '@lib/shared/logger';

// Mock modules
vi.mock('@lib/shared/logger', () => ({
  default: {
    error: vi.fn(),
    info: vi.fn()
  }
}));

vi.mock('next/server', () => ({
  NextRequest: vi.fn().mockImplementation((url) => ({
    url,
    nextUrl: new URL(url),
    headers: new Headers(),
    json: vi.fn()
  })),
  NextResponse: {
    json: vi.fn().mockImplementation((data, init) => ({
      status: init?.status || 200,
      ok: init?.status ? init.status >= 200 && init.status < 300 : true,
      headers: new Headers(),
      json: async () => data
    }))
  }
}));

vi.mock('@prisma/client', () => ({
  ModelType: {
    PATTERN_DETECTOR: "PATTERN_DETECTOR",
    CLASSIFIER: "CLASSIFIER",
    EMBEDDER: "EMBEDDER",
    GENERATOR: "GENERATOR"
  },
  Prisma: {
    ModelType: {
      PATTERN_DETECTOR: "PATTERN_DETECTOR",
      CLASSIFIER: "CLASSIFIER",
      EMBEDDER: "EMBEDDER",
      GENERATOR: "GENERATOR"
    },
    raw: true, // Enable raw query support
  },
  PrismaClient: vi.fn(() => ({
    model: vi.fn(),
    $queryRaw: vi.fn(),
    $transaction: vi.fn()
  }))
}));

vi.mock('@lib/shared/database/client', () => ({
  prisma: {
    modelState: {
      findMany: vi.fn().mockResolvedValue([]),
      findFirst: vi.fn().mockResolvedValue(null),
      create: vi.fn().mockResolvedValue({}),
      update: vi.fn().mockResolvedValue({}),
      delete: vi.fn().mockResolvedValue({}),
      count: vi.fn().mockResolvedValue(0),
      $queryRaw: vi.fn().mockResolvedValue([]),
      $executeRaw: vi.fn().mockResolvedValue(0)
    },
    $transaction: vi.fn().mockImplementation(async (callback) => {
      try {
        return await callback({
          modelState: {
            findMany: vi.fn().mockResolvedValue([]),
            findFirst: vi.fn().mockResolvedValue(null),
            create: vi.fn().mockResolvedValue({}),
            update: vi.fn().mockResolvedValue({}),
            delete: vi.fn().mockResolvedValue({}),
            count: vi.fn().mockResolvedValue(0),
            $queryRaw: vi.fn().mockResolvedValue([]),
            $executeRaw: vi.fn().mockResolvedValue(0)
          }
        });
      } catch (error) {
        throw error;
      }
    })
  }
}));

// Import after mocks
import { prisma } from '@lib/shared/database/client';
import { GET, POST } from './route';

describe("Search Patterns Route Handler", () => {
  const ModelType = {
    PATTERN_DETECTOR: "PATTERN_DETECTOR"
  } as const;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("GET /api/nous/learn/search-patterns", () => {
    it("should fetch patterns with default parameters", async () => {
      const mockPatterns = [
        {
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
          createdAt: new Date(),
          updatedAt: new Date(),
          metrics: {
            training: {
              accuracy: 0.9,
              precision: 0.85,
              recall: 0.88,
              f1Score: 0.86,
              loss: 0.1
            },
            inference: {
              latencyMs: 100
            }
          },
        },
      ];

      vi.mocked(prisma.modelState.findMany).mockResolvedValue(mockPatterns);

      const request = new NextRequest(
        "http://localhost:3000/api/nous/learn/search-patterns"
      );
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toEqual(mockPatterns);
      expect(data.meta).toEqual({
        total: mockPatterns.length,
        page: 1,
        limit: 10
      });
    });

    it("should handle database errors gracefully", async () => {
      vi.mocked(prisma.modelState.findMany).mockRejectedValue(
        new Error("DB Error")
      );

      const request = new NextRequest(
        "http://localhost:3000/api/nous/learn/search-patterns"
      );
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error).toEqual({
        message: "Failed to search patterns",
        code: "INTERNAL_SERVER_ERROR"
      });
    });
  });

  describe("POST /api/nous/learn/search-patterns", () => {
    it("should create patterns with valid data", async () => {
      const mockPatterns = {
        patterns: [
          {
            query: "test query",
            timestamp: new Date().toISOString(),
            metadata: {
              relevantHits: 8,
              totalHits: 10,
              took: 100,
              adaptationRulesApplied: 2,
              searchType: "semantic",
              facetsUsed: true,
              source: "web",
            },
          },
        ],
      };

      const mockResponse = [
        {
          id: "1",
          modelType: ModelType.PATTERN_DETECTOR,
          featureNames: ["test query"],
          versionId: expect.any(String),
          weights: [0],
          bias: 0,
          scaler: {},
          isTrained: true,
          hyperparameters: {},
          currentEpoch: 0,
          trainingProgress: 1,
          metrics: {
            training: {
              accuracy: 0.8,
              precision: 0,
              recall: 0,
              f1Score: 0,
              loss: 0,
            },
            inference: {
              latencyMs: 100
            }
          },
        },
      ];

      vi.mocked(prisma.$transaction).mockResolvedValue(mockResponse);

      const request = new NextRequest(
        "http://localhost:3000/api/nous/learn/search-patterns"
      );
      request.json = vi.fn().mockResolvedValue(mockPatterns);

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toEqual(mockResponse);
    });

    it("should reject invalid pattern data", async () => {
      const invalidPatterns = {
        patterns: [
          {
            query: "test query",
          },
        ],
      };

      const request = new NextRequest(
        "http://localhost:3000/api/nous/learn/search-patterns"
      );
      request.json = vi.fn().mockResolvedValue(invalidPatterns);

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toBe("Invalid request format");
    });
  });
});

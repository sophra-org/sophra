import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { NextRequest } from "next/server";
import prisma from "@/lib/shared/database/client";
import { GET, POST } from "./route";

vi.mock("@prisma/client", () => ({
  ModelType: {
    PATTERN_DETECTOR: "PATTERN_DETECTOR",
  },
  Prisma: {
    ModelStateWhereInput: {},
  },
}));

vi.mock("@/lib/shared/database/client", () => ({
  default: {
    modelState: {
      findMany: vi.fn(),
      create: vi.fn(),
    },
    $transaction: vi.fn(),
  },
}));

vi.mock("@/lib/shared/logger", () => ({
  default: {
    error: vi.fn(),
    info: vi.fn(),
  },
}));

vi.mock("next/server", () => ({
  NextRequest: class MockNextRequest {
    url: string;
    method: string;
    headers: Headers;
    private body: any;

    constructor(url: string, init?: { method?: string; body?: string }) {
      this.url = url;
      this.method = init?.method || 'GET';
      this.headers = new Headers();
      this.body = init?.body ? JSON.parse(init.body) : undefined;
    }

    async json() {
      return this.body;
    }
  },
  NextResponse: {
    json: (data: any, init?: { status?: number }) => ({
      status: init?.status || (data.success === false ? 500 : 200),
      ok: init?.status ? init.status >= 200 && init.status < 300 : true,
      headers: new Headers({ 'content-type': 'application/json' }),
      json: () => Promise.resolve(data)
    })
  },
}));

describe("Search Patterns Route Handler", () => {
  const ModelType = {
    PATTERN_DETECTOR: "PATTERN_DETECTOR",
  } as const;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
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
          metrics: [
            {
              accuracy: 0.9,
              precision: 0.85,
              recall: 0.88,
              f1Score: 0.86,
              latencyMs: 100,
              loss: 0.1,
            },
          ],
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
      expect(data.metadata.limit).toBe(10);
    });

    it("should handle query filtering", async () => {
      const mockPatterns = [
        {
          id: "1",
          modelType: ModelType.PATTERN_DETECTOR,
          featureNames: ["specific_query"],
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
          metrics: [
            {
              accuracy: 0.9,
              precision: 0.85,
              recall: 0.88,
              f1Score: 0.86,
              latencyMs: 100,
              loss: 0.1,
            },
          ],
        },
      ];

      vi.mocked(prisma.modelState.findMany).mockResolvedValue(mockPatterns);

      const request = new NextRequest(
        "http://localhost:3000/api/nous/learn/search-patterns?query=specific_query"
      );
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toEqual(mockPatterns);
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
      expect(data.error).toBe("Failed to search patterns");
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
            accuracy: 0.8,
            precision: 0,
            recall: 0,
            f1Score: 0,
            latencyMs: 100,
            loss: 0,
          },
        },
      ];

      vi.mocked(prisma.$transaction).mockResolvedValue(mockResponse);

      const request = new NextRequest(
        "http://localhost:3000/api/nous/learn/search-patterns",
        {
          method: "POST",
          body: JSON.stringify(mockPatterns),
        }
      );

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
        "http://localhost:3000/api/nous/learn/search-patterns",
        {
          method: "POST",
          body: JSON.stringify(invalidPatterns),
        }
      );

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toBe("Invalid request format");
    });
  });
}); 
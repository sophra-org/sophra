import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { NextRequest } from "next/server";
import prisma from "@/lib/shared/database/client";
import { GET, POST } from "./route";
import { ModelType } from "@prisma/client";

vi.mock("next/server", () => {
  return {
    NextResponse: {
      json: (data: any, init?: { status?: number }) => ({
        status: init?.status || 200,
        ok: init?.status ? init.status >= 200 && init.status < 300 : true,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: () => Promise.resolve(data)
      })
    },
    NextRequest: class MockNextRequest {
      url: string;
      headers: Headers;
      constructor(url: string) {
        this.url = url;
        this.headers = new Headers();
      }
      json() {
        return Promise.resolve({});
      }
    }
  };
});

vi.mock("@/lib/shared/database/client", () => ({
  default: {
    modelConfig: {
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

vi.mock("@prisma/client", () => ({
  ModelType: {
    PATTERN_DETECTOR: "PATTERN_DETECTOR",
    FEEDBACK_CLASSIFIER: "FEEDBACK_CLASSIFIER",
    RELEVANCE_RANKER: "RELEVANCE_RANKER",
    ENGAGEMENT_PREDICTOR: "ENGAGEMENT_PREDICTOR",
  },
}));

describe("Models Route Handler", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe("GET /api/nous/learn/models", () => {
    it("should fetch models with their latest versions", async () => {
      const mockModels = [
        {
          id: "1",
          type: ModelType.PATTERN_DETECTOR,
          modelVersions: [{
            artifactPath: "path/to/artifact",
            metrics: { accuracy: 0.95 },
            createdAt: new Date("2023-01-01")
          }]
        }
      ];

      vi.mocked(prisma.modelConfig.findMany).mockResolvedValueOnce(mockModels);

      const request = new NextRequest("http://localhost:3000/api/nous/learn/models");
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toEqual([{
        id: "1",
        type: ModelType.PATTERN_DETECTOR,
        isTrained: true,
        trainingProgress: 0,
        lastTrainingError: null,
        metrics: { accuracy: 0.95 },
        createdAt: mockModels[0].modelVersions[0].createdAt,
        updatedAt: mockModels[0].modelVersions[0].createdAt
      }]);
      expect(data.metadata).toBeDefined();
      expect(data.metadata.count).toBe(1);

      expect(prisma.modelConfig.findMany).toHaveBeenCalledWith({
        include: {
          modelVersions: {
            orderBy: { createdAt: "desc" },
            take: 1,
          },
        },
      });
    });

    it("should handle database errors gracefully", async () => {
      vi.mocked(prisma.modelConfig.findMany).mockRejectedValueOnce(new Error("DB Error"));

      const request = new NextRequest("http://localhost:3000/api/nous/learn/models");
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error).toBe("Failed to fetch models");
    });
  });

  describe("POST /api/nous/learn/models", () => {
    it("should create a new model with valid data", async () => {
      const mockModel = {
        name: "Test Model",
        type: ModelType.PATTERN_DETECTOR,
        hyperparameters: { learning_rate: 0.01 },
        features: ["feature1", "feature2"],
        trainingParams: { epochs: 100 }
      };

      const mockCreatedModel = {
        id: "1",
        type: ModelType.PATTERN_DETECTOR,
        modelVersions: [{
          metrics: {},
          artifactPath: "",
          parentVersion: null,
          createdAt: new Date("2023-01-01")
        }]
      };

      vi.mocked(prisma.modelConfig.create).mockResolvedValueOnce(mockCreatedModel);

      const request = new NextRequest("http://localhost:3000/api/nous/learn/models");
      Object.defineProperty(request, 'json', {
        value: () => Promise.resolve(mockModel)
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toEqual({
        id: mockCreatedModel.id,
        type: mockCreatedModel.type,
        isTrained: false,
        trainingProgress: 0,
        createdAt: mockCreatedModel.modelVersions[0].createdAt,
        updatedAt: mockCreatedModel.modelVersions[0].createdAt
      });
    });

    it("should reject invalid model data", async () => {
      const invalidModel = {
        type: "INVALID_TYPE",
        features: "not_an_array"
      };

      const request = new NextRequest("http://localhost:3000/api/nous/learn/models");
      Object.defineProperty(request, 'json', {
        value: () => Promise.resolve(invalidModel)
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toBe("Invalid request format");
    });

    it("should handle database errors during creation", async () => {
      const mockModel = {
        type: ModelType.PATTERN_DETECTOR,
        name: "Test Model",
        hyperparameters: { learning_rate: 0.01 },
        features: ["feature1", "feature2"]
      };

      vi.mocked(prisma.modelConfig.create).mockRejectedValueOnce(new Error("DB Error"));

      const request = new NextRequest("http://localhost:3000/api/nous/learn/models");
      Object.defineProperty(request, 'json', {
        value: () => Promise.resolve(mockModel)
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error).toBe("Failed to create model");
    });
  });
}); 
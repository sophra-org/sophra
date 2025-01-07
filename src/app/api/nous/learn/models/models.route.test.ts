import { mockPrisma } from "~/vitest.setup";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { NextRequest } from "next/server";
import { GET, POST } from "./route";
import { ModelType } from "@prisma/client";
import { MockRequest } from "@/lib/test/next-server.mock";
import { MockNextRequest } from "@/app/api/cortex/search/__mocks__/next-server";

vi.mock('@prisma/client', () => ({
  ModelType: {
    PATTERN_DETECTOR: "PATTERN_DETECTOR",
  }
}));

vi.mock('@/lib/shared/database/client', () => ({
  default: mockPrisma
}));

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
    NextRequest: class MockNextRequest extends Request {
      nextUrl = new URL("http://localhost:3000");
      cookies = new Map();
      geo = {};
      ip = "";
      constructor(url: string) {
        super(url);
      }
      json() {
        return Promise.resolve({});
      }
    }
  };
});

vi.mock("@/lib/shared/logger", () => ({
  default: {
    error: vi.fn(),
    info: vi.fn(),
  },
}));

describe("Learning Models Route Handler", () => {
  const mockModel = {
    id: "test-1",
    type: "PATTERN_DETECTOR" as const,
    features: ["feature1", "feature2"],
    hyperparameters: {
      learningRate: 0.01,
      epochs: 100
    },
    trainingParams: {
      batchSize: 32,
      optimizer: "adam"
    },
    modelVersions: [{
      artifactPath: "models/v1",
      metrics: { accuracy: 0.95 },
      createdAt: new Date()
    }]
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("GET /api/nous/learn/models", () => {
    it("should fetch models with default parameters", async () => {
      vi.mocked(mockPrisma.modelConfig.findMany).mockResolvedValueOnce([mockModel]);
      vi.mocked(mockPrisma.modelConfig.count).mockResolvedValueOnce(1);
      const request = new MockNextRequest("http://localhost:3000/api/nous/learn/models") as unknown as NextRequest;
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toEqual([mockModel]);
      expect(data.meta).toEqual({
        total: 1,
        page: 1,
        pageSize: 10
      });
    });

    it("should fetch models with their latest versions", async () => {
      const mockModels = [{
        id: "1",
        type: ModelType.PATTERN_DETECTOR,
        hyperparameters: { learning_rate: 0.01 },
        features: ["feature1"],
        trainingParams: { epochs: 100 },
        modelVersions: [{
          artifactPath: "path/to/artifact",
          metrics: { accuracy: 0.95 },
          createdAt: new Date("2023-01-01")
        }]
      }];

      vi.mocked(mockPrisma.modelConfig.findMany).mockResolvedValueOnce(mockModels);

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

      expect(mockPrisma.modelConfig.findMany).toHaveBeenCalledWith({
        include: {
          modelVersions: {
            orderBy: { createdAt: "desc" },
            take: 1,
          },
        },
      });
    });

    it("should handle database errors gracefully", async () => {
      vi.mocked(mockPrisma.modelConfig.findMany).mockRejectedValueOnce(new Error("DB Error"));

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
      const mockCreatedModel = {
        id: "1",
        type: ModelType.PATTERN_DETECTOR,
        hyperparameters: { learning_rate: 0.01 },
        features: ["feature1"],
        trainingParams: { epochs: 100 },
        modelVersions: [{
          metrics: {},
          artifactPath: "",
          parentVersion: null,
          createdAt: new Date("2023-01-01")
        }]
      };

      vi.mocked(mockPrisma.modelConfig.create).mockResolvedValueOnce(mockCreatedModel);

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
      vi.mocked(mockPrisma.modelConfig.create).mockRejectedValueOnce(new Error("DB Error"));

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
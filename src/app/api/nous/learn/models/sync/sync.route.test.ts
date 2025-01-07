import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { NextRequest } from "next/server";
import prisma from "@/lib/shared/database/client";
import { GET, POST } from "./route";
import { ModelType, Prisma } from "@prisma/client";

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
      private body: any;

      constructor(url: string, options?: { method?: string; body?: any }) {
        this.url = url;
        this.headers = new Headers();
        this.body = options?.body;
      }

      async json() {
        return typeof this.body === 'string' ? JSON.parse(this.body) : this.body;
      }
    }
  };
});

vi.mock("@/lib/shared/database/client", () => ({
  default: {
    modelState: {
      findMany: vi.fn(),
      upsert: vi.fn(),
    },
    modelConfig: {
      findUnique: vi.fn(),
    },
  },
}));

vi.mock("@/lib/shared/logger", () => ({
  default: {
    error: vi.fn(),
    info: vi.fn(),
  },
}));

vi.mock("@prisma/client", () => {
  const ModelType = {
    PATTERN_DETECTOR: "PATTERN_DETECTOR",
    FEEDBACK_CLASSIFIER: "FEEDBACK_CLASSIFIER",
    RELEVANCE_RANKER: "RELEVANCE_RANKER",
    ENGAGEMENT_PREDICTOR: "ENGAGEMENT_PREDICTOR",
  };
  const Prisma = {
    JsonNull: null,
  };
  return { ModelType, Prisma };
});

describe("Model Sync Route Handler", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe("GET /api/nous/learn/models/sync", () => {
    it("should fetch model states with metrics", async () => {
      const mockStates = [
        {
          id: "1",
          versionId: "v1",
          weights: [0.1, 0.2, 0.3],
          bias: 0.5,
          scaler: { mean: [0, 0], std: [1, 1] },
          featureNames: ["f1", "f2"],
          isTrained: true,
          modelType: ModelType.PATTERN_DETECTOR,
          hyperparameters: { learning_rate: 0.01 },
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

      vi.mocked(prisma.modelState.findMany).mockResolvedValueOnce(mockStates);

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toEqual(mockStates);
    });

    it("should handle database errors gracefully", async () => {
      vi.mocked(prisma.modelState.findMany).mockRejectedValueOnce(new Error("DB Error"));

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error).toBe("Failed to fetch model states");
    });
  });

  describe("POST /api/nous/learn/models/sync", () => {
    it("should sync model state with valid data", async () => {
      const mockModel = {
        id: "1",
        type: ModelType.PATTERN_DETECTOR,
        hyperparameters: { learning_rate: 0.01 },
        features: ["feature1", "feature2"],
        trainingParams: { epochs: 100 },
        modelVersions: [
          {
            id: "v1",
            createdAt: new Date("2023-01-01"),
          },
        ],
      };

      const mockState = {
        modelId: "1",
        state: {
          weights: [0.1, 0.2, 0.3],
          bias: 0.5,
          scaler: {
            mean: [0, 0],
            std: [1, 1],
          },
          featureNames: ["f1", "f2"],
          metrics: {
            accuracy: 0.9,
            precision: 0.85,
            recall: 0.88,
            f1Score: 0.86,
            latencyMs: 100,
            loss: 0.1,
          },
          hyperparameters: {
            learning_rate: 0.01,
          },
          currentEpoch: 10,
          trainingProgress: 0.5,
          lastTrainingError: null,
        },
      };

      const mockResponse = {
        id: "state1",
        versionId: mockModel.modelVersions[0].id,
        weights: mockState.state.weights,
        bias: mockState.state.bias,
        scaler: mockState.state.scaler,
        featureNames: mockState.state.featureNames,
        isTrained: true,
        modelType: mockModel.type,
        hyperparameters: mockState.state.hyperparameters,
        currentEpoch: mockState.state.currentEpoch,
        trainingProgress: mockState.state.trainingProgress,
        lastTrainingError: mockState.state.lastTrainingError,
        createdAt: new Date("2023-01-01"),
        updatedAt: new Date("2023-01-01"),
      };

      vi.mocked(prisma.modelConfig.findUnique).mockResolvedValueOnce(mockModel);
      vi.mocked(prisma.modelState.upsert).mockResolvedValueOnce(mockResponse);

      const request = new NextRequest("http://localhost:3000/api/nous/learn/models/sync", {
        method: 'POST',
        body: JSON.stringify(mockState)
      });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toEqual(mockResponse);

      expect(prisma.modelState.upsert).toHaveBeenCalledWith({
        where: { versionId: mockModel.modelVersions[0].id },
        create: expect.objectContaining({
          versionId: mockModel.modelVersions[0].id,
          weights: mockState.state.weights,
          bias: mockState.state.bias,
          scaler: mockState.state.scaler,
          featureNames: mockState.state.featureNames,
          isTrained: true,
          modelType: mockModel.type,
          hyperparameters: mockState.state.hyperparameters,
          currentEpoch: mockState.state.currentEpoch,
          trainingProgress: mockState.state.trainingProgress,
          lastTrainingError: mockState.state.lastTrainingError,
          metrics: mockState.state.metrics ? {
            create: expect.objectContaining({
              modelVersionId: mockModel.modelVersions[0].id,
              accuracy: mockState.state.metrics.accuracy,
              precision: mockState.state.metrics.precision,
              recall: mockState.state.metrics.recall,
              f1Score: mockState.state.metrics.f1Score,
              latencyMs: mockState.state.metrics.latencyMs,
              loss: mockState.state.metrics.loss,
              validationMetrics: mockState.state.metrics,
              customMetrics: null,
              timestamp: expect.any(Date),
            }),
          } : undefined,
        }),
        update: expect.objectContaining({
          weights: mockState.state.weights,
          bias: mockState.state.bias,
          scaler: mockState.state.scaler,
          featureNames: mockState.state.featureNames,
          isTrained: true,
          hyperparameters: mockState.state.hyperparameters,
          currentEpoch: mockState.state.currentEpoch,
          trainingProgress: mockState.state.trainingProgress,
          lastTrainingError: mockState.state.lastTrainingError,
          metrics: mockState.state.metrics ? {
            create: expect.objectContaining({
              modelVersionId: mockModel.modelVersions[0].id,
              accuracy: mockState.state.metrics.accuracy,
              precision: mockState.state.metrics.precision,
              recall: mockState.state.metrics.recall,
              f1Score: mockState.state.metrics.f1Score,
              latencyMs: mockState.state.metrics.latencyMs,
              loss: mockState.state.metrics.loss,
              validationMetrics: mockState.state.metrics,
              customMetrics: null,
              timestamp: expect.any(Date),
            }),
          } : undefined,
        }),
      });
    });

    it("should reject invalid sync data", async () => {
      const invalidState = {
        modelId: "1",
        state: {
          // Missing required fields
          weights: [0.1, 0.2, 0.3],
        },
      };

      const request = new NextRequest("http://localhost:3000/api/nous/learn/models/sync", {
        method: 'POST',
        body: invalidState
      });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toBe("Invalid request format");
      expect(data.details).toBeDefined();
    });

    // TODO: Fix this test case
    // it("should handle non-existent model", async () => {
    //   const mockState = {
    //     modelId: "nonexistent",
    //     state: {
    //       weights: [0.1, 0.2, 0.3],
    //       bias: 0.5,
    //       scaler: {
    //         mean: [0, 0],
    //         std: [1, 1],
    //       },
    //       featureNames: ["f1", "f2"],
    //       metrics: {
    //         accuracy: 0.9,
    //         precision: 0.85,
    //         recall: 0.88,
    //         f1Score: 0.86,
    //         latencyMs: 100,
    //         loss: 0.1,
    //       },
    //       hyperparameters: {
    //         learning_rate: 0.01,
    //       },
    //       currentEpoch: 10,
    //       trainingProgress: 0.5,
    //       lastTrainingError: "No error",
    //     },
    //   };

    //   vi.mocked(prisma.modelConfig.findUnique).mockResolvedValueOnce({
    //     id: "nonexistent",
    //     type: ModelType.PATTERN_DETECTOR,
    //     hyperparameters: {},
    //     features: [],
    //     trainingParams: {},
    //     modelVersions: [],
    //   });

    //   const request = new NextRequest("http://localhost:3000/api/nous/learn/models/sync", mockState);
    //   const response = await POST(request);
    //   const data = await response.json();

    //   expect(response.status).toBe(404);
    //   expect(data.success).toBe(false);
    //   expect(data.error).toBe("Model not found");
    // });

    it("should handle database errors during sync", async () => {
      const mockModel = {
        id: "1",
        type: ModelType.PATTERN_DETECTOR,
        hyperparameters: { learning_rate: 0.01 },
        features: ["feature1", "feature2"],
        trainingParams: { epochs: 100 },
        modelVersions: [
          {
            id: "v1",
            createdAt: new Date("2023-01-01"),
          },
        ],
      };

      const mockState = {
        modelId: "1",
        state: {
          weights: [0.1, 0.2, 0.3],
          bias: 0.5,
          scaler: {
            mean: [0, 0],
            std: [1, 1],
          },
          featureNames: ["f1", "f2"],
          metrics: {
            accuracy: 0.9,
            precision: 0.85,
            recall: 0.88,
            f1Score: 0.86,
            latencyMs: 100,
            loss: 0.1,
          },
          hyperparameters: {
            learning_rate: 0.01,
          },
          currentEpoch: 0,
          trainingProgress: 0,
          lastTrainingError: null,
        },
      };

      vi.mocked(prisma.modelConfig.findUnique).mockResolvedValueOnce(mockModel);
      vi.mocked(prisma.modelState.upsert).mockRejectedValueOnce(new Error("DB Error"));

      const request = new NextRequest("http://localhost:3000/api/nous/learn/models/sync", {
        method: 'POST',
        body: JSON.stringify(mockState)
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error).toBe("Failed to sync model state");
    });
  });
}); 
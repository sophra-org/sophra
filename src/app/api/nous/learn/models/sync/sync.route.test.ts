import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { NextRequest } from "next/server";
import { GET, POST } from "./route";
import { mockPrisma } from "~/vitest.setup";
import { ModelType, ModelState, ModelConfig, ModelMetrics, Prisma } from "@prisma/client";

vi.mock("@/lib/shared/database/client", () => ({
  default: mockPrisma
}));

vi.mock("@/lib/shared/logger", () => ({
  default: {
    error: vi.fn(),
    info: vi.fn(),
  },
}));

describe("Model Sync Route Handler", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe("POST /api/nous/learn/models/sync", () => {
    it("should sync model state with valid data", async () => {
      const mockModel = {
        id: "test-model-1",
        type: "PATTERN_DETECTOR" as ModelType,
        hyperparameters: { learning_rate: 0.01 },
        features: ["feature1", "feature2"],
        trainingParams: { epochs: 100 }
      } satisfies Partial<ModelConfig>;

      const mockVersion = {
        id: "v1", 
        metrics: {},
        artifactPath: "",
        parentVersion: null,
        createdAt: new Date()
      };

      const mockState = {
        id: "test-state-1",
        versionId: mockVersion.id,
        weights: [0.1, 0.2],
        bias: 0.5,
        scaler: { mean: [0], std: [1] },
        featureNames: ["feature1"],
        hyperparameters: {
          learning_rate: 0.01,
        },
        currentEpoch: 10,
        trainingProgress: 1,
        lastTrainingError: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      } satisfies Partial<ModelState>;

      // Define metrics separately for the request body
      const mockMetrics = {
        accuracy: 0.9,
        precision: 0.85,
        recall: 0.88,
        f1Score: 0.86,
        latencyMs: 100,
        loss: 0.1,
      };

      vi.mocked(mockPrisma.modelConfig.findUnique).mockResolvedValue(mockModel as ModelConfig);
      vi.mocked(mockPrisma.modelState.create).mockResolvedValue(mockState as unknown as ModelState);

      const request = new NextRequest("http://localhost:3000/api/nous/learn/models/sync", {
        method: "POST",
        body: JSON.stringify({
          modelId: mockModel.id,
          state: {
            weights: mockState.weights,
            bias: mockState.bias,
            scaler: mockState.scaler,
            featureNames: mockState.featureNames,
            metrics: mockMetrics,
            hyperparameters: mockState.hyperparameters,
            currentEpoch: mockState.currentEpoch,
            trainingProgress: mockState.trainingProgress,
            lastTrainingError: mockState.lastTrainingError,
          },
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toEqual(mockState);
    });
  });
}); 
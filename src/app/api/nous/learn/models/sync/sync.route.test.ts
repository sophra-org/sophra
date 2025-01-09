import { ModelConfig, ModelState, ModelType, Prisma } from "@prisma/client";
import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

// Mock dependencies
vi.mock("@lib/shared/database/client", () => ({
  prisma: {
    modelConfig: {
      findUnique: vi.fn(),
    },
    modelState: {
      create: vi.fn(),
    },
    $queryRaw: vi.fn(),
  },
}));

vi.mock("@lib/shared/logger", () => ({
  default: {
    error: vi.fn(),
    info: vi.fn(),
  },
}));

// Import after mocks
import { POST } from "./route";
import { prisma } from "@lib/shared/database/client";
import logger from "@lib/shared/logger";

describe("Model Sync Route Handler", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("POST /api/nous/learn/models/sync", () => {
    it("should sync model state with valid data", async () => {
      const now = new Date();
      const mockModel = {
        id: "test-model-1",
        type: ModelType.PATTERN_DETECTOR,
        hyperparameters: { learning_rate: 0.01 } as Prisma.JsonValue,
        features: ["feature1", "feature2"],
        trainingParams: { epochs: 100 } as Prisma.JsonValue,
      } as ModelConfig;

      const mockState = {
        id: "test-state-1",
        versionId: "v1",
        modelType: ModelType.PATTERN_DETECTOR,
        hyperparameters: { learning_rate: 0.01 } as Prisma.JsonValue,
        weights: [0.1, 0.2],
        bias: 0.5,
        scaler: { mean: [0], std: [1] } as Prisma.JsonValue,
        featureNames: ["feature1"],
        isTrained: true,
        currentEpoch: 10,
        trainingProgress: 1,
        lastTrainingError: null,
        createdAt: now,
        updatedAt: now,
      } as ModelState;

      vi.mocked(prisma.modelConfig.findUnique).mockResolvedValue(mockModel);
      vi.mocked(prisma.modelState.create).mockResolvedValue(mockState);

      const request = new NextRequest(
        "http://localhost:3000/api/nous/learn/models/sync"
      );
      request.json = vi.fn().mockResolvedValue({
        modelId: mockModel.id,
        state: {
          weights: [0.1, 0.2],
          bias: 0.5,
          scaler: { mean: [0], std: [1] },
          featureNames: ["feature1"],
          hyperparameters: { learning_rate: 0.01 },
          currentEpoch: 10,
          trainingProgress: 1,
          lastTrainingError: null,
        },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data).toEqual({
        success: true,
        data: {
          ...mockState,
          createdAt: mockState.createdAt.toISOString(),
          updatedAt: mockState.updatedAt.toISOString(),
        },
        message: "Model state synced successfully",
      });
    });

    it("should handle invalid model ID", async () => {
      vi.mocked(prisma.modelConfig.findUnique).mockResolvedValue(null);

      const request = new NextRequest(
        "http://localhost:3000/api/nous/learn/models/sync"
      );
      request.json = vi.fn().mockResolvedValue({
        modelId: "invalid-id",
        state: {
          weights: [],
          bias: 0,
          scaler: { mean: [], std: [] },
          featureNames: [],
        },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data).toEqual({
        success: false,
        error: "Model not found",
        details: "No model found with ID: invalid-id",
      });
    });

    it("should handle database errors gracefully", async () => {
      vi.mocked(prisma.modelConfig.findUnique).mockRejectedValue(
        new Error("DB Error")
      );

      const request = new NextRequest(
        "http://localhost:3000/api/nous/learn/models/sync"
      );
      request.json = vi.fn().mockResolvedValue({
        modelId: "test-id",
        state: {
          weights: [],
          bias: 0,
          scaler: { mean: [], std: [] },
          featureNames: [],
        },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data).toEqual({
        success: false,
        error: "Internal server error",
        details: "DB Error",
      });
      expect(logger.error).toHaveBeenCalledWith(
        "Failed to sync model state",
        expect.any(Error)
      );
    });
  });
});

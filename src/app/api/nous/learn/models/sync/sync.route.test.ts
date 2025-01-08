import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import logger from '@lib/shared/logger';
import { ModelType, ModelState, ModelConfig } from "@prisma/client";

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

vi.mock('@lib/shared/database/client', () => {
  const mockPrisma = {
    modelConfig: {
      findUnique: vi.fn()
    },
    modelState: {
      create: vi.fn()
    },
    $queryRaw: vi.fn()
  };
  return { prisma: mockPrisma };
});

// Import after mocks
import { prisma } from '@lib/shared/database/client';
import { POST } from './route';

describe("Model Sync Route Handler", () => {
  beforeEach(() => {
    vi.clearAllMocks();
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

      const mockState = {
        id: "test-state-1",
        versionId: mockModel.id, // Changed from modelId to versionId based on type error
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

      vi.mocked(prisma.modelConfig.findUnique).mockResolvedValue(mockModel as ModelConfig);
      vi.mocked(prisma.modelState.create).mockResolvedValue(mockState as unknown as ModelState);

      const request = new NextRequest("http://localhost:3000/api/nous/learn/models/sync");
      request.json = vi.fn().mockResolvedValue({
        modelId: mockModel.id,
        state: {
          weights: mockState.weights,
          bias: mockState.bias,
          scaler: mockState.scaler,
          featureNames: mockState.featureNames,
          hyperparameters: mockState.hyperparameters,
          currentEpoch: mockState.currentEpoch,
          trainingProgress: mockState.trainingProgress,
          lastTrainingError: mockState.lastTrainingError,
        },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data).toEqual({
        success: true,
        data: mockState,
        meta: {
          timestamp: expect.any(String),
          request: expect.any(Object)
        }
      });
    });

    it("should handle invalid model ID", async () => {
      vi.mocked(prisma.modelConfig.findUnique).mockResolvedValue(null);

      const request = new NextRequest("http://localhost:3000/api/nous/learn/models/sync");
      request.json = vi.fn().mockResolvedValue({
        modelId: "invalid-id",
        state: {}
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data).toEqual({
        success: false,
        error: "Model not found",
        meta: {
          timestamp: expect.any(String),
          request: expect.any(Object)
        }
      });
    });

    it("should handle database errors gracefully", async () => {
      vi.mocked(prisma.modelConfig.findUnique).mockRejectedValue(new Error("DB Error"));

      const request = new NextRequest("http://localhost:3000/api/nous/learn/models/sync");
      request.json = vi.fn().mockResolvedValue({
        modelId: "test-id",
        state: {}
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data).toEqual({
        success: false,
        error: "Failed to sync model state",
        meta: {
          timestamp: expect.any(String),
          request: expect.any(Object)
        }
      });
      expect(logger.error).toHaveBeenCalled();
    });
  });
});

import { ModelConfig, ModelType, Prisma } from "@prisma/client";
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
      findMany: vi.fn(),
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
import { prisma } from "@lib/shared/database/client";
import logger from "@lib/shared/logger";
import { GET, POST } from "./route";

describe("Model Sync API", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const createMockState = (id: string) => ({
    id,
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
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  describe("GET /api/nous/learn/models/sync", () => {
    describe("Success cases", () => {
      it("should fetch model states successfully", async () => {
        const mockStates = [
          createMockState("state-1"),
          createMockState("state-2"),
        ];
        vi.mocked(prisma.modelState.findMany).mockResolvedValue(mockStates);

        const request = new NextRequest(
          "http://localhost:3000/api/nous/learn/models/sync"
        );

        const response = await GET();
        const data = await response.json();

        const responseData = data as {
          success: boolean;
          data: Array<{
            id: string;
            modelType: string;
            isTrained: boolean;
            weights: number[];
            bias: number;
            createdAt: string;
            updatedAt: string;
          }>;
        };

        expect(response.status).toBe(200);
        expect(responseData.success).toBe(true);
        expect(responseData.data.length).toBeGreaterThan(0);
        expect(responseData.data[0]).toEqual(
          expect.objectContaining({
            id: expect.any(String),
            modelType: expect.any(String),
            isTrained: expect.any(Boolean),
          })
        );

        expect(logger.info).toHaveBeenCalledWith(
          "Retrieved model states",
          expect.objectContaining({
            count: 2,
            timestamp: expect.any(String),
          })
        );
      });

      it("should handle empty results", async () => {
        vi.mocked(prisma.modelState.findMany).mockResolvedValue([]);

        const request = new NextRequest(
          "http://localhost:3000/api/nous/learn/models/sync"
        );
        const response = await GET();
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data).toMatchObject({
          success: true,
          data: [],
        });
      });
    });

    describe("Error cases", () => {
      it("should handle database errors", async () => {
        vi.mocked(prisma.modelState.findMany).mockRejectedValue(
          new Error("Database error")
        );

        const request = new NextRequest(
          "http://localhost:3000/api/nous/learn/models/sync"
        );
        const response = await GET();
        const data = await response.json();

        expect(response.status).toBe(500);
        expect(data).toMatchObject({
          success: false,
          error: "Failed to fetch model states",
          details: expect.any(String),
        });

        expect(logger.error).toHaveBeenCalledWith(
          "Failed to fetch model states",
          expect.objectContaining({
            error: expect.any(Error),
          })
        );
      });
    });
  });

  describe("POST /api/nous/learn/models/sync", () => {
    const validRequest = {
      modelId: "test-model-1",
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
    };

    describe("Success cases", () => {
      it("should sync model state with valid data", async () => {
        const mockModel = {
          id: "test-model-1",
          type: ModelType.PATTERN_DETECTOR,
          hyperparameters: { learning_rate: 0.01 } as Prisma.JsonValue,
          features: ["feature1", "feature2"],
          trainingParams: { epochs: 100 } as Prisma.JsonValue,
        } as ModelConfig;

        const mockState = createMockState("test-state-1");

        vi.mocked(prisma.modelConfig.findUnique).mockResolvedValue(mockModel);
        vi.mocked(prisma.modelState.create).mockResolvedValue(mockState);

        const request = new NextRequest(
          "http://localhost:3000/api/nous/learn/models/sync",
          {
            method: "POST",
            headers: {
              "content-type": "application/json",
            },
          }
        );
        request.json = vi.fn().mockResolvedValue(validRequest);

        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(201);
        expect(data).toMatchObject({
          success: true,
          data: {
            modelId: expect.any(String),
            stateId: expect.any(String),
          },
          message: "Model state synced successfully",
        });
      });
    });

    describe("Validation", () => {
      it("should validate request schema", async () => {
        const invalidRequest = {
          modelId: "test-model-1",
          state: {
            // Missing required fields
            weights: "not-an-array",
            bias: "not-a-number",
          },
        };

        const request = new NextRequest(
          "http://localhost:3000/api/nous/learn/models/sync",
          {
            method: "POST",
            headers: {
              "content-type": "application/json",
            },
          }
        );
        request.json = vi.fn().mockResolvedValue(invalidRequest);

        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(400);
        expect(data).toMatchObject({
          success: false,
          error: "Invalid request format",
          details: expect.any(Object),
        });
      });

      it("should handle invalid model ID", async () => {
        vi.mocked(prisma.modelConfig.findUnique).mockResolvedValue(null);

        const request = new NextRequest(
          "http://localhost:3000/api/nous/learn/models/sync",
          {
            method: "POST",
            headers: {
              "content-type": "application/json",
            },
          }
        );
        request.json = vi.fn().mockResolvedValue({
          ...validRequest,
          modelId: "invalid-id",
        });

        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(404);
        expect(data).toMatchObject({
          success: false,
          error: "Model not found",
          details: expect.stringContaining("invalid-id"),
        });
      });

      it("should handle invalid JSON", async () => {
        const request = new NextRequest(
          "http://localhost:3000/api/nous/learn/models/sync",
          {
            method: "POST",
            body: "invalid-json",
          }
        );

        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(500);
        expect(data).toMatchObject({
          success: false,
          error: "Internal server error",
          details: expect.any(String),
        });

        expect(logger.error).toHaveBeenCalledWith(
          "Unexpected error in model sync",
          expect.objectContaining({
            error: expect.any(Error),
          })
        );
      });
    });

    describe("Error handling", () => {
      it("should handle database errors gracefully", async () => {
        vi.mocked(prisma.modelConfig.findUnique).mockRejectedValue(
          new Error("DB Error")
        );

        const request = new NextRequest(
          "http://localhost:3000/api/nous/learn/models/sync",
          {
            method: "POST",
            headers: {
              "content-type": "application/json",
            },
          }
        );
        request.json = vi.fn().mockResolvedValue(validRequest);

        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(500);
        expect(data).toMatchObject({
          success: false,
          error: "Internal server error",
          details: "DB Error",
        });

        expect(logger.error).toHaveBeenCalledWith(
          "Unexpected error in model sync",
          expect.objectContaining({
            error: expect.any(Error),
          })
        );
      });

      it("should handle invalid JSON", async () => {
        const request = new NextRequest(
          "http://localhost:3000/api/nous/learn/models/sync",
          {
            method: "POST",
            body: "invalid-json",
          }
        );

        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(500);
        expect(data).toMatchObject({
          success: false,
          error: "Internal server error",
          details: expect.any(String),
        });

        expect(logger.error).toHaveBeenCalledWith(
          "Unexpected error in model sync",
          expect.objectContaining({
            error: expect.any(Error),
          })
        );
      });
    });
  });
});

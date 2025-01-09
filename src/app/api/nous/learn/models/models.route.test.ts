import { prisma } from "@lib/shared/database/client";
import logger from "@lib/shared/logger";
import { ModelConfig, ModelType, ModelVersion, Prisma } from "@prisma/client";
import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { GET, POST } from "./route";

// Define interfaces for type safety
interface ModelConfigWithTimestamps extends ModelConfig {
  createdAt: Date;
  updatedAt: Date;
}

interface ModelVersionWithTimestamps extends ModelVersion {
  createdAt: Date;
}

// Mock modules
vi.mock("@lib/shared/logger", () => ({
  default: {
    error: vi.fn(),
    info: vi.fn(),
  },
}));

vi.mock("@lib/shared/database/client", () => ({
  prisma: {
    modelConfig: {
      findMany: vi.fn(),
      create: vi.fn(),
    },
    modelVersion: {
      create: vi.fn(),
    },
  },
}));

describe("Models API Endpoints", () => {
  const now = new Date();
  const mockVersion: ModelVersionWithTimestamps = {
    id: "v1",
    configId: "test-1",
    metrics: {} as Prisma.JsonValue,
    artifactPath: "",
    parentVersion: null,
    createdAt: now,
  };

  const mockModel: ModelConfigWithTimestamps & {
    modelVersions: ModelVersionWithTimestamps[];
  } = {
    id: "test-1",
    type: ModelType.PATTERN_DETECTOR,
    hyperparameters: { learning_rate: 0.01 } as Prisma.JsonValue,
    features: ["feature1", "feature2"],
    trainingParams: { epochs: 100 } as Prisma.JsonValue,
    modelVersions: [mockVersion],
    createdAt: now,
    updatedAt: now,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("GET /api/nous/learn/models", () => {
    describe("successful scenarios", () => {
      it("should fetch models with proper pagination metadata", async () => {
        const mockModelWithVersions = {
          id: "test-1",
          type: ModelType.PATTERN_DETECTOR,
          features: ["feature1", "feature2"],
          hyperparameters: { learning_rate: 0.01 },
          trainingParams: { epochs: 100 },
          createdAt: "2025-01-09T11:19:39.510Z",
          updatedAt: "2025-01-09T11:19:39.510Z",
          modelVersions: [
            {
              id: "v1",
              configId: "test-1",
              artifactPath: "",
              metrics: {},
              parentVersion: null,
              createdAt: "2025-01-09T11:19:39.510Z",
            },
          ],
        };

        vi.mocked(prisma.modelConfig.findMany).mockResolvedValueOnce([
          mockModelWithVersions,
        ]);

        const request = new NextRequest(
          "http://localhost:3000/api/nous/learn/models",
          {
            headers: {
              "x-test-header": "test-value",
            },
          }
        );

        const response = await GET(request);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data).toMatchObject({
          success: true,
          data: expect.arrayContaining([
            expect.objectContaining({
              id: expect.any(String),
              type: expect.any(String),
              features: expect.any(Array),
              modelVersions: expect.any(Array),
            }),
          ]),
          meta: {
            total: expect.any(Number),
            page: expect.any(Number),
            pageSize: expect.any(Number),
          },
        });

        expect(logger.info).toHaveBeenCalledWith(
          "Received models request",
          expect.objectContaining({
            url: request.url,
            headers: expect.objectContaining({
              "x-test-header": "test-value",
            }),
          })
        );

        expect(logger.info).toHaveBeenCalledWith(
          "Retrieved models from database",
          expect.objectContaining({
            modelCount: 1,
            took: expect.any(Number),
          })
        );

        expect(prisma.modelConfig.findMany).toHaveBeenCalledWith({
          include: {
            modelVersions: {
              orderBy: { createdAt: "desc" },
              take: 1,
            },
          },
        });
      });

      it("should handle empty results with proper metadata", async () => {
        vi.mocked(prisma.modelConfig.findMany).mockResolvedValueOnce([]);

        const request = new NextRequest(
          "http://localhost:3000/api/nous/learn/models"
        );
        const response = await GET(request);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data).toMatchObject({
          success: true,
          data: [],
          meta: {
            total: 0,
            page: expect.any(Number),
            pageSize: expect.any(Number),
          },
        });
      });
    });

    describe("error scenarios", () => {
      it("should handle database errors with proper error response", async () => {
        vi.mocked(prisma.modelConfig.findMany).mockRejectedValueOnce(
          new Error("DB Error")
        );

        const request = new NextRequest(
          "http://localhost:3000/api/nous/learn/models"
        );
        const response = await GET(request);
        const data = await response.json();

        expect(response.status).toBe(500);
        expect(data).toMatchObject({
          success: false,
          error: expect.any(String),
          metadata: {
            took: expect.any(Number),
            timestamp: expect.any(String),
          },
        });

        expect(logger.error).toHaveBeenCalledWith(
          "Failed to fetch models",
          expect.objectContaining({
            error: expect.any(Error),
            took: expect.any(Number),
          })
        );
      });
    });
  });

  describe("POST /api/nous/learn/models", () => {
    const validModelData = {
      type: ModelType.PATTERN_DETECTOR,
      hyperparameters: { learning_rate: 0.01 },
      features: ["feature1", "feature2"],
      trainingParams: { epochs: 100 },
    };

    describe("successful scenarios", () => {
      it("should create model with proper response structure", async () => {
        const mockCreatedModel = {
          id: "test-1",
          type: ModelType.PATTERN_DETECTOR,
          hyperparameters: { learning_rate: 0.01 },
          features: ["feature1", "feature2"],
          trainingParams: { epochs: 100 },
          isTrained: false,
          trainingProgress: 0,
          createdAt: "2025-01-09T11:19:39.510Z",
          updatedAt: "2025-01-09T11:19:39.510Z",
        };

        vi.mocked(prisma.modelConfig.create).mockResolvedValueOnce(
          mockCreatedModel
        );

        const request = new NextRequest(
          "http://localhost/api/nous/learn/models",
          {
            method: "POST",
            headers: {
              "content-type": "application/json",
            },
          }
        );
        request.json = vi.fn().mockResolvedValue(validModelData);

        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data).toMatchObject({
          success: true,
          data: {
            id: expect.any(String),
            type: expect.any(String),
            isTrained: expect.any(Boolean),
            trainingProgress: expect.any(Number),
            createdAt: expect.any(String),
            updatedAt: expect.any(String),
          },
        });

        expect(prisma.modelConfig.create).toHaveBeenCalledWith({
          data: {
            type: ModelType.PATTERN_DETECTOR,
            hyperparameters: { learning_rate: 0.01 },
            features: ["feature1", "feature2"],
            trainingParams: { epochs: 100 },
            modelVersions: {
              create: {
                metrics: {} as Prisma.InputJsonValue,
                artifactPath: "",
                parentVersion: null,
              },
            },
          },
          include: {
            modelVersions: true,
          },
        });
      });
    });

    describe("error scenarios", () => {
      it("should handle invalid request format with validation details", async () => {
        const invalidData = {
          type: "INVALID_TYPE",
          hyperparameters: "not-an-object",
        };

        const request = new NextRequest(
          "http://localhost:3000/api/nous/learn/models",
          {
            method: "POST",
            headers: {
              "content-type": "application/json",
            },
          }
        );
        request.json = vi.fn().mockResolvedValue(invalidData);

        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(400);
        expect(data).toEqual({
          success: false,
          error: "Invalid request format",
          details: expect.any(Object),
          meta: {
            took: expect.any(Number),
          },
        });
      });

      it("should handle invalid JSON with proper error response", async () => {
        const request = new NextRequest(
          "http://localhost:3000/api/nous/learn/models",
          {
            method: "POST",
            headers: {
              "content-type": "application/json",
            },
          }
        );
        request.json = vi.fn().mockRejectedValue(new Error("Invalid JSON"));

        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(400);
        expect(data).toMatchObject({
          success: false,
          error: expect.any(String),
          details: expect.any(Object),
          meta: {
            took: expect.any(Number),
          },
        });
      });

      it("should handle database errors during creation", async () => {
        vi.mocked(prisma.modelConfig.create).mockRejectedValueOnce(
          new Error("DB Error")
        );

        const request = new NextRequest(
          "http://localhost:3000/api/nous/learn/models",
          {
            method: "POST",
            headers: {
              "content-type": "application/json",
            },
          }
        );
        request.json = vi.fn().mockResolvedValue(validModelData);

        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(500);
        expect(data).toMatchObject({
          success: false,
          error: expect.any(String),
          meta: {
            took: expect.any(Number),
          },
        });

        expect(logger.error).toHaveBeenCalledWith(
          "Failed to create model",
          expect.objectContaining({
            error: expect.any(Error),
          })
        );
      });
    });
  });
});

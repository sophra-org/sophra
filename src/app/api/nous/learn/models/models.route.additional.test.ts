import { prisma } from "@lib/shared/database/client";
import logger from "@lib/shared/logger";
import { ModelType } from "@prisma/client";
import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { GET, POST } from "./route";

// Mock dependencies
vi.mock("@lib/shared/database/client", () => ({
  prisma: {
    modelConfig: {
      findMany: vi.fn(),
      create: vi.fn(),
    },
  },
}));

vi.mock("@lib/shared/logger", () => ({
  default: {
    info: vi.fn(),
    error: vi.fn(),
  },
}));

describe("Learning Models API", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const createMockModel = (id: string) => ({
    id,
    type: ModelType.SEARCH_RANKER,
    hyperparameters: { layers: 3, units: 64 },
    features: ["feature1", "feature2"],
    trainingParams: { epochs: 100, batchSize: 32 },
    modelVersions: [
      {
        id: `version-${id}`,
        metrics: {},
        artifactPath: "",
        parentVersion: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ],
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  describe("GET /api/learn/models", () => {
    describe("Success cases", () => {
      it("should successfully retrieve models with their latest versions", async () => {
        const mockModels = [
          createMockModel("model-1"),
          createMockModel("model-2"),
        ];
        vi.mocked(prisma.modelConfig.findMany).mockResolvedValue(mockModels);

        const request = new NextRequest("http://localhost/api/learn/models");
        const response = await GET(request);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data).toMatchObject({
          success: true,
          data: expect.arrayContaining([
            expect.objectContaining({
              id: "model-1",
              type: ModelType.SEARCH_RANKER,
              modelVersions: expect.arrayContaining([
                expect.objectContaining({ id: "version-model-1" }),
              ]),
            }),
          ]),
          meta: {
            total: 2,
            page: 1,
            pageSize: 10,
          },
        });
      });

      it("should handle empty results", async () => {
        vi.mocked(prisma.modelConfig.findMany).mockResolvedValue([]);

        const request = new NextRequest("http://localhost/api/learn/models");
        const response = await GET(request);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.success).toBe(true);
        expect(data.data).toEqual([]);
        expect(data.meta).toEqual({
          total: 0,
          page: 1,
          pageSize: 10,
        });
      });
    });

    describe("Error cases", () => {
      it("should handle database errors", async () => {
        vi.mocked(prisma.modelConfig.findMany).mockRejectedValue(
          new Error("Database error")
        );

        const request = new NextRequest("http://localhost/api/learn/models");
        const response = await GET(request);
        const data = await response.json();

        expect(response.status).toBe(500);
        expect(data.success).toBe(false);
        expect(data.error).toBe("Failed to fetch models");
        expect(logger.error).toHaveBeenCalledWith(
          "Failed to fetch models",
          expect.any(Object)
        );
      });
    });
  });

  describe("POST /api/learn/models", () => {
    const validRequest = {
      type: ModelType.SEARCH_RANKER,
      hyperparameters: { layers: 3, units: 64 },
      features: ["feature1", "feature2"],
      trainingParams: { epochs: 100, batchSize: 32 },
    };

    describe("Success cases", () => {
      it("should successfully create a model with initial version", async () => {
        const mockModel = createMockModel("model-1");
        vi.mocked(prisma.modelConfig.create).mockResolvedValue(mockModel);

        const request = new NextRequest("http://localhost/api/learn/models", {
          method: "POST",
          body: JSON.stringify(validRequest),
        });

        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data).toMatchObject({
          success: true,
          data: expect.objectContaining({
            id: mockModel.id,
            type: mockModel.type,
            isTrained: false,
            trainingProgress: 0,
            createdAt: expect.any(String),
            updatedAt: expect.any(String),
          }),
        });
      });
    });

    describe("Validation", () => {
      it("should validate model type", async () => {
        const request = new NextRequest("http://localhost/api/learn/models", {
          method: "POST",
          body: JSON.stringify({
            ...validRequest,
            type: "INVALID_TYPE",
          }),
        });

        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(400);
        expect(data.success).toBe(false);
        expect(data.error).toBe("Invalid request format");
      });

      it("should validate required fields", async () => {
        const request = new NextRequest("http://localhost/api/learn/models", {
          method: "POST",
          body: JSON.stringify({
            // Missing required fields
            type: ModelType.SEARCH_RANKER,
          }),
        });

        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(400);
        expect(data.success).toBe(false);
      });

      it("should handle invalid JSON", async () => {
        const request = new NextRequest("http://localhost/api/learn/models", {
          method: "POST",
          body: "invalid json",
        });

        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(400);
        expect(data.success).toBe(false);
      });
    });

    describe("Error handling", () => {
      it("should handle database errors", async () => {
        vi.mocked(prisma.modelConfig.create).mockRejectedValue(
          new Error("Database error")
        );

        const request = new NextRequest("http://localhost/api/learn/models", {
          method: "POST",
          body: JSON.stringify(validRequest),
        });

        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(500);
        expect(data.success).toBe(false);
        expect(data.error).toBe("Failed to create model");
        expect(logger.error).toHaveBeenCalledWith(
          "Failed to create model",
          expect.any(Object)
        );
      });

      it("should include timing information in error response", async () => {
        vi.mocked(prisma.modelConfig.create).mockRejectedValue(
          new Error("Database error")
        );

        const request = new NextRequest("http://localhost/api/learn/models", {
          method: "POST",
          body: JSON.stringify(validRequest),
        });

        const response = await POST(request);
        const data = await response.json();

        expect(data.meta).toEqual(
          expect.objectContaining({
            took: expect.any(Number),
          })
        );
      });
    });
  });
});

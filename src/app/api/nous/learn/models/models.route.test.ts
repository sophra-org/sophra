import { ModelType } from "@prisma/client";
import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

// Mock modules
vi.mock("@lib/shared/logger", () => ({
  default: {
    error: vi.fn(),
    info: vi.fn(),
  },
}));

vi.mock("next/server", () => ({
  NextRequest: vi.fn().mockImplementation((url) => ({
    url,
    nextUrl: new URL(url),
    headers: new Headers(),
    json: vi.fn(),
  })),
  NextResponse: {
    json: vi.fn().mockImplementation((data, init) => ({
      status: init?.status || 200,
      ok: init?.status ? init.status >= 200 && init.status < 300 : true,
      headers: new Headers(),
      json: async () => data,
    })),
  },
}));

vi.mock("@lib/shared/database/client", () => {
  const mockPrisma = {
    modelConfig: {
      findMany: vi.fn(),
      create: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      count: vi.fn(),
      upsert: vi.fn(),
    },
    modelVersion: {
      create: vi.fn(),
      findMany: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    $queryRaw: vi.fn(),
    $transaction: vi.fn((callback) => callback(mockPrisma)),
  };
  return { prisma: mockPrisma };
});

// Import after mocks
import { prisma } from "@lib/shared/database/client";
import { GET, POST } from "./route";

describe("Models Route Handler", () => {
  const mockModel = {
    id: "test-1",
    type: ModelType.PATTERN_DETECTOR,
    hyperparameters: { learning_rate: 0.01 },
    features: ["feature1", "feature2"],
    trainingParams: { epochs: 100 },
    createdAt: new Date(),
    updatedAt: new Date(),
    modelVersions: [
      {
        id: "v1",
        modelId: "test-1",
        metrics: {},
        artifactPath: "",
        parentVersion: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ],
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("GET /api/nous/learn/models", () => {
    it("should fetch models successfully", async () => {
      vi.mocked(prisma.modelConfig.findMany).mockResolvedValue([mockModel]);

      const request = new NextRequest(
        "http://localhost:3000/api/nous/learn/models"
      );
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toEqual([mockModel]);
      expect(data.meta).toEqual({
        total: 1,
        page: 1,
        pageSize: 10,
      });
    });

    it("should handle database errors gracefully", async () => {
      vi.mocked(prisma.modelConfig.findMany).mockRejectedValue(
        new Error("DB Error")
      );

      const request = new NextRequest(
        "http://localhost:3000/api/nous/learn/models"
      );
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error).toBe("Failed to fetch models");
      expect(data.details).toBe("DB Error");
      expect(data.metadata).toBeDefined();
      expect(data.metadata.took).toBeGreaterThan(0);
    });
  });

  describe("POST /api/nous/learn/models", () => {
    it("should create model successfully", async () => {
      const modelData = {
        type: ModelType.PATTERN_DETECTOR,
        hyperparameters: { learning_rate: 0.01 },
        features: ["feature1", "feature2"],
        trainingParams: { epochs: 100 },
      };

      vi.mocked(prisma.modelConfig.create).mockResolvedValue({
        ...mockModel,
        ...modelData,
      });

      const request = new NextRequest(
        "http://localhost:3000/api/nous/learn/models"
      );
      request.json = vi.fn().mockResolvedValue(modelData);

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toMatchObject(modelData);
    });

    it("should handle invalid request format", async () => {
      const invalidData = {
        type: "INVALID_TYPE",
        hyperparameters: "not-an-object",
      };

      const request = new NextRequest(
        "http://localhost:3000/api/nous/learn/models"
      );
      request.json = vi.fn().mockResolvedValue(invalidData);

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toBe("Invalid request format");
      expect(data.details).toBeDefined();
    });

    it("should handle database errors during creation", async () => {
      const modelData = {
        type: ModelType.PATTERN_DETECTOR,
        hyperparameters: { learning_rate: 0.01 },
        features: ["feature1", "feature2"],
      };

      vi.mocked(prisma.modelConfig.create).mockRejectedValue(
        new Error("DB Error")
      );

      const request = new NextRequest(
        "http://localhost:3000/api/nous/learn/models"
      );
      request.json = vi.fn().mockResolvedValue(modelData);

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error).toBe("Failed to create model");
      expect(data.details).toBe("DB Error");
    });
  });
});

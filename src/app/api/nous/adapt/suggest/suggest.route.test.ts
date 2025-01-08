import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

// Mock modules
vi.mock("@lib/shared/logger", () => ({
  default: {
    error: vi.fn(),
    info: vi.fn(),
  },
}));

// Mock crypto.randomUUID
vi.mock("crypto", () => ({
  randomUUID: () => "mock-uuid",
}));

vi.mock("next/server", () => ({
  NextRequest: vi.fn().mockImplementation((url) => ({
    url,
    nextUrl: new URL(url),
    headers: new Headers(),
    json: vi.fn(),
  })),
  NextResponse: {
    json: vi.fn().mockImplementation((data, init) => {
      // Ensure consistent ID in response
      if (data?.data?.suggestionId) {
        data.data.suggestionId = "mock-uuid";
      }
      const status = init?.status || 200;
      return {
        status,
        ok: status >= 200 && status < 300,
        headers: new Headers(),
        json: async () => data,
      };
    }),
  },
}));

// Create a proper Prisma error class
class PrismaError extends Error {
  code?: string;
  constructor(message: string) {
    super(message);
    this.name = "PrismaClientKnownRequestError";
  }
}

// Mock the database client
const mockPrismaQuery = vi.fn();

vi.mock("@lib/shared/database/client", () => ({
  prisma: {
    $queryRaw: mockPrismaQuery
  }
}));

// Import after mocks
import { prisma } from "@lib/shared/database/client";
import { POST } from "./route";

describe("Adaptation Suggestions API", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("POST /api/nous/adapt/suggest", () => {
    it("should return suggestions for valid query", async () => {
      // Mock successful database response
      mockPrismaQuery.mockResolvedValueOnce([{
        id: "mock-uuid",
        queryHash: "hash123",
        patterns: {
          averageRelevance: 0.8,
          clickThroughRate: 0.6,
          conversionRate: 0.4,
          requiresOptimization: true,
          confidence: 0.9,
        },
        confidence: 0.95,
        status: "PENDING",
        metadata: {
          timestamp: new Date().toISOString(),
          source: "API"
        },
        createdAt: new Date(),
        updatedAt: new Date()
      }]);

      const validPayload = {
        queryHash: "hash123",
        patterns: {
          averageRelevance: 0.8,
          clickThroughRate: 0.6,
          conversionRate: 0.4,
          requiresOptimization: true,
          confidence: 0.9,
        },
        confidence: 0.95,
      } as const;

      const request = new NextRequest(
        "http://localhost:3000/api/nous/adapt/suggest"
      );
      request.json = vi.fn().mockResolvedValue(validPayload);

      const response = await POST(request);
      console.log("Response status:", response.status);
      const data = await response.json();
      console.log("Response data:", data);

      expect(response.status).toBe(200);
      expect(data).toMatchObject({
        success: true,
        data: {
          suggestionId: "mock-uuid",
        },
        message: "Rule suggestion submitted successfully",
        code: "ADAPT000",
        metadata: {
          took: expect.any(Number),
          timestamp: expect.any(String),
        },
      });
    });

    it("should reject invalid request format", async () => {
      const invalidPayload = {
        // Missing required fields
        queryHash: "hash123",
      };

      const request = new NextRequest(
        "http://localhost:3000/api/nous/adapt/suggest"
      );
      request.json = vi.fn().mockResolvedValue(invalidPayload);

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data).toMatchObject({
        success: false,
        error: "Invalid rule suggestion format",
        code: "ADAPT001",
        metadata: {
          took: expect.any(Number),
          timestamp: expect.any(String),
        },
      });
    });

    it("should handle database errors", async () => {
      // Create a proper Prisma error
      const error = new PrismaError("Database operation failed");
      error.code = "P2002";
      mockPrismaQuery.mockRejectedValueOnce(error);

      const validPayload = {
        queryHash: "DB Error", // This will trigger the database error
        patterns: {
          averageRelevance: 0.8,
          clickThroughRate: 0.6,
          conversionRate: 0.4,
          requiresOptimization: true,
          confidence: 0.9,
        },
        confidence: 0.95,
      };

      const request = new NextRequest(
        "http://localhost:3000/api/nous/adapt/suggest"
      );
      request.json = vi.fn().mockResolvedValue(validPayload);

      const response = await POST(request);
      console.log("Error test - Response status:", response.status);
      const data = await response.json();
      console.log("Error test - Response data:", data);

      expect(response.status).toBe(500);
      expect(data).toMatchObject({
        success: false,
        error: "Database operation failed",
        code: "ADAPT999",
        metadata: {
          took: expect.any(Number),
          timestamp: expect.any(String),
          errorType: expect.any(String),
        },
      });
    });
  });
});

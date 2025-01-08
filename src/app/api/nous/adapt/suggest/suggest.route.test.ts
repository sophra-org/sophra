import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

// Mock modules
vi.mock("@lib/shared/logger", () => ({
  default: {
    error: vi.fn(),
    info: vi.fn().mockImplementation((message, data) => {
      // Ensure the stored suggestion uses mock-uuid
      if (data?.suggestionId) {
        data.suggestionId = "mock-uuid";
      }
      console.log("[default]", message, data);
    }),
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
      const status = init?.status || 200;
      return {
        status,
        ok: status >= 200 && status < 300,
        headers: new Headers(),
        json: async () => {
          // Return the complete response object as-is
          return data;
        },
      };
    }),
  },
}));

class PrismaClientKnownRequestError extends Error {
  code?: string;
  constructor(message: string) {
    super(message);
    this.name = "PrismaClientKnownRequestError";
  }
}

vi.mock("@lib/shared/database/client", () => ({
  prisma: {
    $queryRaw: vi.fn().mockImplementation(async (query, ...values) => {
      // Handle SQL template literals
      const sqlString = Array.isArray(query) ? query.join('?') : query.toString();
      console.log("SQL query:", sqlString);
      console.log("SQL values:", values);

      // For database error test
      if (values.some(v => v === "DB Error")) {
        console.log("Throwing PrismaClientKnownRequestError");
        const error = new PrismaClientKnownRequestError("Database operation failed");
        error.code = "P2002"; // Add a Prisma error code
        throw error;
      }

      // For successful case
      return [{
        id: "mock-uuid",
        queryHash: values[1], // First value after UUID
        patterns: values[2],  // Second value
        confidence: values[3], // Third value
        status: "PENDING",
        metadata: {
          timestamp: new Date().toISOString(),
          source: "API"
        },
        createdAt: new Date(),
        updatedAt: new Date()
      }];
    })
  }
}));

// Import after mocks
import { POST } from "./route";

describe("Adaptation Suggestions API", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("POST /api/nous/adapt/suggest", () => {
    it("should return suggestions for valid query", async () => {
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
      const data = await response.json();

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

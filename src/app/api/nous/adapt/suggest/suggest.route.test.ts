import { POST } from "@/app/api/nous/adapt/suggest/route";
import { prisma } from "@lib/shared/database/client";
import type { AdaptationSuggestion } from "@prisma/client";
import { PrismaClientKnownRequestError } from "@prisma/client/runtime/library";
import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

// Mock modules
vi.mock("@lib/shared/logger", () => ({
  default: {
    error: vi.fn(),
    info: vi.fn(),
  },
}));

vi.mock("@lib/shared/database/client", () => ({
  prisma: {
    $queryRaw: vi.fn(),
  },
}));

vi.mock("crypto", () => ({
  randomUUID: vi.fn().mockReturnValue("mock-uuid"),
}));

describe("Adaptation Suggestions API", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("POST /api/nous/adapt/suggest", () => {
    it("should return suggestions for valid query", async () => {
      const mockSuggestion: AdaptationSuggestion = {
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
          source: "API",
        },
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vi.mocked(prisma.$queryRaw).mockResolvedValueOnce([mockSuggestion]);

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
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual({
        success: true,
        data: {
          suggestionId: "mock-uuid",
        },
        message: "Rule suggestion submitted successfully",
        code: "ADAPT000",
        metadata: expect.objectContaining({
          took: expect.any(Number),
          timestamp: expect.any(String),
        }),
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
      expect(data).toEqual({
        success: false,
        error: "Invalid rule suggestion format",
        details: expect.any(Object),
        code: "ADAPT001",
        metadata: expect.objectContaining({
          took: expect.any(Number),
          timestamp: expect.any(String),
        }),
      });
    });

    it("should handle database errors", async () => {
      const error = new PrismaClientKnownRequestError(
        "Database operation failed",
        {
          code: "P2002",
          clientVersion: "5.x",
        }
      );

      const validPayload = {
        queryHash: "DB Error",
        patterns: {
          averageRelevance: 0.8,
          clickThroughRate: 0.6,
          conversionRate: 0.4,
          requiresOptimization: true,
          confidence: 0.9,
        },
        confidence: 0.95,
      };

      vi.mocked(prisma.$queryRaw).mockRejectedValueOnce(error);

      const request = new NextRequest(
        "http://localhost:3000/api/nous/adapt/suggest"
      );
      request.json = vi.fn().mockResolvedValue(validPayload);

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data).toEqual({
        success: false,
        error: "Database operation failed",
        code: "ADAPT999",
        details: "Database operation failed",
        metadata: expect.objectContaining({
          took: expect.any(Number),
          timestamp: expect.any(String),
          errorType: "PrismaClientKnownRequestError",
        }),
      });
    });
  });
});

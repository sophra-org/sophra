import { POST } from "@/app/api/nous/adapt/suggest/route";
import { prisma } from "@lib/shared/database/client";
import logger from "@lib/shared/logger";
import type { AdaptationSuggestion } from "@prisma/client";
import { NextRequest } from "next/server";
import { afterAll, beforeEach, describe, expect, it, vi } from "vitest";

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

describe("Suggest Route Additional Tests", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterAll(() => {
    vi.clearAllMocks();
  });

  describe("POST Endpoint", () => {
    const validSuggestion = {
      queryHash: "test-hash",
      patterns: {
        averageRelevance: 0.8,
        clickThroughRate: 0.6,
        conversionRate: 0.4,
        requiresOptimization: true,
        confidence: 0.9,
      },
      confidence: 0.85,
    };

    it("should process valid suggestion", async () => {
      const mockSuggestion: AdaptationSuggestion = {
        id: "mock-uuid",
        queryHash: validSuggestion.queryHash,
        patterns: validSuggestion.patterns,
        confidence: validSuggestion.confidence,
        status: "PENDING",
        metadata: {
          timestamp: new Date().toISOString(),
          source: "API",
        },
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vi.mocked(prisma.$queryRaw).mockResolvedValueOnce([mockSuggestion]);

      const request = new NextRequest("http://localhost/api/adapt/suggest", {
        method: "POST",
        body: JSON.stringify(validSuggestion),
      });

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

    it("should handle invalid JSON", async () => {
      const request = new NextRequest("http://localhost/api/adapt/suggest", {
        method: "POST",
        body: "invalid-json",
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data).toEqual({
        success: false,
        error: "Invalid JSON format",
        code: "ADAPT002",
        metadata: expect.objectContaining({
          took: expect.any(Number),
          timestamp: expect.any(String),
        }),
      });
    });

    it("should validate request schema", async () => {
      const invalidSuggestion = {
        queryHash: "test-hash",
        patterns: {
          averageRelevance: 2, // Invalid: > 1
          clickThroughRate: 0.6,
          conversionRate: 0.4,
          requiresOptimization: true,
          confidence: 0.9,
        },
        confidence: 0.85,
      };

      const request = new NextRequest("http://localhost/api/adapt/suggest", {
        method: "POST",
        body: JSON.stringify(invalidSuggestion),
      });

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

    it("should validate pattern values", async () => {
      const invalidPatterns = [
        {
          ...validSuggestion,
          patterns: { ...validSuggestion.patterns, averageRelevance: -0.1 },
        },
        {
          ...validSuggestion,
          patterns: { ...validSuggestion.patterns, clickThroughRate: 1.1 },
        },
        {
          ...validSuggestion,
          patterns: { ...validSuggestion.patterns, conversionRate: 2 },
        },
        {
          ...validSuggestion,
          patterns: { ...validSuggestion.patterns, confidence: -1 },
        },
      ];

      for (const invalidPattern of invalidPatterns) {
        const request = new NextRequest("http://localhost/api/adapt/suggest", {
          method: "POST",
          body: JSON.stringify(invalidPattern),
        });

        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(400);
        expect(data.success).toBe(false);
        expect(data.code).toBe("ADAPT001");
      }
    });

    it("should log request details", async () => {
      const request = new NextRequest("http://localhost/api/adapt/suggest", {
        method: "POST",
        body: JSON.stringify(validSuggestion),
        headers: {
          "x-test-header": "test-value",
        },
      });

      const mockSuggestion: AdaptationSuggestion = {
        id: "mock-uuid",
        queryHash: validSuggestion.queryHash,
        patterns: validSuggestion.patterns,
        confidence: validSuggestion.confidence,
        status: "PENDING",
        metadata: {
          timestamp: new Date().toISOString(),
          source: "API",
        },
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vi.mocked(prisma.$queryRaw).mockResolvedValueOnce([mockSuggestion]);

      await POST(request);

      expect(logger.info).toHaveBeenCalledWith(
        "Received adaptation suggestion request",
        expect.objectContaining({
          url: expect.any(String),
          headers: expect.objectContaining({
            "x-test-header": "test-value",
          }),
        })
      );
    });

    it("should include timing information", async () => {
      const request = new NextRequest("http://localhost/api/adapt/suggest", {
        method: "POST",
        body: JSON.stringify(validSuggestion),
      });

      const mockSuggestion: AdaptationSuggestion = {
        id: "mock-uuid",
        queryHash: validSuggestion.queryHash,
        patterns: validSuggestion.patterns,
        confidence: validSuggestion.confidence,
        status: "PENDING",
        metadata: {
          timestamp: new Date().toISOString(),
          source: "API",
        },
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vi.mocked(prisma.$queryRaw).mockResolvedValueOnce([mockSuggestion]);

      const response = await POST(request);
      const data = await response.json();

      expect(data.metadata).toBeDefined();
      expect(data.metadata.took).toBeGreaterThanOrEqual(0);
      expect(Date.parse(data.metadata.timestamp)).not.toBeNaN();
    });
  });
});

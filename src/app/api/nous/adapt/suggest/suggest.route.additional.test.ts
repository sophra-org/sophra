import { prisma } from "@lib/shared/database/client";
import logger from "@lib/shared/logger";
import crypto from "crypto";
import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { POST, runtime } from "./route";

// Enhanced mock configurations
vi.mock("@lib/shared/database/client", () => ({
  prisma: {
    $queryRaw: vi.fn().mockImplementation(() => Promise.resolve([])),
  },
}));

vi.mock("@lib/shared/logger", () => ({
  default: {
    error: vi.fn().mockImplementation(() => {}),
    info: vi.fn().mockImplementation(() => {}),
  },
}));

vi.mock("crypto", () => ({
  default: {
    randomUUID: vi
      .fn()
      .mockImplementation(() => "123e4567-e89b-12d3-a456-426614174000"),
  },
}));

describe("Suggest Route Additional Tests", () => {
  const mockUUID = "123e4567-e89b-12d3-a456-426614174000";

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(crypto.randomUUID).mockReturnValue(mockUUID);
  });

  describe("Configuration", () => {
    it("should use Node.js runtime", () => {
      expect(runtime).toBe("nodejs");
    });
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
      const request = new NextRequest("http://localhost/api/adapt/suggest", {
        method: "POST",
        body: JSON.stringify(validSuggestion),
      });

      const mockSuggestion = {
        id: mockUUID,
        queryHash: validSuggestion.queryHash,
        patterns: validSuggestion.patterns,
        confidence: validSuggestion.confidence,
        status: "PENDING",
      };

      vi.mocked(prisma.$queryRaw).mockResolvedValueOnce([mockSuggestion]);

      const response = await POST(request);
      const data = await response.json();

      expect(prisma.$queryRaw).toHaveBeenCalledTimes(1);
      expect(prisma.$queryRaw).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO "AdaptationSuggestion"'),
        expect.any(String), // queryHash
        expect.any(Object), // patterns
        expect.any(Number), // confidence
        "PENDING"
      );

      expect(response.status).toBe(200);
      expect(data).toEqual({
        success: true,
        data: {
          suggestionId: mockUUID,
        },
        message: "Rule suggestion submitted successfully",
        code: "ADAPT000",
        metadata: expect.objectContaining({
          took: expect.any(Number),
          timestamp: expect.any(String),
        }),
      });

      expect(logger.info).toHaveBeenCalledWith(
        "Stored adaptation suggestion",
        expect.objectContaining({
          suggestionId: mockUUID,
          queryHash: validSuggestion.queryHash,
          patterns: validSuggestion.patterns,
        })
      );
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

      expect(logger.error).toHaveBeenCalledWith(
        "Invalid rule suggestion format",
        expect.any(Object)
      );
    });

    it("should handle database errors", async () => {
      const request = new NextRequest("http://localhost/api/adapt/suggest", {
        method: "POST",
        body: JSON.stringify(validSuggestion),
      });

      const dbError = new Error("Database error");
      dbError.name = "PrismaClientKnownRequestError";
      vi.mocked(prisma.$queryRaw).mockRejectedValueOnce(dbError);

      const response = await POST(request);

      expect(prisma.$queryRaw).toHaveBeenCalledTimes(1);
      expect(logger.error).toHaveBeenCalledWith(
        "Failed to process adaptation suggestion",
        expect.objectContaining({
          error: expect.any(Error),
          errorType: "PrismaClientKnownRequestError",
        })
      );

      expect(response.status).toBe(500);
      expect(response.json()).resolves.toEqual({
        success: false,
        error: "Database operation failed",
        code: "ADAPT999",
        details: "Database error",
        metadata: expect.objectContaining({
          took: expect.any(Number),
          timestamp: expect.any(String),
          errorType: "PrismaClientKnownRequestError",
        }),
      });
    });

    it("should handle empty database response", async () => {
      const request = new NextRequest("http://localhost/api/adapt/suggest", {
        method: "POST",
        body: JSON.stringify(validSuggestion),
      });

      vi.mocked(prisma.$queryRaw).mockResolvedValue([]);

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data).toEqual({
        success: false,
        error: "Failed to process adaptation suggestion",
        code: "ADAPT999",
        details: "Failed to create adaptation suggestion - no rows returned",
        metadata: expect.objectContaining({
          took: expect.any(Number),
          timestamp: expect.any(String),
          errorType: "Error",
        }),
      });
    });

    it("should handle unknown errors", async () => {
      const request = new NextRequest("http://localhost/api/adapt/suggest", {
        method: "POST",
        body: JSON.stringify(validSuggestion),
      });

      vi.mocked(prisma.$queryRaw).mockImplementation(() => {
        throw "Unknown error"; // Non-Error object
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data).toEqual({
        success: false,
        error: "Failed to process adaptation suggestion",
        code: "ADAPT999",
        details: "Unknown error",
        metadata: expect.objectContaining({
          took: expect.any(Number),
          timestamp: expect.any(String),
          errorType: "string",
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

      vi.mocked(prisma.$queryRaw).mockResolvedValue([
        { ...validSuggestion, id: mockUUID, status: "PENDING" },
      ]);

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

      vi.mocked(prisma.$queryRaw).mockResolvedValue([
        { ...validSuggestion, id: mockUUID, status: "PENDING" },
      ]);

      const response = await POST(request);
      const data = await response.json();

      expect(data.metadata).toBeDefined();
      expect(data.metadata.took).toBeGreaterThanOrEqual(0);
      expect(Date.parse(data.metadata.timestamp)).not.toBeNaN();
    });
  });
});

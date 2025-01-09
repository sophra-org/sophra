import logger from "@lib/shared/logger";
import { EngagementType, SignalType } from "@prisma/client";
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

vi.mock("@lib/shared/database/client", () => ({
  prisma: {
    feedbackRequest: {
      findMany: vi.fn(),
      create: vi.fn(),
      findFirst: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      count: vi.fn(),
      upsert: vi.fn(),
    },
  },
}));

// Import after mocks
import { prisma } from "@lib/shared/database/client";
import { GET, POST } from "./route";

describe("Feedback Route Handler", () => {
  const mockFeedback = {
    feedback: [
      {
        queryId: "q1",
        rating: 0.8,
        metadata: {
          userAction: SignalType.USER_BEHAVIOR_CLICK,
          resultId: "r1",
          queryHash: "hash1",
          timestamp: new Date().toISOString(),
          engagementType: EngagementType.CLICK,
        },
      },
    ],
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("GET /api/nous/learn/feedback", () => {
    it("should fetch feedback requests successfully", async () => {
      const mockResponse = [
        {
          id: "1",
          feedback: mockFeedback.feedback,
          timestamp: new Date(),
          meta: {
            uniqueQueries: 1,
            averageRating: 0.8,
            feedbackCount: 1,
          },
        },
      ];

      vi.mocked(prisma.feedbackRequest.findMany).mockResolvedValue(
        mockResponse
      );

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual({
        success: true,
        data: mockResponse,
        meta: { total: 1 },
      });
    });

    it("should handle database errors gracefully", async () => {
      vi.mocked(prisma.feedbackRequest.findMany).mockRejectedValue(
        new Error("DB Error")
      );

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data).toEqual({
        success: false,
        error: "Failed to fetch feedback",
        meta: { total: 0 },
      });
      expect(logger.error).toHaveBeenCalledWith(
        "Failed to fetch feedback:",
        expect.any(Error)
      );
    });
  });

  describe("POST /api/nous/learn/feedback", () => {
    it("should create feedback successfully", async () => {
      const mockResponse = {
        id: "1",
        feedback: mockFeedback.feedback,
        timestamp: new Date(),
        meta: {
          uniqueQueries: 1,
          averageRating: 0.8,
          feedbackCount: 1,
        },
      };

      vi.mocked(prisma.feedbackRequest.create).mockResolvedValue(mockResponse);

      const request = new NextRequest(
        "http://localhost:3000/api/nous/learn/feedback"
      );
      request.json = vi.fn().mockResolvedValue(mockFeedback);

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data).toEqual({
        success: true,
        data: mockResponse,
        meta: { total: 1 },
      });
    });

    it("should validate request format", async () => {
      const invalidFeedback = {
        feedback: [{ invalid: "data" }],
      };

      const request = new NextRequest(
        "http://localhost:3000/api/nous/learn/feedback"
      );
      request.json = vi.fn().mockResolvedValue(invalidFeedback);

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data).toMatchObject({
        success: false,
        error: "Invalid request format",
        details: expect.any(Object),
      });
    });

    it("should handle database errors during creation", async () => {
      vi.mocked(prisma.feedbackRequest.create).mockRejectedValue(
        new Error("DB Error")
      );

      const request = new NextRequest(
        "http://localhost:3000/api/nous/learn/feedback"
      );
      request.json = vi.fn().mockResolvedValue(mockFeedback);

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data).toEqual({
        success: false,
        error: "Failed to record feedback",
        meta: { total: 0 },
      });
      expect(logger.error).toHaveBeenCalledWith(
        "Failed to record feedback:",
        expect.any(Error)
      );
    });
  });
});

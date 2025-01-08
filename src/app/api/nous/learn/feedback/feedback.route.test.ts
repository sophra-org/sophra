import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import logger from '@lib/shared/logger';
import { SignalType, EngagementType } from "@prisma/client";

// Mock modules
vi.mock('@lib/shared/logger', () => ({
  default: {
    error: vi.fn(),
    info: vi.fn()
  }
}));

vi.mock('next/server', () => ({
  NextRequest: vi.fn().mockImplementation((url) => ({
    url,
    nextUrl: new URL(url),
    headers: new Headers(),
    json: vi.fn()
  })),
  NextResponse: {
    json: vi.fn().mockImplementation((data, init) => ({
      status: init?.status || 200,
      ok: init?.status ? init.status >= 200 && init.status < 300 : true,
      headers: new Headers(),
      json: async () => data
    }))
  }
}));

vi.mock('@lib/shared/database/client', () => {
  const mockPrisma = {
    $queryRaw: vi.fn(),
    $executeRaw: vi.fn(),
    $transaction: vi.fn(),
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
    feedback: {
      findMany: vi.fn(),
      create: vi.fn(),
      findFirst: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    }
  };
  return { prisma: mockPrisma };
});

// Import after mocks
import { prisma } from '@lib/shared/database/client';
import { GET, POST } from './route';

describe("Feedback Route Handler", () => {
  const mockFeedback = {
    feedback: [
      {
        queryId: "q1",
        rating: 0.8,
        metadata: {
          userAction: SignalType.SEARCH,
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
      const mockResponse = [{
        id: "1", 
        content: mockFeedback.feedback,
        createdAt: new Date(),
        metrics: {
          uniqueUsers: 1,
          averageRating: 0.8,
          totalFeedback: 1
        }
      }];

      const mockFeedbackResponse = mockResponse.map(item => ({
        id: item.id,
        timestamp: item.createdAt,
        feedback: {
          feedback: item.content
        }
      }));

      vi.mocked(prisma.feedbackRequest.findMany).mockResolvedValue(mockFeedbackResponse);
      vi.mocked(prisma.$queryRaw).mockResolvedValue([{ count: 1 }]);

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual({
        success: true,
        data: mockResponse,
        meta: { total: 1 }
      });
    });

    it("should handle empty results", async () => {
      vi.mocked(prisma.feedbackRequest.findMany).mockResolvedValue([]);

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toEqual([]);
    });

    it("should handle database errors gracefully", async () => {
      vi.mocked(prisma.feedbackRequest.findMany).mockRejectedValue(new Error("DB Error"));

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data).toEqual({
        success: false,
        error: "Failed to fetch feedback",
        meta: { total: 0 }
      });
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
          feedbackCount: 1
        }
      };

      vi.mocked(prisma.feedbackRequest.create).mockResolvedValue(mockResponse);

      const request = new NextRequest("http://localhost:3000/api/nous/learn/feedback");
      request.json = vi.fn().mockResolvedValue(mockFeedback);

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data).toEqual({
        success: true,
        data: mockResponse,
        meta: { total: 1 }
      });
    });

    it("should handle invalid feedback data", async () => {
      const invalidFeedback = {
        feedback: [
          {
            queryId: "q1",
            // Missing required fields
          },
        ],
      };

      const request = new NextRequest("http://localhost:3000/api/nous/learn/feedback");
      request.json = vi.fn().mockResolvedValue(invalidFeedback);

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toBe("Invalid request format");
      expect(data.details).toBeDefined();
    });

    it("should handle missing feedback array", async () => {
      const invalidFeedback = {};

      const request = new NextRequest("http://localhost:3000/api/nous/learn/feedback");
      request.json = vi.fn().mockResolvedValue(invalidFeedback);

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toBe("Invalid request format");
      expect(data.details).toBeDefined();
    });

    it("should handle invalid rating values", async () => {
      const invalidFeedback = {
        feedback: [
          {
            ...mockFeedback.feedback[0],
            rating: 1.5, // Invalid rating > 1
          },
        ],
      };

      const request = new NextRequest("http://localhost:3000/api/nous/learn/feedback");
      request.json = vi.fn().mockResolvedValue(invalidFeedback);

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toBe("Invalid request format");
      expect(data.details).toBeDefined();
    });

    it("should handle database errors during creation", async () => {
      vi.mocked(prisma.feedbackRequest.create).mockRejectedValue(new Error("DB Error"));

      const request = new NextRequest("http://localhost:3000/api/nous/learn/feedback");
      request.json = vi.fn().mockResolvedValue(mockFeedback);

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data).toEqual({
        success: false,
        error: "Failed to record feedback",
        meta: { total: 0 }
      });
    });

    it("should handle malformed JSON in request body", async () => {
      const request = new NextRequest("http://localhost:3000/api/nous/learn/feedback");
      request.json = vi.fn().mockRejectedValue(new SyntaxError("Unexpected token"));

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error).toBe("Failed to record feedback");
    });
  });
});

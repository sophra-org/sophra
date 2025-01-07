import { vi } from "vitest";
import { mockPrisma } from "~/vitest.setup";

vi.mock("next/server", () => {
  return {
    NextResponse: {
      json: (data: any, init?: { status?: number }) => ({
        status: init?.status || 200,
        ok: init?.status ? init.status >= 200 && init.status < 300 : true,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: () => Promise.resolve(data)
      })
    },
    NextRequest: class {
      url: string;
      nextUrl: URL;
      searchParams: URLSearchParams;
      headers: Headers;
      body: string;

      constructor(url: string, init?: { method?: string; body?: string }) {
        this.url = url;
        this.nextUrl = new URL(url);
        this.searchParams = new URL(url).searchParams;
        this.headers = new Headers();
        this.body = init?.body || '';
      }

      json() {
        try {
          if (this.body === 'invalid json') {
            throw new SyntaxError('Unexpected token i in JSON at position 0');
          }
          return Promise.resolve(this.body ? JSON.parse(this.body) : {});
        } catch (error) {
          return Promise.reject(error);
        }
      }
    }
  };
});

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { SignalType, EngagementType } from "@prisma/client";
import { GET, POST } from "./route";

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

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe("GET /api/nous/learn/feedback", () => {
    it("should fetch feedback requests successfully", async () => {
      const mockResponse = [{
        id: "1",
        feedback: mockFeedback.feedback,
        timestamp: new Date(),
      }];

      vi.mocked(mockPrisma.feedbackRequest.findMany).mockResolvedValue(mockResponse);

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toEqual(mockResponse);
      expect(mockPrisma.feedbackRequest.findMany).toHaveBeenCalledWith({
        orderBy: { timestamp: "desc" },
        take: 100,
      });
    });

    it("should handle empty results", async () => {
      vi.mocked(mockPrisma.feedbackRequest.findMany).mockResolvedValue([]);

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toEqual([]);
    });

    it("should handle database errors gracefully", async () => {
      vi.mocked(mockPrisma.feedbackRequest.findMany).mockRejectedValue(new Error("DB Error"));

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error).toBe("Failed to fetch feedback");
    });
  });

  describe("POST /api/nous/learn/feedback", () => {
    it("should create feedback successfully", async () => {
      const mockResponse = {
        id: "1",
        feedback: mockFeedback.feedback,
        timestamp: new Date(),
      };

      vi.mocked(mockPrisma.feedbackRequest.create).mockResolvedValue(mockResponse);

      const request = new (vi.mocked(require('next/server').NextRequest))(
        "http://localhost:3000/api/nous/learn/feedback",
        {
          method: "POST",
          body: JSON.stringify(mockFeedback),
        }
      );

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toEqual(expect.objectContaining({
        id: mockResponse.id,
        feedbackCount: 1,
        feedback: expect.arrayContaining([
          expect.objectContaining({
            queryId: mockFeedback.feedback[0].queryId,
            rating: mockFeedback.feedback[0].rating,
          })
        ]),
        metadata: expect.objectContaining({
          uniqueQueries: 1,
          averageRating: 0.8,
        })
      }));
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

      const request = new (vi.mocked(require('next/server').NextRequest))(
        "http://localhost:3000/api/nous/learn/feedback",
        {
          method: "POST",
          body: JSON.stringify(invalidFeedback),
        }
      );

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toBe("Invalid request format");
      expect(data.details).toBeDefined();
    });

    it("should handle missing feedback array", async () => {
      const invalidFeedback = {};

      const request = new (vi.mocked(require('next/server').NextRequest))(
        "http://localhost:3000/api/nous/learn/feedback",
        {
          method: "POST",
          body: JSON.stringify(invalidFeedback),
        }
      );

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

      const request = new (vi.mocked(require('next/server').NextRequest))(
        "http://localhost:3000/api/nous/learn/feedback",
        {
          method: "POST",
          body: JSON.stringify(invalidFeedback),
        }
      );

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toBe("Invalid request format");
      expect(data.details).toBeDefined();
    });

    it("should handle database errors during creation", async () => {
      vi.mocked(mockPrisma.feedbackRequest.create).mockRejectedValue(new Error("DB Error"));

      const request = new (vi.mocked(require('next/server').NextRequest))(
        "http://localhost:3000/api/nous/learn/feedback",
        {
          method: "POST",
          body: JSON.stringify(mockFeedback),
        }
      );

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error).toBe("Failed to record feedback");
    });

    it("should handle malformed JSON in request body", async () => {
      const request = new (vi.mocked(require('next/server').NextRequest))(
        "http://localhost:3000/api/nous/learn/feedback",
        {
          method: "POST",
          body: "invalid json",
        }
      );

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error).toBe("Failed to record feedback");
    });
  });
}); 
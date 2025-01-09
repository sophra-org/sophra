import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest, NextResponse } from "next/server";
import { mockPrisma } from "~/vitest.setup";
import { GET } from "./route";

// Mock NextRequest/Response
vi.mock("next/server", () => ({
  NextRequest: vi.fn().mockImplementation((url) => ({
    url,
    nextUrl: new URL(url),
    headers: new Headers(),
    searchParams: new URL(url).searchParams,
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

describe("Events Route Tests", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("GET /api/nous/learn/events", () => {
    it("should fetch events with default parameters", async () => {
      const mockEvents = [
        {
          id: "mock-suggestion-id",
          type: "SEARCH_PATTERN",
          priority: "HIGH",
          timestamp: new Date(),
          processedAt: new Date(),
          metadata: {
            source: "API",
            timestamp: new Date(),
          },
          createdAt: new Date(),
          updatedAt: new Date(),
          status: "PENDING",
          correlationId: "corr-1",
          sessionId: "session-1",
          userId: "user-1",
          clientId: "client-1",
          environment: "test",
          version: "1.0.0",
          tags: ["test"],
          error: null,
          retryCount: 0,
        },
      ];

      mockPrisma.$queryRaw.mockResolvedValueOnce([1]); // DB check
      mockPrisma.$queryRaw.mockResolvedValueOnce(mockEvents);

      const request = new NextRequest(
        "http://localhost:3000/api/nous/learn/events"
      );
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual({
        success: true,
        data: mockEvents,
        meta: {
          total: mockEvents.length,
          limit: 100,
          timestamp: expect.any(String),
        },
      });
    });
  });
});

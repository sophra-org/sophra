import { serviceManager } from "@lib/cortex/utils/service-manager";
import logger from "@lib/shared/logger";
import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { GET, POST } from "./route";

// Mock dependencies
vi.mock("@lib/cortex/utils/service-manager", () => ({
  serviceManager: {
    getServices: vi.fn(),
  },
}));

vi.mock("@lib/shared/logger", () => ({
  default: {
    error: vi.fn(),
  },
}));

describe("Sessions API Additional Tests", () => {
  const mockSessionsService = {
    createSession: vi.fn(),
    getSession: vi.fn(),
  };

  const mockRedisService = {
    set: vi.fn(),
  };

  const mockMetricsService = {
    recordLatency: vi.fn(),
    incrementSearchError: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();

    // Setup default mock implementations
    vi.mocked(serviceManager.getServices).mockResolvedValue({
      sessions: mockSessionsService,
      redis: mockRedisService,
      metrics: mockMetricsService,
    } as any);

    mockSessionsService.createSession.mockImplementation((data) =>
      Promise.resolve({
        id: "test-session-id",
        userId: data?.userId || "test-user",
        metadata: data?.metadata || {},
        createdAt: new Date(),
        updatedAt: new Date(),
        startedAt: new Date(),
        lastActiveAt: new Date(),
      })
    );
  });

  describe("POST Endpoint", () => {
    describe("Request Validation", () => {
      it("should handle invalid JSON body", async () => {
        const request = new NextRequest("http://localhost/api/sessions", {
          method: "POST",
          body: "invalid json",
        });

        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(400);
        expect(data.success).toBe(false);
        expect(data.error).toBe("Invalid JSON body");
      });

      it("should validate metadata type", async () => {
        const request = new NextRequest("http://localhost/api/sessions", {
          method: "POST",
          body: JSON.stringify({
            metadata: "invalid-type", // Should be an object
          }),
        });

        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(400);
        expect(data.success).toBe(false);
        expect(data.error).toBe("Metadata must be an object");
      });

      it("should validate userId type", async () => {
        const request = new NextRequest("http://localhost/api/sessions", {
          method: "POST",
          body: JSON.stringify({
            userId: 123, // Should be a string
          }),
        });

        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(400);
        expect(data.success).toBe(false);
        expect(data.error).toBe("User ID must be a string");
      });
    });

    describe("Session Creation", () => {
      it("should create session successfully", async () => {
        const request = new NextRequest("http://localhost/api/sessions", {
          method: "POST",
          body: JSON.stringify({
            userId: "test-user",
            metadata: { source: "test" },
          }),
        });

        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.success).toBe(true);
        expect(data.data).toEqual({
          id: "test-session-id",
          userId: "test-user",
          metadata: { source: "test" },
          createdAt: expect.any(String),
          updatedAt: expect.any(String),
          startedAt: expect.any(String),
          lastActiveAt: expect.any(String),
        });
      });

      it("should handle optional fields", async () => {
        const mockSession = {
          id: "test-session-id",
          userId: "test-user",
          metadata: {},
          createdAt: new Date(),
          updatedAt: new Date(),
          startedAt: new Date(),
          lastActiveAt: new Date(),
        };

        mockSessionsService.createSession.mockResolvedValue(mockSession);

        const request = new NextRequest("http://localhost/api/sessions", {
          method: "POST",
          body: JSON.stringify({}), // No userId or metadata
        });

        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.success).toBe(true);
        expect(data.data).toEqual({
          sessionId: mockSession.id,
          userId: mockSession.userId,
          metadata: mockSession.metadata,
        });
      });

      it("should cache session in Redis", async () => {
        const request = new NextRequest("http://localhost/api/sessions", {
          method: "POST",
          body: JSON.stringify({
            userId: "test-user",
          }),
        });

        await POST(request);

        expect(mockRedisService.set).toHaveBeenCalledWith(
          "session:test-session-id",
          expect.any(String),
          3600
        );
      });

      it("should record metrics", async () => {
        const request = new NextRequest("http://localhost/api/sessions", {
          method: "POST",
          body: JSON.stringify({}),
        });

        await POST(request);

        expect(mockMetricsService.recordLatency).toHaveBeenCalledWith(
          "session_creation",
          "api",
          expect.any(Number)
        );
      });
    });

    describe("Error Handling", () => {
      it("should handle session creation failure", async () => {
        mockSessionsService.createSession.mockRejectedValue(
          new Error("Creation failed")
        );

        const request = new NextRequest("http://localhost/api/sessions", {
          method: "POST",
          body: JSON.stringify({}),
        });

        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(500);
        expect(data.success).toBe(false);
        expect(data.error).toBe("Failed to create session");
        expect(mockMetricsService.incrementSearchError).toHaveBeenCalledWith({
          search_type: "session",
          index: "sessions",
          error_type: "Error",
        });
      });

      it("should handle Redis caching failure", async () => {
        mockRedisService.set.mockRejectedValue(new Error("Redis error"));

        const request = new NextRequest("http://localhost/api/sessions", {
          method: "POST",
          body: JSON.stringify({}),
        });

        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(500);
        expect(data.success).toBe(false);
        expect(data.error).toBe("Failed to create session");
        expect(logger.error).toHaveBeenCalledWith(
          "Failed to create session",
          expect.any(Object)
        );
      });

      it("should handle non-Error exceptions", async () => {
        mockSessionsService.createSession.mockRejectedValue("Unknown error");

        const request = new NextRequest("http://localhost/api/sessions", {
          method: "POST",
          body: JSON.stringify({}),
        });

        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(500);
        expect(data.success).toBe(false);
        expect(data.error).toBe("Failed to create session");
        expect(data.details).toBe("Unknown error");
        expect(mockMetricsService.incrementSearchError).toHaveBeenCalledWith({
          search_type: "session",
          index: "sessions",
          error_type: "unknown",
        });
      });
    });
  });

  describe("GET Endpoint", () => {
    describe("Parameter Validation", () => {
      it("should require session ID", async () => {
        const request = new NextRequest("http://localhost/api/sessions");

        const response = await GET(request);
        const data = await response.json();

        expect(response.status).toBe(400);
        expect(data.success).toBe(false);
        expect(data.error).toBe("Session ID required");
      });
    });

    describe("Session Retrieval", () => {
      it("should retrieve session successfully", async () => {
        const mockSession = {
          id: "test-session-id",
          userId: "test-user",
          metadata: {},
          createdAt: new Date(),
          updatedAt: new Date(),
          startedAt: new Date(),
          lastActiveAt: new Date(),
        };

        mockSessionsService.getSession.mockResolvedValue(mockSession);

        const request = new NextRequest(
          "http://localhost/api/sessions?id=test-session-id"
        );
        const response = await GET(request);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.success).toBe(true);
        expect(data.data).toEqual({
          id: mockSession.id,
          userId: mockSession.userId,
          metadata: mockSession.metadata,
        });
      });

      it("should handle session not found", async () => {
        mockSessionsService.getSession.mockResolvedValue(null);

        const request = new NextRequest(
          "http://localhost/api/sessions?id=non-existent"
        );

        const response = await GET(request);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.data).toBeNull();
      });
    });

    describe("Error Handling", () => {
      it("should handle retrieval errors", async () => {
        mockSessionsService.getSession.mockRejectedValue(
          new Error("Retrieval failed")
        );

        const request = new NextRequest(
          "http://localhost/api/sessions?id=test-session-id"
        );

        const response = await GET(request);
        const data = await response.json();

        expect(response.status).toBe(500);
        expect(data.success).toBe(false);
        expect(data.error).toBe("Failed to retrieve session");
        expect(logger.error).toHaveBeenCalledWith(
          "Failed to retrieve session",
          expect.any(Object)
        );
      });
    });
  });

  describe("Helper Functions", () => {
    beforeEach(() => {
      vi.clearAllMocks();
      mockRedisService.set.mockResolvedValue(undefined);
      vi.mocked(serviceManager.getServices).mockResolvedValue({
        sessions: mockSessionsService,
        redis: mockRedisService,
        metrics: mockMetricsService,
      } as any);
    });

    it("should convert Prisma session format correctly", async () => {
      const mockSession = {
        id: "test-session-id",
        userId: "test-user",
        metadata: { source: "test" },
        createdAt: new Date(),
        updatedAt: new Date(),
        startedAt: new Date(),
        lastActiveAt: new Date(),
      };

      mockSessionsService.createSession.mockResolvedValue(mockSession);

      const request = new NextRequest("http://localhost/api/sessions", {
        method: "POST",
        body: JSON.stringify({
          userId: "test-user",
          metadata: { source: "test" },
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(data.success).toBe(true);
      expect(data.data).toEqual({
        id: "test-session-id",
        userId: "test-user",
        metadata: { source: "test" },
        createdAt: expect.any(String),
        updatedAt: expect.any(String),
        startedAt: expect.any(String),
        lastActiveAt: expect.any(String),
      });
    });

    it("should handle null metadata in conversion", async () => {
      const mockSession = {
        id: "test-session-id",
        userId: "test-user",
        metadata: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        startedAt: new Date(),
        lastActiveAt: new Date(),
      };

      mockSessionsService.createSession.mockResolvedValue(mockSession);

      const request = new NextRequest("http://localhost/api/sessions", {
        method: "POST",
        body: JSON.stringify({
          userId: "test-user",
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(data.success).toBe(true);
      expect(data.data.metadata).toEqual({});
    });
  });
});

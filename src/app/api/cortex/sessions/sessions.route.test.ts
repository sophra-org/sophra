import { mockPrisma } from "@/../vitest.setup";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/shared/database/client", () => ({
  prisma: mockPrisma,
}));

vi.mock("@/lib/cortex/utils/service-manager", () => ({
  serviceManager: {
    getServices: vi.fn(),
  },
}));

vi.mock("@/lib/shared/logger", () => ({
  default: {
    error: vi.fn(),
  },
}));

vi.mock("next/server", () => ({
  NextRequest: vi.fn().mockImplementation((url, options = {}) => ({
    url,
    method: options.method || "GET",
    headers: new Headers(options.headers || {}),
    body: options.body,
    json: async () => (options.body ? JSON.parse(options.body) : undefined),
    nextUrl: new URL(url),
    searchParams: new URLSearchParams(new URL(url).search),
  })),
  NextResponse: {
    json: (data: any, init?: ResponseInit) => ({
      status: init?.status || 200,
      headers: new Headers(init?.headers || {}),
      json: async () => data,
      ok: true,
      body: JSON.stringify(data),
    }),
  },
}));

import { Services } from "@/lib/cortex/types/services";
import { serviceManager } from "@/lib/cortex/utils/service-manager";
import logger from "@/lib/shared/logger";
import { NextRequest } from "next/server";
import { GET, POST } from "./route";

describe("Sessions API", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("POST /api/sessions", () => {
    it("should create a new session", async () => {
      const mockSession = {
        id: "test-id",
        userId: "user-123",
        metadata: { key: "value" },
        createdAt: new Date(),
        updatedAt: new Date(),
        startedAt: new Date(),
        lastActiveAt: new Date(),
      };

      const mockServices = {
        sessions: {
          createSession: vi.fn().mockResolvedValue(mockSession),
        },
        redis: {
          set: vi.fn().mockResolvedValue(undefined),
        },
        metrics: {
          recordLatency: vi.fn(),
        },
      };

      vi.mocked(serviceManager.getServices).mockResolvedValue(
        mockServices as unknown as Services
      );

      const req = new NextRequest("http://localhost/api/sessions", {
        method: "POST",
        body: JSON.stringify({
          userId: "user-123",
          metadata: { key: "value" },
        }),
      });

      const response = await POST(req);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toEqual({
        id: mockSession.id,
        userId: mockSession.userId,
        metadata: mockSession.metadata,
        createdAt: expect.any(Date),
        updatedAt: expect.any(Date),
        startedAt: expect.any(Date),
        lastActiveAt: expect.any(Date),
      });
      expect(mockServices.sessions.createSession).toHaveBeenCalledWith({
        userId: "user-123",
        metadata: { key: "value" },
      });
      expect(mockServices.redis.set).toHaveBeenCalledWith(
        "session:test-id",
        expect.any(String),
        3600
      );
    });

    it("should handle service errors", async () => {
      const mockError = new Error("Service error");
      vi.mocked(serviceManager.getServices).mockRejectedValue(mockError);

      const req = new NextRequest("http://localhost/api/sessions", {
        method: "POST",
        body: JSON.stringify({
          userId: "user-123",
        }),
      });

      const response = await POST(req);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error).toBe("Failed to create session");
      expect(logger.error).toHaveBeenCalledWith(
        "Failed to create session",
        expect.any(Object)
      );
    });
  });

  describe("GET /api/sessions", () => {
    it("should retrieve a session by id", async () => {
      const mockSession = {
        id: "test-id",
        userId: "user-123",
        metadata: {},
        createdAt: new Date(),
        updatedAt: new Date(),
        startedAt: new Date(),
        lastActiveAt: new Date(),
      };

      const mockServices = {
        sessions: {
          getSession: vi.fn().mockResolvedValue(mockSession),
        },
      };

      vi.mocked(serviceManager.getServices).mockResolvedValue(
        mockServices as unknown as Services
      );

      const req = new NextRequest("http://localhost/api/sessions?id=test-id");
      const response = await GET(req);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toEqual({
        id: mockSession.id,
        userId: mockSession.userId,
        username: null,
        metadata: mockSession.metadata,
      });
      expect(mockServices.sessions.getSession).toHaveBeenCalledWith("test-id");
    });

    it("should return 400 when session id is missing", async () => {
      const req = new NextRequest("http://localhost/api/sessions");
      const response = await GET(req);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toBe("Session ID required");
    });

    it("should handle service errors", async () => {
      const mockError = new Error("Service error");
      vi.mocked(serviceManager.getServices).mockRejectedValue(mockError);

      const req = new NextRequest("http://localhost/api/sessions?id=test-id");
      const response = await GET(req);
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

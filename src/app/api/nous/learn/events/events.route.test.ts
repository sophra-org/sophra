import { describe, it, expect, beforeEach, vi } from "vitest";
import { NextRequest } from "next/server";
import logger from '@lib/shared/logger';
import { LearningEventType } from '@lib/nous/types/learning';

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
    learningEvent: {
      findMany: vi.fn(),
      count: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      upsert: vi.fn(),
    },
    $queryRaw: vi.fn(),
    $transaction: vi.fn((operations) =>
      Array.isArray(operations)
        ? Promise.all(operations)
        : Promise.resolve(operations())
    ),
    $disconnect: vi.fn(),
    $connect: vi.fn(),
    raw: vi.fn().mockImplementation((query) => Promise.resolve([])),
    findMany: vi.fn().mockResolvedValue([]),
    create: vi.fn().mockImplementation((data) => Promise.resolve(data)),
  }
  return { prisma: mockPrisma }
});

// Import after mocks
import { prisma } from '@lib/shared/database/client';
import { GET } from './route';
import type { LearningEvent, Prisma } from '@prisma/client';

describe("Learning Events Route Handler", () => {
  const mockEvent: LearningEvent = {
    id: "test-1",
    type: "SEARCH_PATTERN",
    priority: "HIGH",
    timestamp: new Date('2023-01-01T00:00:00Z'),
    processedAt: null,
    metadata: {
      source: "test",
      query: "test query",
      userId: "test-user"
    } as Prisma.JsonValue,
    createdAt: new Date('2023-01-01T00:00:00Z'),
    updatedAt: new Date('2023-01-01T00:00:00Z'),
    status: "PENDING",
    correlationId: "test-correlation-id",
    sessionId: "test-session-id", 
    userId: "test-user-id",
    clientId: "test-client-id",
    environment: "test",
    version: "1.0.0",
    tags: ["test"],
    error: "test error",
    retryCount: 0
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("GET /api/nous/learn/events", () => {
    it("should fetch events with default parameters", async () => {
      const mockResponse = {
        ...mockEvent,
        timestamp: new Date('2023-01-01T00:00:00Z'),
        createdAt: new Date('2023-01-01T00:00:00Z'),
        updatedAt: new Date('2023-01-01T00:00:00Z')
      };

      const mockPrismaPromise = (value: any) => {
        const promise = Promise.resolve(value) as any;
        promise[Symbol.toStringTag] = "PrismaPromise";
        return promise;
      };

      vi.mocked(prisma.$queryRaw).mockReturnValueOnce(mockPrismaPromise([1]));
      vi.mocked(prisma.$queryRaw).mockReturnValueOnce(mockPrismaPromise([mockResponse]));

      const request = new NextRequest("http://localhost:3000/api/nous/learn/events");
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toEqual([{
        ...mockEvent,
        createdAt: expect.any(String),
        updatedAt: expect.any(String)
      }]);
      expect(data.meta).toEqual({
        total: 1,
        timestamp: expect.any(String),
        limit: 100
      });
    });

    it("should handle filtering by type and date range", async () => {
      const mockResponse = {
        ...mockEvent,
        timestamp: new Date('2023-01-01T00:00:00Z'),
        createdAt: new Date('2023-01-01T00:00:00Z'),
        updatedAt: new Date('2023-01-01T00:00:00Z')
      };

      const mockPrismaPromise = (value: any) => {
        const promise = Promise.resolve(value) as any;
        promise[Symbol.toStringTag] = "PrismaPromise";
        return promise;
      };

      vi.mocked(prisma.$queryRaw).mockReturnValueOnce(mockPrismaPromise([1]));
      vi.mocked(prisma.$queryRaw).mockReturnValueOnce(mockPrismaPromise([mockResponse]));

      const request = new NextRequest(
        "http://localhost:3000/api/nous/learn/events?type=SEARCH_PATTERN&startDate=2023-01-01&endDate=2023-12-31"
      );
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toEqual([{
        ...mockEvent,
        createdAt: expect.any(String),
        updatedAt: expect.any(String)
      }]);
      expect(data.meta).toEqual({
        total: 1,
        timestamp: expect.any(String),
        limit: 100
      });
    });

    it("should handle invalid query parameters", async () => {
      const request = new NextRequest(
        "http://localhost:3000/api/nous/learn/events?type=INVALID_TYPE"
      );
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toBe("Invalid query parameters");
      expect(data.meta).toEqual({
        timestamp: expect.any(String),
        details: expect.any(Object)
      });
    });

    it("should handle database connection failure", async () => {
      const mockPrismaPromise = () => {
        const promise = Promise.reject(new Error("DB Error")) as any;
        promise[Symbol.toStringTag] = "PrismaPromise";
        return promise;
      };

      vi.mocked(prisma.$queryRaw).mockReturnValueOnce(mockPrismaPromise());

      const request = new NextRequest("http://localhost:3000/api/nous/learn/events");
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(503);
      expect(data.success).toBe(false);
      expect(data.error).toBe("Database connection failed");
      expect(data.meta).toEqual({
        timestamp: expect.any(String),
        errorDetails: expect.any(String)
      });
    });

    it("should handle database query errors gracefully", async () => {
      const mockPrismaPromise = (value: any) => {
        const promise = Promise.resolve(value) as any;
        promise[Symbol.toStringTag] = "PrismaPromise";
        return promise;
      };

      const mockErrorPromise = () => {
        const promise = Promise.reject(new Error("Query Error")) as any;
        promise[Symbol.toStringTag] = "PrismaPromise";
        return promise;
      };

      vi.mocked(prisma.$queryRaw).mockReturnValueOnce(mockPrismaPromise([1]));
      vi.mocked(prisma.$queryRaw).mockReturnValueOnce(mockErrorPromise());

      const request = new NextRequest("http://localhost:3000/api/nous/learn/events");
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.data).toEqual([]);
      expect(data.error).toBe("Failed to retrieve learning events");
      expect(data.meta).toEqual({
        timestamp: expect.any(String),
        errorType: "Error",
        total: 0,
        limit: 100
      });
    });

    it("should handle empty results", async () => {
      const mockPrismaPromise = (value: any) => {
        const promise = Promise.resolve(value) as any;
        promise[Symbol.toStringTag] = "PrismaPromise";
        return promise;
      };

      vi.mocked(prisma.$queryRaw).mockReturnValueOnce(mockPrismaPromise([1]));
      vi.mocked(prisma.$queryRaw).mockReturnValueOnce(mockPrismaPromise([]));

      const request = new NextRequest("http://localhost:3000/api/nous/learn/events");
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toEqual([]);
      expect(data.meta).toEqual({
        total: 0,
        timestamp: expect.any(String),
        limit: 100
      });
    });
  });
});

vi.mock('@prisma/client', () => ({
  PrismaClient: vi.fn(() => mockPrisma),
  Prisma: {
    JsonValue: undefined,
    JsonObject: undefined,
  }
}));

vi.mock('@/lib/shared/database/client', () => ({
  default: mockPrisma,
  prisma: mockPrisma
}));

import { mockPrisma } from '@/lib/shared/test/prisma.mock';
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { NextRequest } from "next/server";
import { GET, POST } from "./route";
import { SignalType } from "@prisma/client";
import { prisma } from "@/lib/shared/database/client";

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
    NextRequest: class MockNextRequest {
      url: string;
      headers: Headers;
      private body: any;

      constructor(url: string, options?: { method?: string; body?: any }) {
        this.url = url;
        this.headers = new Headers();
        this.body = options?.body;
      }

      async json() {
        return typeof this.body === 'string' ? JSON.parse(this.body) : this.body;
      }
    }
  };
});

vi.mock("@/lib/shared/logger", () => ({
  default: {
    error: vi.fn(),
    info: vi.fn(),
  },
}));

describe("Signals Route Handler", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe("GET /api/nous/signals", () => {
    it("should fetch signals with default pagination", async () => {
      const mockSignals = [
        { 
          id: "1", 
          type: SignalType.SEARCH, 
          source: "test",
          value: { test: "data" },
          strength: 1,
          priority: 1,
          timestamp: new Date(),
          processed: false,
          manual: false,
          metadata: null,
          error: null,
          retries: null,
          createdAt: new Date(),
          updatedAt: new Date(),
          processedAt: null,
        },
        { 
          id: "2", 
          type: SignalType.SEARCH, 
          source: "test",
          value: { test: "data" },
          strength: 1,
          priority: 1,
          timestamp: new Date(),
          processed: false,
          manual: false,
          metadata: null,
          error: null,
          retries: null,
          createdAt: new Date(),
          updatedAt: new Date(),
          processedAt: null,
        },
      ];

      vi.mocked(prisma.signal.findMany).mockResolvedValue(mockSignals);
      vi.mocked(prisma.signal.count).mockResolvedValue(2);

      const request = new NextRequest("http://localhost:3000/api/nous/signals");
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toEqual(mockSignals);
      expect(data.metadata.count).toBe(2);
      expect(data.metadata.page).toBe(1);
      expect(data.metadata.pageSize).toBe(50);
    });

    it("should handle filtering by source and type", async () => {
      const mockSignals = [{ 
        id: "1", 
        type: SignalType.SEARCH, 
        source: "test",
        value: { test: "data" },
        strength: 1,
        priority: 1,
        timestamp: new Date(),
        processed: false,
        manual: false,
        metadata: null,
        error: null,
        retries: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        processedAt: null,
      }];

      vi.mocked(prisma.signal.findMany).mockResolvedValue(mockSignals);
      vi.mocked(prisma.signal.count).mockResolvedValue(1);

      const request = new NextRequest(
        "http://localhost:3000/api/nous/signals?source=test&type=SEARCH"
      );
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(vi.mocked(prisma.signal.findMany)).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            source: "test",
            type: "SEARCH",
          },
        })
      );
    });

    it("should handle database errors gracefully", async () => {
      vi.mocked(prisma.signal.findMany).mockRejectedValue(new Error("DB Error"));

      const request = new NextRequest("http://localhost:3000/api/nous/signals");
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
    });
  });

  describe("POST /api/nous/signals", () => {
    it("should create a new signal with valid data", async () => {
      const mockSignal = {
        type: SignalType.SEARCH,
        source: "test",
        value: { test: "data" },
        strength: 1,
        priority: 1,
        timestamp: new Date().toISOString(),
        processed: false,
        manual: false,
        metadata: null,
        error: null,
        retries: null,
      };

      const mockResponse = {
        ...mockSignal,
        id: "1",
        createdAt: new Date(),
        updatedAt: new Date(),
        processedAt: null,
        timestamp: new Date(mockSignal.timestamp),
      };

      vi.mocked(prisma.signal.create).mockResolvedValue(mockResponse);

      const request = new NextRequest("http://localhost:3000/api/nous/signals", {
        method: "POST",
        body: JSON.stringify(mockSignal),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toMatchObject(expect.objectContaining({
        ...mockResponse,
        value: expect.any(Object),
      }));

      expect(prisma.signal.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          type: mockSignal.type,
          source: mockSignal.source,
          value: mockSignal.value,
          strength: mockSignal.strength,
          priority: mockSignal.priority,
          processed: mockSignal.processed,
          manual: mockSignal.manual,
          metadata: mockSignal.metadata,
          error: mockSignal.error,
          retries: mockSignal.retries,
          timestamp: expect.any(Date),
        }),
      });
    });

    it("should handle database errors during creation", async () => {
      const mockSignal = {
        type: SignalType.SEARCH,
        source: "test",
        value: { test: "data" },
        strength: 1,
        priority: 1,
        timestamp: new Date().toISOString(),
        processed: false,
        manual: false,
        metadata: null,
        error: null,
        retries: null,
      };

      vi.mocked(prisma.signal.create).mockRejectedValue(new Error("DB Error"));

      const request = new NextRequest("http://localhost:3000/api/nous/signals", {
        method: "POST",
        body: JSON.stringify(mockSignal),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error).toBe("Failed to create signal");
    });
  });
}); 
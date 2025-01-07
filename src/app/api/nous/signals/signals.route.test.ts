import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { NextRequest } from "next/server";
import { SignalType } from "@prisma/client";
import { GET, POST } from "./route";
import { mockPrisma } from "~/vitest.setup";

vi.mock("@prisma/client", () => ({
  SignalType: {
    SEARCH: "SEARCH",
    PERFORMANCE: "PERFORMANCE",
    USER_BEHAVIOR_IMPRESSION: "USER_BEHAVIOR_IMPRESSION",
    USER_BEHAVIOR_VIEW: "USER_BEHAVIOR_VIEW",
    USER_BEHAVIOR_CLICK: "USER_BEHAVIOR_CLICK",
    USER_BEHAVIOR_CONVERSION: "USER_BEHAVIOR_CONVERSION",
    MODEL_PERFORMANCE: "MODEL_PERFORMANCE",
    FEEDBACK: "FEEDBACK",
    SYSTEM_HEALTH: "SYSTEM_HEALTH",
    SESSION: "SESSION",
  },
}));

vi.mock("@/lib/shared/database/client", () => ({
  default: mockPrisma,
}));

vi.mock("@/lib/shared/logger", () => ({
  default: {
    error: vi.fn(),
  },
}));

vi.mock("next/server", () => ({
  NextRequest: class MockNextRequest {
    url: string;
    method: string;
    headers: Headers;
    private body: any;

    constructor(url: string, init?: { method?: string; body?: string }) {
      this.url = url;
      this.method = init?.method || 'GET';
      this.headers = new Headers();
      this.body = init?.body;
    }

    async json() {
      return this.body ? JSON.parse(this.body) : undefined;
    }
  },
  NextResponse: {
    json: (data: any, init?: { status?: number }) => {
      const response = {
        status: init?.status || 200,
        ok: init?.status ? init.status >= 200 && init.status < 300 : true,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: () => Promise.resolve(data)
      };
      return response;
    }
  },
}));

describe("Signals Route Handler", () => {
  const SignalType = {
    SEARCH: "SEARCH",
    PERFORMANCE: "PERFORMANCE",
    USER_BEHAVIOR_IMPRESSION: "USER_BEHAVIOR_IMPRESSION",
    USER_BEHAVIOR_VIEW: "USER_BEHAVIOR_VIEW",
    USER_BEHAVIOR_CLICK: "USER_BEHAVIOR_CLICK",
    USER_BEHAVIOR_CONVERSION: "USER_BEHAVIOR_CONVERSION",
    MODEL_PERFORMANCE: "MODEL_PERFORMANCE",
    FEEDBACK: "FEEDBACK",
    SYSTEM_HEALTH: "SYSTEM_HEALTH",
    SESSION: "SESSION",
  } as const;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe("GET /api/nous/signals", () => {
    it("should fetch signals with default pagination", async () => {
      const mockSignals = [
        { id: "1", type: SignalType.SEARCH, source: "test", value: {}, error: null, priority: null, retries: null, timestamp: new Date(), processed: false, processedAt: null, manual: false, createdAt: new Date(), updatedAt: new Date(), metadata: null, strength: 1 },
        { id: "2", type: SignalType.SEARCH, source: "test", value: {}, error: null, priority: null, retries: null, timestamp: new Date(), processed: false, processedAt: null, manual: false, createdAt: new Date(), updatedAt: new Date(), metadata: null, strength: 1 },
      ];

      vi.mocked(mockPrisma.signal.findMany).mockResolvedValue(mockSignals);
      vi.mocked(mockPrisma.signal.count).mockResolvedValue(2);

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
      const mockSignals = [
        { id: "1", type: SignalType.SEARCH, source: "test", value: {}, error: null, priority: null, retries: null, timestamp: new Date(), processed: false, processedAt: null, manual: false, createdAt: new Date(), updatedAt: new Date(), metadata: null, strength: 1 }
      ];

      vi.mocked(mockPrisma.signal.findMany).mockResolvedValue(mockSignals);
      vi.mocked(mockPrisma.signal.count).mockResolvedValue(1);

      const request = new NextRequest(
        "http://localhost:3000/api/nous/signals?source=test&type=SEARCH"
      );
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(vi.mocked(mockPrisma.signal.findMany)).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            source: "test",
            type: "SEARCH",
          },
        })
      );
    });

    it("should handle database errors gracefully", async () => {
      vi.mocked(mockPrisma.signal.findMany).mockRejectedValue(new Error("DB Error"));

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
        value: { query: "test query", results: [] },
        strength: 1,
        timestamp: new Date().toISOString(),
        processed: false,
        manual: false,
        metadata: { test: "metadata" },
        error: null,
        retries: null,
        priority: null,
      };

      const mockResponse = {
        ...mockSignal,
        id: "test-signal-1",
        createdAt: new Date(),
        updatedAt: new Date(),
        processedAt: null,
        timestamp: new Date(mockSignal.timestamp),
        value: mockSignal.value,
      };

      vi.mocked(mockPrisma.signal.create).mockResolvedValue(mockResponse);

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

      expect(mockPrisma.signal.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          type: mockSignal.type,
          source: mockSignal.source,
          value: mockSignal.value,
          strength: mockSignal.strength,
          priority: mockSignal.priority,
          timestamp: expect.any(Date),
          processed: mockSignal.processed,
          manual: mockSignal.manual,
          metadata: mockSignal.metadata,
          error: mockSignal.error,
          retries: mockSignal.retries,
        }),
      });
    });

    it("should reject invalid signal data", async () => {
      const invalidSignal = {
        source: "test",
        strength: 1,
        // Missing required fields: type and value
      };

      const request = new NextRequest("http://localhost:3000/api/nous/signals", {
        method: "POST",
        body: JSON.stringify(invalidSignal),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toBe("Invalid request format");
      expect(data.details).toBeDefined();
      expect(data.details.type._errors).toContain("Required");
      expect(data.details.value._errors).toBeDefined();
    });

    it("should handle database errors during creation", async () => {
      const mockSignal = {
        type: SignalType.SEARCH,
        source: "test",
        value: { query: "test query", results: [] },
        strength: 1,
        timestamp: new Date().toISOString(),
        processed: false,
        manual: false,
        metadata: { test: "metadata" },
        error: null,
        retries: null,
        priority: null,
      };

      vi.mocked(mockPrisma.signal.create).mockRejectedValue(new Error("Database error"));

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
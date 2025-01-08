import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { mockPrisma } from "../../../../../../vitest.setup";

// Mocks must be defined before imports
vi.mock("@prisma/client", () => ({
  SignalType: {
    SEARCH: "SEARCH",
    CLICK: "CLICK",
    FEEDBACK: "FEEDBACK",
    CONVERSION: "CONVERSION",
    CUSTOM: "CUSTOM",
  },
  Prisma: {
    SignalScalarFieldEnum: {
      source: "source",
      type: "type",
    },
  },
}));

vi.mock("../../../../../lib/shared/database/client", () => ({
  default: mockPrisma,
  prisma: mockPrisma
}));

vi.mock("../../../../../lib/shared/logger", () => ({
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
      this.body = init?.body ? JSON.parse(init.body) : undefined;
    }

    async json() {
      return this.body;
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

// Imports after mocks
import { NextRequest } from "next/server";
import { GET, POST } from "./route";

describe("Signals Observe Route Handler", () => {
  const SignalType = {
    SEARCH: "SEARCH",
    CLICK: "CLICK",
    FEEDBACK: "FEEDBACK",
    CONVERSION: "CONVERSION",
    CUSTOM: "CUSTOM",
  } as const;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(mockPrisma.signal.groupBy).mockReset();
    // Set up default successful mock implementation
    vi.mocked(mockPrisma.signal.groupBy).mockResolvedValue([]);
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe("GET /api/nous/signals/observe", () => {
    it("should fetch signal stats without filters", async () => {
      const mockStats = [{
        source: "test",
        type: SignalType.SEARCH,
        value: {},
        error: null,
        id: "1",
        priority: 1,
        retries: 0,
        timestamp: new Date(),
        processed: false,
        processedAt: null,
        manual: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        metadata: null,
        strength: 1,
        _count: { _all: 5 },
        _min: { timestamp: new Date("2023-01-01") },
        _max: { timestamp: new Date("2023-12-31") },
        _avg: undefined,
        _sum: undefined,
      }];

      vi.mocked(mockPrisma.signal.groupBy).mockResolvedValue(mockStats);

      const request = new NextRequest("http://localhost:3000/api/nous/signals/observe");
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toEqual([
        {
          source: "test",
          type: SignalType.SEARCH,
          count: 5,
          firstSeen: mockStats[0]._min.timestamp,
          lastSeen: mockStats[0]._max.timestamp,
        },
      ]);
    });

    it("should handle filtering by source and type", async () => {
      const mockStats = [{
        source: "test",
        type: SignalType.SEARCH,
        value: {},
        error: null,
        id: "1",
        priority: 1,
        retries: 0,
        timestamp: new Date(),
        processed: false,
        processedAt: null,
        manual: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        metadata: null,
        strength: 1,
        _count: { _all: 3 },
        _min: { timestamp: new Date("2023-01-01") },
        _max: { timestamp: new Date("2023-12-31") },
        _avg: undefined,
        _sum: undefined,
      }];

      vi.mocked(mockPrisma.signal.groupBy).mockResolvedValue(mockStats);

      const request = new NextRequest(
        "http://localhost:3000/api/nous/signals/observe?source=test&type=SEARCH"
      );
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(vi.mocked(mockPrisma.signal.groupBy)).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            source: "test",
            type: "SEARCH",
          }),
        })
      );
    });

    it("should handle database errors gracefully", async () => {
      vi.mocked(mockPrisma.signal.groupBy).mockRejectedValue(new Error("DB Error"));

      const request = new NextRequest("http://localhost:3000/api/nous/signals/observe");
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error).toBe("Failed to fetch signal stats");
    });
  });

  describe("POST /api/nous/signals/observe", () => {
    it("should fetch detailed signal stats with valid query", async () => {
      const mockStats = [{
        source: "test",
        type: SignalType.SEARCH,
        value: {},
        error: null,
        id: "1",
        priority: 1,
        retries: 0,
        timestamp: new Date(),
        processed: false,
        processedAt: null,
        manual: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        metadata: null,
        strength: 1,
        _count: { _all: 5 },
        _min: { timestamp: new Date("2023-01-01") },
        _max: { timestamp: new Date("2023-12-31") },
        _avg: undefined,
        _sum: undefined,
      }];

      const mockTimeline = [{
        source: "test",
        type: SignalType.SEARCH,
        value: {},
        error: null,
        id: "1",
        priority: 1,
        retries: 0,
        timestamp: new Date("2023-01-01"),
        processed: false,
        processedAt: null,
        manual: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        metadata: null,
        strength: 1,
        _count: { _all: 2 },
        _min: undefined,
        _max: undefined,
        _avg: undefined,
        _sum: undefined,
      }];

      vi.mocked(mockPrisma.signal.groupBy).mockResolvedValueOnce(mockStats);
      vi.mocked(mockPrisma.signal.groupBy).mockResolvedValueOnce(mockTimeline);

      const request = new NextRequest("http://localhost:3000/api/nous/signals/observe", {
        method: "POST",
        body: JSON.stringify({
          source: "test",
          type: "SEARCH",
          timeRange: {
            start: "2023-01-01T00:00:00Z",
            end: "2023-12-31T23:59:59Z",
          },
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.summary).toBeDefined();
      expect(data.data.timeline).toBeDefined();
      expect(data.metadata.timeRange).toBeDefined();
    });

    it("should reject invalid query format", async () => {
      const request = new NextRequest("http://localhost:3000/api/nous/signals/observe", {
        method: "POST",
        body: JSON.stringify({
          timeRange: {
            start: "invalid-date",
            end: "invalid-date",
          },
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toBe("Invalid request format");
    });

    it("should handle database errors gracefully", async () => {
      vi.mocked(mockPrisma.signal.groupBy).mockRejectedValue(new Error("DB Error"));

      const request = new NextRequest("http://localhost:3000/api/nous/signals/observe", {
        method: "POST",
        body: JSON.stringify({
          source: "test",
          type: "SEARCH",
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error).toBe("Failed to observe signals");
    });
  });
});

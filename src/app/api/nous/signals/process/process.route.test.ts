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
}));

vi.mock("../../../../../lib/shared/database/client", () => ({
  default: mockPrisma,
  prisma: mockPrisma
}));

vi.mock("../../../../../lib/shared/logger", () => ({
  default: {
    error: vi.fn(),
    info: vi.fn(),
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
import { SignalType } from "@prisma/client";

describe("Signals Process Route Handler", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe("GET /api/nous/signals/process", () => {
    it("should fetch pending signals with default parameters", async () => {
      const mockSignals = [
        {
          id: "1",
          type: SignalType.SEARCH,
          source: "test",
          value: {},
          error: null,
          priority: null,
          retries: null,
          timestamp: new Date(),
          processed: false,
          processedAt: null,
          manual: false,
          createdAt: new Date(),
          updatedAt: new Date(),
          metadata: { status: "PENDING" },
          strength: 1,
        },
      ];

      vi.mocked(mockPrisma.signal.findMany).mockResolvedValue(mockSignals);

      const request = new NextRequest("http://localhost:3000/api/nous/signals/process");
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toEqual(mockSignals);
      expect(data.metadata.count).toBe(1);
      expect(data.metadata.status).toBe(null);
      expect(vi.mocked(mockPrisma.signal.findMany)).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            processed: false,
            metadata: {
              path: ["status"],
              equals: "PENDING",
            },
          }),
        })
      );
    });

    it("should handle specific status filtering", async () => {
      const mockSignals = [
        {
          id: "1",
          type: SignalType.SEARCH,
          source: "test",
          value: {},
          error: null,
          priority: null,
          retries: null,
          timestamp: new Date(),
          processed: true,
          processedAt: new Date(),
          manual: false,
          createdAt: new Date(),
          updatedAt: new Date(),
          metadata: { status: "COMPLETED" },
          strength: 1,
        },
      ];

      vi.mocked(mockPrisma.signal.findMany).mockResolvedValue(mockSignals);

      const request = new NextRequest(
        "http://localhost:3000/api/nous/signals/process?status=COMPLETED"
      );
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(vi.mocked(mockPrisma.signal.findMany)).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            processed: true,
            metadata: {
              path: ["status"],
              equals: "COMPLETED",
            },
          }),
        })
      );
    });

    it("should handle database errors gracefully", async () => {
      vi.mocked(mockPrisma.signal.findMany).mockRejectedValue(new Error("DB Error"));

      const request = new NextRequest("http://localhost:3000/api/nous/signals/process");
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error).toBe("Failed to fetch pending signals");
    });
  });

  describe("POST /api/nous/signals/process", () => {
    it("should update signal processing status with valid data", async () => {
      const mockSignal = {
        id: "1",
        type: SignalType.SEARCH,
        source: "test",
        value: { result: "success" },
        error: null,
        priority: null,
        retries: null,
        timestamp: new Date(),
        processed: true,
        processedAt: new Date(),
        manual: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        metadata: {
          status: "COMPLETED",
          processingTime: 100,
          processor: "test-processor",
        },
        strength: 1,
      };

      vi.mocked(mockPrisma.signal.update).mockResolvedValue(mockSignal);

      const request = new NextRequest("http://localhost:3000/api/nous/signals/process", {
        method: "POST",
        body: JSON.stringify({
          signalId: "1",
          type: SignalType.SEARCH,
          status: "COMPLETED",
          result: { result: "success" },
          metadata: {
            processingTime: 100,
            processor: "test-processor",
          },
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toEqual(mockSignal);
      expect(data.metadata.processingDuration).toBeDefined();
    });

    it("should reject invalid update format", async () => {
      const request = new NextRequest("http://localhost:3000/api/nous/signals/process", {
        method: "POST",
        body: JSON.stringify({
          // Missing required fields
          status: "INVALID_STATUS",
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toBe("Invalid request format");
    });

    it("should handle processing errors gracefully", async () => {
      const request = new NextRequest("http://localhost:3000/api/nous/signals/process", {
        method: "POST",
        body: JSON.stringify({
          signalId: "1",
          type: SignalType.SEARCH,
          status: "FAILED",
          error: "Processing failed",
        }),
      });

      vi.mocked(mockPrisma.signal.update).mockRejectedValue(new Error("DB Error"));

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error).toBe("Failed to update signal processing");
    });

    it("should handle complex metadata updates", async () => {
      const mockSignal = {
        id: "1",
        type: SignalType.SEARCH,
        source: "test",
        value: {},
        error: null,
        priority: null,
        retries: null,
        timestamp: new Date(),
        processed: true,
        processedAt: new Date(),
        manual: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        metadata: {
          status: "COMPLETED",
          processingSteps: [
            {
              step: "initialization",
              status: "completed",
              duration: 50,
              timestamp: new Date().toISOString(),
            },
            {
              step: "processing",
              status: "completed",
              duration: 150,
              timestamp: new Date().toISOString(),
            },
          ],
          performance: {
            cpuUsage: 0.5,
            memoryUsage: 1024,
            latency: 200,
          },
        },
        strength: 1,
      };

      vi.mocked(mockPrisma.signal.update).mockResolvedValue(mockSignal);

      const request = new NextRequest("http://localhost:3000/api/nous/signals/process", {
        method: "POST",
        body: JSON.stringify({
          signalId: "1",
          type: SignalType.SEARCH,
          status: "COMPLETED",
          metadata: {
            processingSteps: [
              {
                step: "initialization",
                status: "completed",
                duration: 50,
                timestamp: new Date().toISOString(),
              },
              {
                step: "processing",
                status: "completed",
                duration: 150,
                timestamp: new Date().toISOString(),
              },
            ],
            performance: {
              cpuUsage: 0.5,
              memoryUsage: 1024,
              latency: 200,
            },
          },
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.metadata).toMatchObject(mockSignal.metadata);
    });
  });
});

import { Prisma, SignalType } from "@prisma/client";
import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { prisma } from "../../../../lib/shared/database/client";
import logger from "../../../../lib/shared/logger";
import { GET, POST } from "./route";

// Mock dependencies
vi.mock("../../../../lib/shared/database/client", () => ({
  prisma: {
    signal: {
      findMany: vi.fn(),
      count: vi.fn(),
      create: vi.fn(),
    },
  },
}));

vi.mock("../../../../lib/shared/logger", () => ({
  default: {
    error: vi.fn(),
    info: vi.fn(),
  },
}));

describe("Signals API Additional Tests", () => {
  let mockDate: string;
  let mockDateObj: Date;

  beforeEach(() => {
    mockDate = new Date("2025-01-09T11:40:24.173Z").toISOString();
    mockDateObj = new Date(mockDate);
    vi.useFakeTimers();
    vi.setSystemTime(mockDateObj);
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  const createDbSignal = (id: string) => ({
    id,
    type: SignalType.SEARCH,
    source: "test-source",
    value: 123 as Prisma.JsonValue,
    strength: 1.0,
    processed: false,
    manual: false,
    processedAt: null,
    metadata: {} as Prisma.JsonValue,
    error: null,
    retries: 0,
    priority: 0,
    timestamp: mockDateObj,
    createdAt: mockDateObj,
    updatedAt: mockDateObj,
  });

  const createResponseSignal = (id: string) => ({
    id,
    type: SignalType.SEARCH,
    source: "test-source",
    value: 123,
    strength: 1.0,
    processed: false,
    manual: false,
    processedAt: null,
    metadata: {},
    error: null,
    retries: 0,
    priority: 0,
    timestamp: mockDate,
    createdAt: mockDate,
    updatedAt: mockDate,
  });

  describe("GET Endpoint", () => {
    describe("Pagination", () => {
      it("should handle default pagination parameters", async () => {
        const mockSignals = [createDbSignal("signal-1")];
        vi.mocked(prisma.signal.findMany).mockResolvedValue(mockSignals);
        vi.mocked(prisma.signal.count).mockResolvedValue(1);

        const request = new NextRequest("http://localhost/api/signals");
        const response = await GET(request);
        const data = await response.json();

        expect(prisma.signal.findMany).toHaveBeenCalledWith(
          expect.objectContaining({
            take: 50,
            skip: 0,
            orderBy: { timestamp: "desc" },
          })
        );
        expect(data).toEqual({
          success: true,
          data: [createResponseSignal("signal-1")],
          metadata: {
            count: 1,
            page: 1,
            pageSize: 50,
            totalCount: 1,
            totalPages: 1,
            timestamp: mockDate,
          },
        });
      });

      it("should handle custom pagination parameters", async () => {
        const mockSignals = Array(10)
          .fill(null)
          .map((_, i) => createDbSignal(`signal-${i}`));
        vi.mocked(prisma.signal.findMany).mockResolvedValue(mockSignals);
        vi.mocked(prisma.signal.count).mockResolvedValue(20);

        const request = new NextRequest(
          "http://localhost/api/signals?page=2&pageSize=10"
        );
        const response = await GET(request);
        const data = await response.json();

        expect(prisma.signal.findMany).toHaveBeenCalledWith(
          expect.objectContaining({
            take: 10,
            skip: 10,
            orderBy: { timestamp: "desc" },
          })
        );
        expect(data).toEqual({
          success: true,
          data: mockSignals.map((_, i) => createResponseSignal(`signal-${i}`)),
          metadata: {
            count: 10,
            page: 2,
            pageSize: 10,
            totalCount: 20,
            totalPages: 2,
            timestamp: mockDate,
          },
        });
      });

      it("should handle invalid pagination parameters", async () => {
        const request = new NextRequest(
          "http://localhost/api/signals?page=invalid&pageSize=invalid"
        );
        const response = await GET(request);
        const data = await response.json();

        expect(response.status).toBe(400);
        expect(data).toEqual({
          success: false,
          error: "Invalid pagination parameters",
          metadata: {
            timestamp: mockDate,
          },
        });
      });
    });

    describe("Filtering", () => {
      it("should filter by source", async () => {
        const mockSignals = [createDbSignal("signal-1")];
        vi.mocked(prisma.signal.findMany).mockResolvedValue(mockSignals);
        vi.mocked(prisma.signal.count).mockResolvedValue(1);

        const request = new NextRequest(
          "http://localhost/api/signals?source=test-source"
        );
        const response = await GET(request);
        const data = await response.json();

        expect(prisma.signal.findMany).toHaveBeenCalledWith(
          expect.objectContaining({
            where: expect.objectContaining({
              source: "test-source",
            }),
            orderBy: { timestamp: "desc" },
          })
        );
        expect(data.success).toBe(true);
      });

      it("should filter by type", async () => {
        const mockSignals = [createDbSignal("signal-1")];
        vi.mocked(prisma.signal.findMany).mockResolvedValue(mockSignals);
        vi.mocked(prisma.signal.count).mockResolvedValue(1);

        const request = new NextRequest(
          `http://localhost/api/signals?type=${SignalType.SEARCH}`
        );
        const response = await GET(request);
        const data = await response.json();

        expect(prisma.signal.findMany).toHaveBeenCalledWith(
          expect.objectContaining({
            where: expect.objectContaining({
              type: SignalType.SEARCH,
            }),
            orderBy: { timestamp: "desc" },
          })
        );
        expect(data.success).toBe(true);
      });

      it("should combine source and type filters", async () => {
        const mockSignals = [createDbSignal("signal-1")];
        vi.mocked(prisma.signal.findMany).mockResolvedValue(mockSignals);
        vi.mocked(prisma.signal.count).mockResolvedValue(1);

        const request = new NextRequest(
          `http://localhost/api/signals?source=test-source&type=${SignalType.SEARCH}`
        );
        const response = await GET(request);
        const data = await response.json();

        expect(prisma.signal.findMany).toHaveBeenCalledWith(
          expect.objectContaining({
            where: expect.objectContaining({
              source: "test-source",
              type: SignalType.SEARCH,
            }),
            orderBy: { timestamp: "desc" },
          })
        );
        expect(data.success).toBe(true);
      });
    });

    describe("Error Handling", () => {
      it("should handle database errors", async () => {
        vi.mocked(prisma.signal.findMany).mockRejectedValue(
          new Error("Database error")
        );

        const request = new NextRequest("http://localhost/api/signals");
        const response = await GET(request);
        const data = await response.json();

        expect(response.status).toBe(500);
        expect(data).toEqual({
          success: false,
          error: "Failed to fetch signals",
          metadata: {
            timestamp: mockDate,
          },
        });
        expect(logger.error).toHaveBeenCalledWith(
          "Failed to fetch signals",
          expect.any(Object)
        );
      });
    });
  });

  describe("POST Endpoint", () => {
    describe("Request Validation", () => {
      it("should validate required fields", async () => {
        const request = new NextRequest("http://localhost/api/signals", {
          method: "POST",
          body: JSON.stringify({}),
        });

        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(400);
        expect(data).toEqual({
          success: false,
          error: "Invalid request format",
          details: expect.any(Object),
        });
      });

      it("should handle invalid signal type", async () => {
        const request = new NextRequest("http://localhost/api/signals", {
          method: "POST",
          body: JSON.stringify({
            type: "INVALID_TYPE",
            source: "test",
            value: 123,
            strength: 1.0,
          }),
        });

        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(400);
        expect(data).toEqual({
          success: false,
          error: "Invalid request format",
          details: expect.any(Object),
        });
      });

      it("should validate timestamp is not in future", async () => {
        const futureDate = new Date(Date.now() + 1000 * 60 * 60); // 1 hour in future
        const request = new NextRequest("http://localhost/api/signals", {
          method: "POST",
          body: JSON.stringify({
            type: SignalType.SEARCH,
            source: "test",
            value: 123,
            strength: 1.0,
            timestamp: futureDate.toISOString(),
          }),
        });

        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(400);
        expect(data).toEqual({
          success: false,
          error: "Timestamp cannot be in the future",
          metadata: {
            timestamp: mockDate,
          },
        });
      });
    });

    describe("Signal Creation", () => {
      it("should create signal with required fields", async () => {
        const mockSignal = {
          type: SignalType.SEARCH,
          source: "test-source",
          value: 123 as Prisma.JsonValue,
          strength: 1.0,
          priority: 0,
          retries: 0,
          manual: false,
          processed: false,
          error: null,
          metadata: {} as Prisma.JsonValue,
          timestamp: mockDateObj,
        };

        const mockDbResponse = {
          ...mockSignal,
          id: "signal-1",
          createdAt: mockDateObj,
          updatedAt: mockDateObj,
          processedAt: null,
        };

        vi.mocked(prisma.signal.create).mockResolvedValue(mockDbResponse);

        const request = new NextRequest("http://localhost/api/signals", {
          method: "POST",
          body: JSON.stringify({
            ...mockSignal,
            timestamp: mockDate,
          }),
        });

        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(201);
        expect(data).toEqual({
          success: true,
          data: createResponseSignal("signal-1"),
          metadata: {
            timestamp: mockDate,
          },
        });
      });

      it("should handle database errors during creation", async () => {
        const mockSignal = {
          type: SignalType.SEARCH,
          source: "test-source",
          value: 123,
          strength: 1.0,
        };

        vi.mocked(prisma.signal.create).mockRejectedValue(
          new Error("Database error")
        );

        const request = new NextRequest("http://localhost/api/signals", {
          method: "POST",
          body: JSON.stringify(mockSignal),
        });

        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(500);
        expect(data).toEqual({
          success: false,
          error: "Failed to create signal",
          metadata: {
            timestamp: mockDate,
          },
        });
      });
    });
  });
});

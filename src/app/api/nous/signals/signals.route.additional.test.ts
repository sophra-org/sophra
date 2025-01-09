import { prisma } from "../../../../lib/shared/database/client";
import logger from "../../../../lib/shared/logger";
import { Prisma, SignalType } from "@prisma/client";
import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
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
  },
}));

describe("Signals API Additional Tests", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const createMockSignal = (id: string) => ({
    id,
    type: SignalType.SEARCH,
    source: "test-source",
    value: 123,
    strength: 1.0,
    timestamp: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
    processed: false,
    manual: false,
    processedAt: null,
    metadata: {},
    error: null,
    retries: 0,
    priority: 0,
  });

  describe("GET Endpoint", () => {
    describe("Pagination", () => {
      it("should handle default pagination parameters", async () => {
        const mockSignals = [createMockSignal("signal-1")];
        vi.mocked(prisma.signal.findMany).mockResolvedValue(mockSignals);
        vi.mocked(prisma.signal.count).mockResolvedValue(1);

        const request = new NextRequest("http://localhost/api/signals");
        const response = await GET(request);
        const data = await response.json();

        expect(prisma.signal.findMany).toHaveBeenCalledWith(
          expect.objectContaining({
            take: 50,
            skip: 0,
          })
        );
        expect(data.metadata).toEqual(
          expect.objectContaining({
            page: 1,
            pageSize: 50,
          })
        );
      });

      it("should handle custom pagination parameters", async () => {
        const mockSignals = Array(10)
          .fill(null)
          .map((_, i) => createMockSignal(`signal-${i}`));
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
          })
        );
        expect(data.metadata).toEqual(
          expect.objectContaining({
            page: 2,
            pageSize: 10,
            totalCount: 20,
          })
        );
      });
    });

    describe("Filtering", () => {
      it("should filter by source", async () => {
        const mockSignals = [createMockSignal("signal-1")];
        vi.mocked(prisma.signal.findMany).mockResolvedValue(mockSignals);
        vi.mocked(prisma.signal.count).mockResolvedValue(1);

        const request = new NextRequest(
          "http://localhost/api/signals?source=test-source"
        );
        await GET(request);

        expect(prisma.signal.findMany).toHaveBeenCalledWith(
          expect.objectContaining({
            where: expect.objectContaining({
              source: "test-source",
            }),
          })
        );
      });

      it("should filter by type", async () => {
        const mockSignals = [createMockSignal("signal-1")];
        vi.mocked(prisma.signal.findMany).mockResolvedValue(mockSignals);
        vi.mocked(prisma.signal.count).mockResolvedValue(1);

        const request = new NextRequest(
          `http://localhost/api/signals?type=${SignalType.SEARCH}`
        );
        await GET(request);

        expect(prisma.signal.findMany).toHaveBeenCalledWith(
          expect.objectContaining({
            where: expect.objectContaining({
              type: SignalType.SEARCH,
            }),
          })
        );
      });

      it("should combine source and type filters", async () => {
        const mockSignals = [createMockSignal("signal-1")];
        vi.mocked(prisma.signal.findMany).mockResolvedValue(mockSignals);
        vi.mocked(prisma.signal.count).mockResolvedValue(1);

        const request = new NextRequest(
          `http://localhost/api/signals?source=test-source&type=${SignalType.SEARCH}`
        );
        await GET(request);

        expect(prisma.signal.findMany).toHaveBeenCalledWith(
          expect.objectContaining({
            where: expect.objectContaining({
              source: "test-source",
              type: SignalType.SEARCH,
            }),
          })
        );
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
        expect(data.success).toBe(false);
        expect(data.error).toBe("Failed to fetch signals");
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
          body: JSON.stringify({
            // Missing required fields
          }),
        });

        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(400);
        expect(data.success).toBe(false);
        expect(data.error).toBe("Invalid request format");
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
        expect(data.success).toBe(false);
      });
    });

    describe("Signal Creation", () => {
      it("should create signal with required fields", async () => {
        const now = new Date();
        const mockSignal = {
          type: SignalType.SEARCH,
          source: "test-source",
          value: 123,
          strength: 1.0,
          priority: 0,
          retries: 0,
          manual: false,
          processed: false,
          error: null,
          metadata: {},
          timestamp: now,
        };

        vi.mocked(prisma.signal.create).mockResolvedValue({
          ...mockSignal,
          id: "signal-1",
          createdAt: now,
          updatedAt: now,
          processedAt: null,
        });

        const request = new NextRequest("http://localhost/api/signals", {
          method: "POST",
          body: JSON.stringify({
            ...mockSignal,
            timestamp: now.toISOString(),
          }),
        });

        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(201);
        expect(data.success).toBe(true);
      });

      it("should handle optional fields with defaults", async () => {
        const now = new Date();
        const mockSignal = {
          type: SignalType.SEARCH,
          source: "test-source",
          value: 123,
          strength: 1.0,
        };

        vi.mocked(prisma.signal.create).mockResolvedValue({
          ...mockSignal,
          id: "signal-1",
          timestamp: now,
          createdAt: now,
          updatedAt: now,
          processedAt: null,
          priority: 0,
          retries: 0,
          manual: false,
          processed: false,
          error: null,
          metadata: {},
        });

        const request = new NextRequest("http://localhost/api/signals", {
          method: "POST",
          body: JSON.stringify(mockSignal),
        });

        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(201);
        expect(prisma.signal.create).toHaveBeenCalledWith(
          expect.objectContaining({
            data: expect.objectContaining({
              processed: false,
              manual: false,
              processedAt: null,
              metadata: {},
              error: null,
              retries: 0,
              priority: 0,
            }),
          })
        );
      });

      it("should handle custom timestamps", async () => {
        const customTimestamp = new Date("2024-01-01T00:00:00Z");
        const mockSignal = {
          type: SignalType.SEARCH,
          source: "test-source",
          value: 123,
          strength: 1.0,
          timestamp: customTimestamp,
        };

        vi.mocked(prisma.signal.create).mockResolvedValue({
          ...mockSignal,
          id: "signal-1",
          createdAt: new Date(),
          updatedAt: new Date(),
          processedAt: null,
          priority: 0,
          retries: 0,
          manual: false,
          processed: false,
          error: null,
          metadata: {},
        });

        const request = new NextRequest("http://localhost/api/signals", {
          method: "POST",
          body: JSON.stringify({
            ...mockSignal,
            timestamp: customTimestamp.toISOString(),
          }),
        });

        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(201);
        expect(data.data.timestamp).toEqual(customTimestamp);
      });
    });

    describe("Error Handling", () => {
      it("should handle invalid JSON", async () => {
        const request = new NextRequest("http://localhost/api/signals", {
          method: "POST",
          body: "invalid json",
        });

        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(500);
        expect(data.success).toBe(false);
      });

      it("should handle database errors", async () => {
        vi.mocked(prisma.signal.create).mockRejectedValue(
          new Error("Database error")
        );

        const request = new NextRequest("http://localhost/api/signals", {
          method: "POST",
          body: JSON.stringify({
            type: SignalType.SEARCH,
            source: "test-source",
            value: 123,
            strength: 1.0,
          }),
        });

        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(500);
        expect(data.success).toBe(false);
        expect(data.error).toBe("Failed to create signal");
        expect(logger.error).toHaveBeenCalledWith(
          "Failed to create signal",
          expect.any(Object)
        );
      });
    });
  });
});

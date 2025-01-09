import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mockPrisma = {
  learningEvent: {
    findMany: vi.fn(),
    create: vi.fn(),
  },
  $transaction: vi.fn(),
  $queryRaw: vi.fn(),
};

// Mock modules
vi.mock("@lib/shared/database/client", () => ({
  prisma: mockPrisma,
}));

vi.mock("@lib/shared/logger", () => ({
  default: {
    error: vi.fn(),
    info: vi.fn(),
  },
}));

// Import after mocks
import { GET } from "./route";

describe("Events Route Tests", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("GET /api/nous/learn/events", () => {
    it("should fetch events with default parameters", async () => {
      const mockEvents = [
        {
          id: "mock-suggestion-id",
          status: "PENDING",
          metadata: {
            source: "API",
            timestamp: new Date(),
          },
          createdAt: new Date(),
          updatedAt: new Date(),
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
        data: mockEvents.map(event => ({
          ...event,
          metadata: {
            ...event.metadata,
            timestamp: event.metadata.timestamp.toISOString(),
          },
          createdAt: event.createdAt.toISOString(),
          updatedAt: event.updatedAt.toISOString(),
        })),
        meta: {
          total: mockEvents.length,
          limit: 100,
          timestamp: expect.any(String),
        },
      });
    });
  });
});

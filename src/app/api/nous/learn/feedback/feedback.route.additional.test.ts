import logger from "@lib/shared/logger";
import { EngagementType, SignalType } from "@prisma/client";
import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { POST, runtime } from "./route";

vi.mock("@lib/shared/database/client", () => ({
  prisma: {
    feedbackRequest: {
      findMany: vi.fn().mockResolvedValue([]),
      create: vi.fn().mockResolvedValue({}),
      $queryRaw: vi.fn(),
    },
    $transaction: vi.fn(),
  },
}));

vi.mock("@lib/shared/logger", () => ({
  default: {
    error: vi.fn().mockImplementation(() => {}),
    info: vi.fn().mockImplementation(() => {}),
  },
}));

describe("Feedback Route Additional Tests", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Configuration", () => {
    it("should use Node.js runtime", () => {
      expect(runtime).toBe("nodejs");
    });
  });

  describe("POST Endpoint", () => {
    it("should validate feedback array", async () => {
      const invalidFeedback = {
        feedback: [
          {
            queryId: "q1",
            rating: 2.0,
            metadata: {
              userAction: SignalType.USER_BEHAVIOR_CLICK,
              resultId: "r1",
              queryHash: "hash1",
              timestamp: new Date().toISOString(),
              engagementType: EngagementType.CLICK,
            },
          },
        ],
      };

      const request = new NextRequest(
        "http://localhost:3000/api/nous/learn/feedback"
      );
      request.json = vi.fn().mockResolvedValue(invalidFeedback);

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toBe("Invalid request format");
      expect(data.details).toBeDefined();

      // Verify mock calls
      expect(logger.error).toHaveBeenCalledTimes(0);
      expect(request.json).toHaveBeenCalledTimes(1);
    });

    it("should handle empty feedback array", async () => {
      const invalidFeedback = {
        feedback: [],
      };

      const request = new NextRequest(
        "http://localhost:3000/api/nous/learn/feedback"
      );
      request.json = vi.fn().mockResolvedValue(invalidFeedback);

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.success).toBe(true);
    });

    it("should handle missing metadata fields", async () => {
      const invalidFeedback = {
        feedback: [
          {
            queryId: "q1",
            rating: 0.8,
            metadata: {
              // Missing required fields
              timestamp: new Date().toISOString(),
            },
          },
        ],
      };

      const request = new NextRequest(
        "http://localhost:3000/api/nous/learn/feedback"
      );
      request.json = vi.fn().mockResolvedValue(invalidFeedback);

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toBe("Invalid request format");
      expect(data.details).toBeDefined();
    });

    it("should handle invalid timestamp format", async () => {
      const invalidFeedback = {
        feedback: [
          {
            queryId: "q1",
            rating: 0.8,
            metadata: {
              userAction: SignalType.USER_BEHAVIOR_CLICK,
              resultId: "r1",
              queryHash: "hash1",
              timestamp: "invalid-date",
              engagementType: EngagementType.CLICK,
            },
          },
        ],
      };

      const request = new NextRequest(
        "http://localhost:3000/api/nous/learn/feedback"
      );
      request.json = vi.fn().mockResolvedValue(invalidFeedback);

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toBe("Invalid request format");
      expect(data.details).toBeDefined();
    });
  });
});

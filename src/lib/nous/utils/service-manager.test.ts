import { mockPrisma } from "../../../../vitest.setup";

vi.mock("@/lib/shared/database/client", () => ({
  prisma: mockPrisma,
}));

vi.mock("ioredis", () => {
  const mockRedis = {
    quit: vi.fn(),
    on: vi.fn(),
    connect: vi.fn(),
    disconnect: vi.fn(),
  };
  return {
    default: vi.fn().mockImplementation(() => mockRedis),
  };
});

import { EventCollector } from "@/lib/nous/observe/collector";
import { SignalCoordinator } from "@/lib/nous/observe/coordinator";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ServiceManager } from "./service-manager";

describe("ServiceManager", () => {
  let manager: ServiceManager;

  beforeEach(() => {
    vi.clearAllMocks();
    manager = ServiceManager.getInstance({
      environment: "test",
      redis: { url: "redis://localhost:6379" },
    });
  });

  describe("initialization", () => {
    it("should create singleton instance", () => {
      const instance1 = ServiceManager.getInstance({
        environment: "test",
        redis: { url: "redis://localhost:6379" },
      });
      const instance2 = ServiceManager.getInstance();
      expect(instance1).toBe(instance2);
    });

    it("should throw if not initialized with config", () => {
      // Reset singleton for this test
      // @ts-ignore - Accessing private static for testing
      ServiceManager.instance = undefined;
      expect(() => ServiceManager.getInstance()).toThrow(
        "ServiceManager not initialized"
      );
    });
  });

  describe("service access", () => {
    it("should get signal coordinator", () => {
      const coordinator = manager.getSignalCoordinator();
      expect(coordinator).toBeInstanceOf(SignalCoordinator);
    });

    it("should get event collector", () => {
      const collector = manager.getEventCollector();
      expect(collector).toBeInstanceOf(EventCollector);
    });

    it("should get prisma client", () => {
      const prisma = manager.getPrisma();
      expect(prisma).toBeDefined();
      expect(typeof prisma.$disconnect).toBe("function");
    });

    it("should get redis client", () => {
      const redis = manager.getRedis();
      expect(redis).toBeDefined();
      if (redis) {
        expect(typeof redis.quit).toBe("function");
      }
    });
  });

  describe("shutdown", () => {
    it("should disconnect all services", async () => {
      await manager.shutdown();

      const redis = manager.getRedis();
      if (redis) {
        expect(redis.quit).toHaveBeenCalled();
      }

      const prisma = manager.getPrisma();
      expect(prisma.$disconnect).toHaveBeenCalled();
    });
  });
});

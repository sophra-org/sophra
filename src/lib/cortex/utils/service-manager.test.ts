import { mockPrisma } from "../../../../vitest.setup";

vi.mock("@/lib/shared/database/client", () => ({
  prisma: mockPrisma,
}));

vi.mock("@elastic/elasticsearch", () => ({
  Client: vi.fn().mockImplementation(() => ({
    ping: vi.fn().mockResolvedValue(true),
  })),
}));

vi.mock("ioredis", () => {
  const RedisMock = vi.fn().mockImplementation(() => ({
    ping: vi.fn().mockResolvedValue("PONG"),
    on: vi.fn(),
    disconnect: vi.fn(),
  }));
  return { default: RedisMock };
});

import Redis from "ioredis";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ServiceManager } from "./service-manager";

describe("ServiceManager Additional Tests", () => {
  let serviceManager: ServiceManager;

  beforeEach(() => {
    // Reset singleton instance
    (ServiceManager as any)._instance = null;
    serviceManager = ServiceManager.getInstance();
    (serviceManager as any).redis = null;
    (serviceManager as any).services = null;

    // Setup environment variables
    process.env = {
      ...process.env,
      NODE_ENV: "test",
      SOPHRA_REDIS_URL: "redis://localhost:6379",
      ELASTICSEARCH_URL: "http://localhost:9200",
      SOPHRA_ES_API_KEY: "test-key",
      OPENAI_API_KEY: "test-openai-key",
    };

    // Clear all mocks
    vi.clearAllMocks();
    mockPrisma.$queryRaw.mockResolvedValue([{ count: 1 }]);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe("Service Initialization", () => {
    it("should initialize all required services", async () => {
      const services = await serviceManager.getServices();

      expect(services.elasticsearch).toBeDefined();
      expect(services.redis).toBeDefined();
      expect(services.postgres).toBeDefined();
      expect(services.vectorization).toBeDefined();
      expect(services.sync).toBeDefined();
      expect(services.analytics).toBeDefined();
      expect(services.metrics).toBeDefined();
      expect(services.abTesting).toBeDefined();
      expect(services.feedback).toBeDefined();
      expect(services.sessions).toBeDefined();
    });

    it("should handle missing optional services gracefully", async () => {
      const services = await serviceManager.getServices();

      expect(services.observe).toBeNull();
      expect(services.learning).toBeNull();
      expect(services.documents).toBeNull();
      expect(services.health).toBeNull();
    });

    it("should initialize engine service with test functionality", async () => {
      const services = await serviceManager.getServices();

      expect(services.engine).toBeDefined();
      expect(services.engine.instance).toBeNull();

      const testResult = await services.engine.testService();
      expect(testResult).toEqual({
        operational: true,
        latency: expect.any(Number),
        errors: [],
        metrics: {
          operations: {
            total: 100,
            successful: 95,
            failed: 5,
            pending: 0,
          },
          performance: {
            latency: 50,
            throughput: 10,
            errorRate: 0.05,
            cpuUsage: 0.6,
            memoryUsage: 0.4,
          },
          status: "active",
          uptime: expect.any(Number),
        },
      });
    });
  });

  describe("Connection Management", () => {
    it("should handle Redis connection timeouts", async () => {
      const mockRedis = {
        ping: vi.fn().mockImplementation(
          () =>
            new Promise((_, reject) => {
              setTimeout(() => reject(new Error("Connection timeout")), 100);
            })
        ),
        on: vi.fn(),
        disconnect: vi.fn(),
      };
      (Redis as unknown as jest.Mock).mockImplementationOnce(() => mockRedis);

      await expect(serviceManager.getServices()).rejects.toThrow();
      expect(mockRedis.disconnect).toHaveBeenCalled();
    });

    it("should handle Redis reconnection attempts", async () => {
      const mockRedis = {
        ping: vi
          .fn()
          .mockRejectedValueOnce(new Error("Connection failed"))
          .mockResolvedValueOnce("PONG"),
        on: vi.fn(),
        disconnect: vi.fn(),
      };
      (Redis as unknown as jest.Mock).mockImplementationOnce(() => mockRedis);

      await expect(serviceManager.getServices()).rejects.toThrow();
      expect(mockRedis.on).toHaveBeenCalledWith("error", expect.any(Function));
      expect(mockRedis.on).toHaveBeenCalledWith(
        "connect",
        expect.any(Function)
      );
    });

    it("should cleanup Redis connection on initialization failure", async () => {
      const mockRedis = {
        ping: vi.fn().mockRejectedValue(new Error("Initialization failed")),
        on: vi.fn(),
        disconnect: vi.fn(),
      };
      (Redis as unknown as jest.Mock).mockImplementationOnce(() => mockRedis);

      await expect(serviceManager.getServices()).rejects.toThrow(
        "Initialization failed"
      );
      expect(mockRedis.disconnect).toHaveBeenCalled();
    });
  });
});

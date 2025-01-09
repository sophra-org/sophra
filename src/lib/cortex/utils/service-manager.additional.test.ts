import { Client } from "@elastic/elasticsearch";
import Redis from "ioredis";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { mockPrisma } from "../../../../vitest.setup";
import { ServiceManager } from "./service-manager";

// Mock all imported services
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

  describe("Redis Connection Management", () => {
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

      const status = await serviceManager.checkConnections();
      expect(status.redis).toBe(false);
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

      const status = await serviceManager.checkConnections();
      expect(status.redis).toBe(false);
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

  describe("Elasticsearch Connection Management", () => {
    it("should handle Elasticsearch connection timeouts", async () => {
      (Client as unknown as jest.Mock).mockImplementationOnce(() => ({
        ping: vi.fn().mockImplementation(
          () =>
            new Promise((_, reject) => {
              setTimeout(() => reject(new Error("ES Connection timeout")), 100);
            })
        ),
      }));

      const status = await serviceManager.checkConnections();
      expect(status.elasticsearch).toBe(false);
    });

    it("should handle Elasticsearch authentication errors", async () => {
      (Client as unknown as jest.Mock).mockImplementationOnce(() => ({
        ping: vi.fn().mockRejectedValue(new Error("Authentication failed")),
      }));

      const status = await serviceManager.checkConnections();
      expect(status.elasticsearch).toBe(false);
    });
  });

  describe("Postgres Connection Management", () => {
    it("should handle Postgres connection timeouts", async () => {
      mockPrisma.$queryRaw.mockImplementationOnce(() => {
        throw new Error("PG Connection timeout");
      });

      const status = await serviceManager.checkConnections();
      expect(status.postgres).toBe(false);
    });

    it("should handle Postgres authentication errors", async () => {
      mockPrisma.$queryRaw.mockImplementationOnce(() => {
        throw new Error("PG Authentication failed");
      });

      const status = await serviceManager.checkConnections();
      expect(status.postgres).toBe(false);
    });
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

  describe("Environment Configuration", () => {
    beforeEach(() => {
      // Reset singleton instance and services
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

      // Mock Client constructor to capture config
      (Client as unknown as jest.Mock).mockImplementation((config) => ({
        ping: vi.fn().mockResolvedValue(true),
        config,
      }));
    });

    it("should throw error when Redis URL is missing", async () => {
      process.env.SOPHRA_REDIS_URL = undefined;

      await expect(serviceManager.getServices()).rejects.toThrow(
        "Missing SOPHRA_REDIS_URL environment variable"
      );
    });

    it("should handle missing Elasticsearch configuration", async () => {
      process.env.ELASTICSEARCH_URL = undefined;
      process.env.SOPHRA_ES_API_KEY = undefined;

      const services = await serviceManager.getServices();
      expect(services.elasticsearch).toBeDefined();
      expect(Client).toHaveBeenCalledWith(
        expect.objectContaining({
          node: undefined,
          auth: undefined,
          ssl: { rejectUnauthorized: false },
          maxRetries: 3,
          requestTimeout: 30000,
          sniffOnStart: false,
        })
      );
    });

    it("should handle missing OpenAI API key", async () => {
      process.env.OPENAI_API_KEY = undefined;

      await expect(serviceManager.getServices()).rejects.toThrow(
        "OpenAI API key is required for vectorization"
      );
    });

    it("should handle empty string environment variables", async () => {
      process.env.ELASTICSEARCH_URL = "";
      process.env.SOPHRA_ES_API_KEY = "";
      process.env.OPENAI_API_KEY = "";

      await expect(serviceManager.getServices()).rejects.toThrow(
        "OpenAI API key is required for vectorization"
      );
    });
  });

  describe("Concurrent Access", () => {
    it("should handle multiple simultaneous initialization requests", async () => {
      const initPromises = Array(5)
        .fill(null)
        .map(() => serviceManager.getServices());
      const results = await Promise.all(initPromises);

      // All promises should resolve to the same service instance
      const firstResult = results[0];
      results.forEach((result) => {
        expect(result).toBe(firstResult);
      });
    });

    it("should handle concurrent connection checks", async () => {
      const checkPromises = Array(5)
        .fill(null)
        .map(() => serviceManager.checkConnections());
      const results = await Promise.all(checkPromises);

      results.forEach((status) => {
        expect(status).toEqual({
          redis: expect.any(Boolean),
          elasticsearch: expect.any(Boolean),
          postgres: expect.any(Boolean),
        });
      });
    });
  });
});

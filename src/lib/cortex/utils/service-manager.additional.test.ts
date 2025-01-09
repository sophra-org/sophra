import { MetricsService } from "@/lib/cortex/monitoring/metrics";
import { prisma } from "@/lib/shared/database/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ServiceManager, serviceManager } from "./service-manager";

// Mock dependencies before imports
vi.mock("@/lib/shared/database/client", () => ({
  prisma: {
    $queryRaw: vi.fn().mockResolvedValue([{ now: new Date() }]),
  },
}));

vi.mock("ioredis", () => {
  const mockRedisClient = {
    on: vi.fn(),
    ping: vi.fn().mockResolvedValue("PONG"),
    options: {},
    status: "ready",
    disconnect: vi.fn(),
    quit: vi.fn(),
    connect: vi.fn(),
    duplicate: vi.fn(),
    sendCommand: vi.fn(),
    isCluster: false,
    stream: vi.fn(),
    condition: vi.fn(),
    commandQueue: [],
    connector: vi.fn(),
  };

  const RedisMock = vi.fn().mockImplementation((url: string, options: any) => {
    if (!url || url === "") {
      throw new Error("Missing SOPHRA_REDIS_URL environment variable");
    }
    return mockRedisClient;
  });

  return {
    default: RedisMock,
    __esModule: true,
    __mockClient: mockRedisClient,
  };
});

vi.mock("@elastic/elasticsearch", () => {
  const mockClient = {
    ping: vi.fn().mockResolvedValue(true),
    indices: {
      exists: vi.fn(),
      create: vi.fn(),
      delete: vi.fn(),
      transport: vi.fn(),
      addBlock: vi.fn(),
      analyze: vi.fn(),
      clearCache: vi.fn(),
    },
    search: vi.fn(),
    bulk: vi.fn(),
    close: vi.fn(),
  };

  return {
    Client: vi.fn().mockImplementation(() => mockClient),
    __esModule: true,
    __mockClient: mockClient,
  };
});

vi.mock("@/lib/cortex/monitoring/metrics", () => {
  const mockMetrics = {
    totalOperations: 100,
    successfulOperations: 95,
    failedOperations: 5,
    pendingOperations: 0,
    averageLatency: 50,
    requestsPerSecond: 10,
    errorRate: 0.05,
    cpuUsage: 0.6,
    memoryUsage: 0.4,
  };

  const mockService = {
    observeMetric: vi.fn(),
    getEngineMetrics: vi.fn().mockResolvedValue(mockMetrics),
    logger: {
      info: vi.fn(),
      error: vi.fn(),
      warn: vi.fn(),
      debug: vi.fn(),
    },
  };

  const MetricsServiceMock = vi
    .fn()
    .mockImplementation(() => mockService) as any;
  MetricsServiceMock.getEngineMetrics = vi.fn().mockResolvedValue(mockMetrics);
  Object.assign(MetricsServiceMock, { __mockService: mockService });

  return {
    MetricsService: MetricsServiceMock,
    __esModule: true,
  };
});

describe("ServiceManager Additional Tests", () => {
  const OLD_ENV = process.env;
  let mockRedis: ReturnType<typeof vi.fn>;
  let mockRedisClient: any;
  let mockElasticsearchClient: any;
  let mockMetricsService: any;

  beforeEach(() => {
    process.env = {
      ...OLD_ENV,
      ELASTICSEARCH_URL: "http://localhost:9200",
      SOPHRA_ES_API_KEY: "test-key",
      SOPHRA_REDIS_URL: "redis://localhost:6379",
      OPENAI_API_KEY: "test-openai-key",
      NODE_ENV: "test",
    };
    vi.clearAllMocks();
    (ServiceManager as any).instance = null;

    const ioredis = require("ioredis");
    mockRedis = vi.mocked(ioredis.default);
    mockRedisClient = ioredis.__mockClient;

    const elasticsearch = require("@elastic/elasticsearch");
    mockElasticsearchClient = elasticsearch.__mockClient;

    const metricsModule = vi.mocked(MetricsService);
    mockMetricsService = (metricsModule as any).__mockService;
  });

  afterEach(() => {
    process.env = OLD_ENV;
    vi.clearAllMocks();
    (ServiceManager as any).instance = null;
  });

  describe("Singleton Pattern", () => {
    it("should create only one instance", () => {
      const instance1 = ServiceManager.getInstance();
      const instance2 = ServiceManager.getInstance();
      expect(instance1).toStrictEqual(instance2);
    });

    it("should expose singleton instance through serviceManager", () => {
      const instance = ServiceManager.getInstance();
      expect(serviceManager).toStrictEqual(instance);
    });
  });

  describe("Service Initialization", () => {
    it("should initialize Redis with correct configuration", async () => {
      await serviceManager.getServices();

      expect(mockRedis).toHaveBeenCalledWith(
        "redis://localhost:6379",
        expect.objectContaining({
          maxRetriesPerRequest: 3,
          retryStrategy: expect.any(Function),
          connectTimeout: 10000,
          commandTimeout: 5000,
        })
      );

      expect(mockRedisClient.on).toHaveBeenCalledWith(
        "error",
        expect.any(Function)
      );
      expect(mockRedisClient.on).toHaveBeenCalledWith(
        "connect",
        expect.any(Function)
      );
    });

    it("should handle Redis initialization errors", async () => {
      process.env.SOPHRA_REDIS_URL = "";
      await expect(() => serviceManager.getServices()).rejects.toThrow(
        "Missing SOPHRA_REDIS_URL environment variable"
      );
    });

    it("should cache initialized services", async () => {
      const services1 = await serviceManager.getServices();
      const services2 = await serviceManager.getServices();

      expect(services1).toBe(services2);
      expect(mockRedis).toHaveBeenCalledTimes(1);
    });

    it("should handle concurrent initialization requests", async () => {
      const promises = Array(5)
        .fill(null)
        .map(() => serviceManager.getServices());
      const results = await Promise.all(promises);

      expect(new Set(results).size).toBe(1);
      expect(mockRedis).toHaveBeenCalledTimes(1);
    });
  });

  describe("Connection Checks", () => {
    beforeEach(async () => {
      // Initialize services first to get the Redis client
      await serviceManager.getServices();
    });

    it("should check all connections successfully", async () => {
      mockRedisClient.ping.mockResolvedValueOnce("PONG");
      mockElasticsearchClient.ping.mockResolvedValueOnce(true);
      vi.mocked(prisma.$queryRaw).mockResolvedValueOnce([{ now: new Date() }]);

      const result = await serviceManager.checkConnections();

      expect(result).toEqual({
        redis: true,
        elasticsearch: true,
        postgres: true,
      });
    });

    it("should handle Redis connection failure", async () => {
      mockRedisClient.ping.mockRejectedValueOnce(
        new Error("Redis connection failed")
      );
      mockElasticsearchClient.ping.mockResolvedValueOnce(true);
      vi.mocked(prisma.$queryRaw).mockResolvedValueOnce([{ now: new Date() }]);

      const result = await serviceManager.checkConnections();

      expect(result).toEqual({
        redis: false,
        elasticsearch: true,
        postgres: true,
      });
    });

    it("should handle Elasticsearch connection failure", async () => {
      mockRedisClient.ping.mockResolvedValueOnce("PONG");
      mockElasticsearchClient.ping.mockRejectedValueOnce(
        new Error("ES connection failed")
      );
      vi.mocked(prisma.$queryRaw).mockResolvedValueOnce([{ now: new Date() }]);

      const result = await serviceManager.checkConnections();

      expect(result).toEqual({
        redis: true,
        elasticsearch: false,
        postgres: true,
      });
    });

    it("should handle Postgres connection failure", async () => {
      mockRedisClient.ping.mockResolvedValueOnce("PONG");
      mockElasticsearchClient.ping.mockResolvedValueOnce(true);
      vi.mocked(prisma.$queryRaw).mockRejectedValueOnce(
        new Error("DB connection failed")
      );

      const result = await serviceManager.checkConnections();

      expect(result).toEqual({
        redis: true,
        elasticsearch: true,
        postgres: false,
      });
    });
  });

  describe("Service Management", () => {
    it("should create all required services", async () => {
      const services = await serviceManager.getServices();

      expect(services).toEqual(
        expect.objectContaining({
          redis: expect.any(Object),
          elasticsearch: expect.any(Object),
          postgres: expect.any(Object),
          metrics: expect.any(Object),
          feedback: expect.any(Object),
          analytics: expect.any(Object),
          sessions: expect.any(Object),
          sync: expect.any(Object),
          vectorization: expect.any(Object),
          abTesting: expect.any(Object),
        })
      );
    });

    it("should handle engine test service", async () => {
      const services = await serviceManager.getServices();
      const result = await services.engine.testService();

      expect(result).toEqual({
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
});

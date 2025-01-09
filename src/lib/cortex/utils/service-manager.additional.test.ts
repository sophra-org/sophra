import { BaseService, BaseServiceConfig } from "@/lib/cortex/core/services";
import { prisma } from "@/lib/shared/database/client";
import type { Logger } from "@/lib/shared/types";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import winston from "winston";
import { ServiceManager, serviceManager } from "./service-manager";

const startTime = Date.now();

// Mock logger for testing
const mockLogger: Logger = {
  info: vi.fn(),
  error: vi.fn(),
  warn: vi.fn(),
  debug: vi.fn(),
  service: "test",
  http: vi.fn(),
  verbose: vi.fn(),
  level: "info",
  silent: false,
  format: {
    transform: vi.fn(),
  },
  levels: winston.config.npm.levels,
  transports: [],
  rejections: {
    handle: vi.fn(),
    unhandle: vi.fn(),
    logger: winston.createLogger(),
    handlers: new Map(),
    catcher: () => {},
    getAllInfo: (err: string | Error) => ({
      process: { pid: 123, title: "test" },
      os: { platform: "test", release: "1.0" },
      trace: [],
    }),
    getProcessInfo: () => ({
      pid: 123,
      title: "test",
    }),
    getOsInfo: () => ({
      platform: "test",
      release: "1.0",
    }),
    getTrace: (err: Error) => ({
      message: err.message,
      stack: err.stack,
      name: err.name,
    }),
  },
  exceptions: {
    handle: vi.fn(),
    unhandle: vi.fn(),
    logger: winston.createLogger(),
    handlers: new Map(),
    catcher: () => {},
    getAllInfo: () => ({
      process: { pid: 123, title: "test" },
      os: { platform: "test", release: "1.0" },
      trace: [],
    }),
    getProcessInfo: () => ({
      pid: 123,
      title: "test",
    }),
    getOsInfo: () => ({
      platform: "test",
      release: "1.0",
    }),
    getTrace: (err: Error) => ({
      message: err.message,
      stack: err.stack,
      name: err.name,
    }),
  },
  profilers: {},
  exitOnError: true,
  add: vi.fn(),
  remove: vi.fn(),
  clear: vi.fn(),
  profile: vi.fn(),
  startTimer: vi.fn(),
  child: vi.fn(),
  close: vi.fn(),
  configure: vi.fn(),
  log: vi.fn(),
  write: vi.fn(),
  query: vi.fn(),
  stream: vi.fn(),
  cli: vi.fn(),
  emerg: vi.fn(),
  alert: vi.fn(),
  crit: vi.fn(),
  warning: vi.fn(),
  notice: vi.fn(),
  input: vi.fn(),
  help: vi.fn(),
  data: vi.fn(),
  prompt: vi.fn(),
  silly: vi.fn(),
  isLevelEnabled: vi.fn(),
  isErrorEnabled: vi.fn(),
  isWarnEnabled: vi.fn(),
  isInfoEnabled: vi.fn(),
  isVerboseEnabled: vi.fn(),
  isDebugEnabled: vi.fn(),
  isSillyEnabled: vi.fn(),
} as unknown as Logger;

// Mock Redis service
const mockRedisClient = {
  ping: vi.fn().mockResolvedValue("PONG"),
  on: vi.fn(),
  quit: vi.fn(),
  disconnect: vi.fn(),
};

class MockRedisService extends BaseService {
  public redisClient: any;
  public isInitialized = false;
  protected readonly serviceName = "RedisService";
  protected readonly defaultTTL = 3600;

  constructor(config: BaseServiceConfig) {
    super(config);
    this.redisClient = {
      ping: vi.fn().mockResolvedValue("PONG"),
      on: vi.fn(),
      quit: vi.fn(),
      connect: vi.fn().mockImplementation(async () => {
        this.isInitialized = true;
        return undefined;
      }),
      isConnected: true,
    };
  }

  async initialize(): Promise<void> {
    if (!process.env.SOPHRA_REDIS_URL) {
      throw new Error("Missing SOPHRA_REDIS_URL environment variable");
    }
    await this.redisClient.connect();
  }

  async healthCheck(): Promise<boolean> {
    try {
      if (!this.isInitialized || !this.redisClient.isConnected) {
        return false;
      }
      const response = await this.redisClient.ping();
      return response === "PONG";
    } catch (error) {
      return false;
    }
  }

  async checkHealth(): Promise<boolean> {
    return this.healthCheck();
  }

  async disconnect(): Promise<void> {
    if (this.redisClient) {
      await this.redisClient.quit();
    }
  }

  getClient() {
    if (!this.isInitialized) {
      throw new Error("Redis service not initialized");
    }
    return this.redisClient;
  }

  async getMetrics(): Promise<any> {
    if (!this.isInitialized) {
      throw new Error("Redis service not initialized");
    }
    return {
      operational: await this.healthCheck(),
      latency: 0,
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
        uptime: process.uptime(),
      },
    };
  }

  async testService(): Promise<any> {
    return this.getMetrics();
  }
}

// Mock Redis service initialization
const mockRedisService = new MockRedisService({
  logger: mockLogger,
  environment: "test",
});

vi.mock("@/lib/cortex/services/redis", () => ({
  RedisService: vi.fn().mockImplementation(() => mockRedisService),
}));

// Mock Elasticsearch
const mockElasticsearchClient = {
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

vi.mock("@elastic/elasticsearch", () => ({
  Client: vi.fn().mockImplementation(() => mockElasticsearchClient),
}));

// Mock metrics service
const mockMetricsService = {
  getEngineMetrics: vi.fn().mockReturnValue({
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
    uptime: Date.now() - startTime,
  }),
  observeMetric: vi.fn(),
  logger: {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
};

vi.mock("@/lib/cortex/services/metrics", () => ({
  MetricsService: vi.fn().mockImplementation(() => mockMetricsService),
}));

// Mock engine service
class MockEngineService extends BaseService {
  protected readonly serviceName = "EngineService";
  protected readonly defaultTTL = 3600;

  constructor(config: BaseServiceConfig) {
    super(config);
  }

  async initialize(): Promise<void> {
    // No initialization needed for mock
  }

  async healthCheck(): Promise<boolean> {
    return true;
  }

  async checkHealth(): Promise<boolean> {
    return this.healthCheck();
  }

  async disconnect(): Promise<void> {
    // No disconnection needed for mock
  }

  async getMetrics(): Promise<any> {
    return {
      operational: true,
      latency: 100,
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
        uptime: process.uptime(),
      },
    };
  }

  async testService(): Promise<any> {
    return this.getMetrics();
  }
}

vi.mock("@/lib/cortex/services/engine", () => ({
  engine: new MockEngineService({
    logger: mockLogger,
    environment: "test",
  }),
}));

describe("ServiceManager Additional Tests", () => {
  beforeEach(async () => {
    process.env.SOPHRA_REDIS_URL = "redis://localhost:6379";
    vi.mocked(mockRedisService.redisClient.ping).mockResolvedValue("PONG");
    vi.mocked(mockRedisService.redisClient.on).mockReset();
    vi.mocked(mockRedisService.redisClient.quit).mockReset();
    vi.mocked(mockRedisService.redisClient.connect).mockImplementation(
      async () => {
        mockRedisService.isInitialized = true;
        mockRedisService.redisClient.isConnected = true;
        return undefined;
      }
    );

    // Mock Redis instance for ServiceManager
    const mockRedis = {
      ping: vi.fn().mockResolvedValue("PONG"),
      on: vi.fn(),
      quit: vi.fn(),
      connect: vi.fn().mockResolvedValue(undefined),
    };
    vi.mock("ioredis", () => ({
      default: vi.fn().mockImplementation(() => mockRedis),
    }));

    vi.clearAllMocks();
    (ServiceManager as any).instance = null;
    await mockRedisService.initialize();
  });

  afterEach(() => {
    vi.clearAllMocks();
    delete process.env.SOPHRA_REDIS_URL;
    mockRedisService.isInitialized = false;
    mockRedisService.redisClient.isConnected = false;
    (ServiceManager as any).instance = null;
  });

  describe("Singleton Pattern", () => {
    it("should create only one instance", () => {
      const instance1 = ServiceManager.getInstance();
      const instance2 = ServiceManager.getInstance();
      expect(instance1).toBe(instance2);
    });

    it("should expose singleton instance through serviceManager", () => {
      const instance = ServiceManager.getInstance();
      expect(serviceManager).toBe(instance);
    });
  });

  describe("Service Initialization", () => {
    it("should initialize Redis with correct configuration", async () => {
      const services = await serviceManager.getServices();
      const redisService = services.redis as unknown as MockRedisService;
      expect(redisService.redisClient.on).toHaveBeenCalledWith(
        "error",
        expect.any(Function)
      );
    });

    it("should handle Redis initialization errors", async () => {
      process.env.SOPHRA_REDIS_URL = "";
      await expect(serviceManager.getServices()).rejects.toThrow(
        "Missing SOPHRA_REDIS_URL environment variable"
      );
    });

    it("should cache initialized services", async () => {
      const services1 = await serviceManager.getServices();
      const services2 = await serviceManager.getServices();
      expect(services1).toBe(services2);
    });

    it("should handle concurrent initialization requests", async () => {
      const [services1, services2] = await Promise.all([
        serviceManager.getServices(),
        serviceManager.getServices(),
      ]);
      expect(services1).toBe(services2);
    });
  });

  describe("Connection Checks", () => {
    beforeEach(async () => {
      vi.mocked(mockRedisService.redisClient.ping).mockResolvedValue("PONG");
      vi.mocked(mockElasticsearchClient.ping).mockResolvedValue(true);
      vi.mocked(prisma.$queryRaw).mockResolvedValue([{ now: new Date() }]);
      vi.mocked(mockRedisService.redisClient.connect).mockResolvedValue(
        undefined
      );
      await mockRedisService.initialize();
      await mockRedisService.redisClient.connect();
      mockRedisService.isInitialized = true;
    });

    it("should check all connections successfully", async () => {
      const result = await serviceManager.checkConnections();
      expect(result).toEqual({
        redis: true,
        elasticsearch: true,
        postgres: true,
      });
    });

    it("should handle Redis connection failure", async () => {
      vi.mocked(mockRedisService.redisClient.ping).mockRejectedValue(
        new Error("Redis connection failed")
      );
      const result = await serviceManager.checkConnections();
      expect(result).toEqual({
        redis: false,
        elasticsearch: true,
        postgres: true,
      });
    });

    it("should handle Elasticsearch connection failure", async () => {
      vi.mocked(mockElasticsearchClient.ping).mockRejectedValue(
        new Error("Elasticsearch connection failed")
      );
      const result = await serviceManager.checkConnections();
      expect(result).toEqual({
        redis: true,
        elasticsearch: false,
        postgres: true,
      });
    });

    it("should handle Postgres connection failure", async () => {
      vi.mocked(prisma.$queryRaw).mockRejectedValue(
        new Error("Postgres connection failed")
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
    beforeEach(async () => {
      await mockRedisService.initialize();
    });

    it("should create all required services", async () => {
      const services = await serviceManager.getServices();
      expect(services).toHaveProperty("redis");
      expect(services).toHaveProperty("elasticsearch");
      expect(services).toHaveProperty("engine");
      expect(services).toHaveProperty("vectorization");
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

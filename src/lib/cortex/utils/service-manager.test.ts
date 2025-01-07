import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Logger } from '@/lib/shared/types';
import { EventEmitter } from 'events';

// Mock the logger module before any imports that use it
vi.mock('@/lib/shared/logger', () => {
  const mockLogger = {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
    service: 'test',
  };
  return {
    default: mockLogger,
    __esModule: true,
  };
});

import logger from '@/lib/shared/logger';
import { ServiceManager } from './service-manager';

describe('ServiceManager', () => {
  let serviceManager: ServiceManager;
  let mockRedis: any;
  let mockElasticsearch: any;

  beforeEach(() => {
    // Reset mocks
    vi.clearAllMocks();
    
    // Reset singleton for testing
    (ServiceManager as any).instance = undefined;

    // Create Redis mock with EventEmitter
    mockRedis = new EventEmitter();
    mockRedis.connect = vi.fn().mockResolvedValue(undefined);
    mockRedis.disconnect = vi.fn().mockResolvedValue(undefined);
    mockRedis.ping = vi.fn().mockResolvedValue('PONG');
    mockRedis.on = vi.fn((event, callback) => {
      return mockRedis.addListener(event, callback);
    });

    mockElasticsearch = {
      ping: vi.fn().mockResolvedValue(true),
      close: vi.fn().mockResolvedValue(undefined),
    };

    serviceManager = ServiceManager.getInstance();

    // Mock private methods
    vi.spyOn(serviceManager as any, 'initializeRedis').mockResolvedValue(mockRedis);
    vi.spyOn(serviceManager as any, 'createBaseServices').mockResolvedValue({
      redis: mockRedis,
      elasticsearch: mockElasticsearch,
      postgres: {},
      vectorization: {},
      sync: {},
      analytics: {},
      metrics: {},
      abTesting: {},
      feedback: {},
      sessions: {},
      observe: null,
      learning: null,
      engine: {
        instance: null,
        testService: vi.fn(),
      },
      documents: null,
      health: null,
    });
  });

  describe('getServices', () => {
    it('should initialize and return services', async () => {
      const services = await serviceManager.getServices();
      expect(services.redis).toBeDefined();
      expect(services.elasticsearch).toBeDefined();
      expect(services.postgres).toBeDefined();
      expect(services.vectorization).toBeDefined();
      expect(services.sync).toBeDefined();
      expect(services.analytics).toBeDefined();
      expect(services.metrics).toBeDefined();
      expect(services.abTesting).toBeDefined();
      expect(services.feedback).toBeDefined();
      expect(services.sessions).toBeDefined();
    });

    it('should return cached services on subsequent calls', async () => {
      const services1 = await serviceManager.getServices();
      const services2 = await serviceManager.getServices();
      expect(services1).toBe(services2);
      expect((serviceManager as any).initializeRedis).toHaveBeenCalledTimes(1);
      expect((serviceManager as any).createBaseServices).toHaveBeenCalledTimes(1);
    });
  });

  describe('service initialization', () => {
    it('should initialize Redis client', async () => {
      const services = await serviceManager.getServices();
      expect(services.redis).toBeDefined();
      expect((serviceManager as any).initializeRedis).toHaveBeenCalled();
    });

    it('should initialize all required services', async () => {
      const services = await serviceManager.getServices();
      expect(services.redis).toBeDefined();
      expect(services.elasticsearch).toBeDefined();
      expect(services.postgres).toBeDefined();
      expect(services.vectorization).toBeDefined();
      expect(services.sync).toBeDefined();
      expect(services.analytics).toBeDefined();
      expect(services.metrics).toBeDefined();
      expect(services.abTesting).toBeDefined();
      expect(services.feedback).toBeDefined();
      expect(services.sessions).toBeDefined();
    });
  });

  describe('service caching', () => {
    it('should cache initialized services', async () => {
      const services1 = await serviceManager.getServices();
      const services2 = await serviceManager.getServices();

      expect(services1).toBe(services2);
      expect((serviceManager as any).initializeRedis).toHaveBeenCalledTimes(1);
      expect((serviceManager as any).createBaseServices).toHaveBeenCalledTimes(1);
    });

    it('should handle concurrent initialization requests', async () => {
      const [services1, services2] = await Promise.all([
        serviceManager.getServices(),
        serviceManager.getServices(),
      ]);

      expect(services1).toBe(services2);
      expect((serviceManager as any).initializeRedis).toHaveBeenCalledTimes(1);
      expect((serviceManager as any).createBaseServices).toHaveBeenCalledTimes(1);
    });
  });

  describe('error handling', () => {
    it('should handle Redis connection errors', async () => {
      (serviceManager as any).initializeRedis.mockRejectedValueOnce(new Error('Redis connection failed'));

      await expect(serviceManager.getServices()).rejects.toThrow('Redis connection failed');
      expect(logger.error).toHaveBeenCalled();
    });

    it('should handle service initialization errors', async () => {
      (serviceManager as any).createBaseServices.mockRejectedValueOnce(new Error('Service initialization failed'));

      await expect(serviceManager.getServices()).rejects.toThrow('Service initialization failed');
      expect(logger.error).toHaveBeenCalled();
    });
  });
});
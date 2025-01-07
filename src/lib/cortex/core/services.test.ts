import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BaseService, type BaseServiceConfig } from './services';
import type { Logger } from '@/lib/shared/types';

// Concrete implementation for testing
class TestService extends BaseService {
  constructor(config: BaseServiceConfig) {
    super(config);
  }

  async healthCheck(): Promise<boolean> {
    return true;
  }

  async disconnect(): Promise<void> {
    // Implementation for testing
  }
}

describe('BaseService', () => {
  let service: TestService;
  let mockLogger: Logger;

  beforeEach(() => {
    mockLogger = {
      debug: vi.fn(),
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
      service: 'test-service',
      silent: false,
      format: vi.fn(),
      levels: {},
    } as unknown as Logger;
  });

  describe('constructor', () => {
    it('should create service instance with valid config', () => {
      service = new TestService({
        logger: mockLogger,
        environment: 'test',
      });

      expect(service).toBeInstanceOf(BaseService);
      expect(service).toBeInstanceOf(TestService);
    });

    it('should initialize logger and environment', () => {
      service = new TestService({
        logger: mockLogger,
        environment: 'development',
      });

      expect(service['logger']).toBe(mockLogger);
      expect(service['environment']).toBe('development');
    });

    it('should accept different environment values', () => {
      const environments: Array<'development' | 'production' | 'test'> = [
        'development',
        'production',
        'test',
      ];

      environments.forEach((env) => {
        service = new TestService({
          logger: mockLogger,
          environment: env,
        });
        expect(service['environment']).toBe(env);
      });
    });
  });

  describe('healthCheck', () => {
    it('should return health status', async () => {
      service = new TestService({
        logger: mockLogger,
        environment: 'test',
      });

      const health = await service.healthCheck();
      expect(health).toBe(true);
    });
  });

  describe('disconnect', () => {
    it('should call disconnect method if implemented', async () => {
      service = new TestService({
        logger: mockLogger,
        environment: 'test',
      });

      const disconnectSpy = vi.spyOn(service, 'disconnect');
      await service.disconnect();
      expect(disconnectSpy).toHaveBeenCalled();
    });
  });
}); 
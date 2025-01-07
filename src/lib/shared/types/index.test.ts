import { describe, it, expect } from 'vitest';
import { Logger as WinstonLogger } from 'winston';
import { Logger, ServiceConfig, NousAdaptationType } from './index';

describe('Types', () => {
  describe('Logger Interface', () => {
    it('should extend WinstonLogger', () => {
      const mockLogger: Logger = {
        service: 'test-service',
        info: () => undefined,
        error: () => undefined,
        warn: () => undefined,
        debug: () => undefined,
        log: () => undefined,
        add: () => mockLogger,
        remove: () => mockLogger,
        clear: () => mockLogger,
        exceptions: {
          handle: () => mockLogger,
          unhandle: () => mockLogger
        },
        exitOnError: true,
        level: 'info',
        format: undefined,
        transports: [],
        silent: false,
        profile: () => mockLogger,
        configure: () => mockLogger,
        child: () => mockLogger,
        close: async () => undefined
      };

      // Type assertion test - if this compiles, the interface is correct
      const loggerTest: WinstonLogger = mockLogger;
      expect(mockLogger.service).toBe('test-service');
    });
  });

  describe('ServiceConfig Interface', () => {
    it('should allow valid redis configuration', () => {
      const config: ServiceConfig = {
        redis: {
          url: 'redis://localhost:6379',
          password: 'test-password'
        }
      };

      expect(config.redis?.url).toBe('redis://localhost:6379');
      expect(config.redis?.password).toBe('test-password');
    });

    it('should allow minimal redis configuration', () => {
      const config: ServiceConfig = {
        redis: {
          url: 'redis://localhost:6379'
        }
      };

      expect(config.redis?.url).toBe('redis://localhost:6379');
      expect(config.redis?.password).toBeUndefined();
    });

    it('should allow empty configuration', () => {
      const config: ServiceConfig = {};
      expect(config.redis).toBeUndefined();
    });
  });

  describe('NousAdaptationType Enum', () => {
    it('should have correct values', () => {
      expect(NousAdaptationType.BOOST).toBe('boost');
      expect(NousAdaptationType.FILTER).toBe('filter');
      expect(NousAdaptationType.REWRITE).toBe('rewrite');
    });

    it('should be immutable', () => {
      expect(() => {
        (NousAdaptationType as any).BOOST = 'modified';
      }).toThrow();
    });

    it('should have exactly three values', () => {
      const values = Object.values(NousAdaptationType);
      expect(values).toHaveLength(3);
      expect(values).toContain('boost');
      expect(values).toContain('filter');
      expect(values).toContain('rewrite');
    });
  });
}); 
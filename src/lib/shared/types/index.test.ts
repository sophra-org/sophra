import { describe, it, expect } from 'vitest';
import winston, { Logger as WinstonLogger } from 'winston';
import { Logger, ServiceConfig, NousAdaptationType } from './index';

describe('Types', () => {
  describe('Logger Interface', () => {
    it('should extend WinstonLogger', () => {
      let mockLogger: Logger;
      mockLogger = {
        input: () => mockLogger,
        silly: () => mockLogger,
        emerg: () => mockLogger,
        alert: () => mockLogger,
        crit: () => mockLogger,
        warning: () => mockLogger,
        notice: () => mockLogger,
        query: () => mockLogger,
        silent: true,
        format: winston.format.json(),
        levels: winston.config.npm.levels,
        level: 'info',
        data: () => mockLogger,
        prompt: () => mockLogger,
        http: () => mockLogger,
        verbose: () => mockLogger,
        transports: [],
        rejections: {
          handle: () => mockLogger,
          unhandle: () => mockLogger,
          logger: winston.createLogger(),
          handlers: new Map(),
          catcher: () => { },
          getAllInfo: function (err: string | Error): object {
            return {
              process: { pid: 123, title: 'test' },
              os: { platform: 'test', release: '1.0' },
              trace: []
            };
          },
          getProcessInfo: function (): object {
            return {
              pid: 123,
              title: 'test'
            };
          },
          getOsInfo: function (): object {
            return {
              platform: 'test',
              release: '1.0'
            };
          },
          getTrace: function (err: Error): object {
            return {
              message: err.message,
              stack: err.stack,
              name: err.name
            };
          }
        },
        profilers: {},
        help: () => mockLogger,
        service: 'test-service',
        info: () => mockLogger,
        error: () => mockLogger,
        warn: () => mockLogger,
        debug: () => mockLogger,
        log: () => mockLogger,
        add: () => mockLogger,
        remove: () => mockLogger,
        clear: () => mockLogger,
        exceptions: {
          handle: () => mockLogger,
          unhandle: () => mockLogger,
          logger: winston.createLogger(),
          handlers: new Map(),
          catcher: () => { },
          getAllInfo: () => ({
            process: { pid: 123, title: 'test' },
            os: { platform: 'test', release: '1.0' },
            trace: []
          }),
          getProcessInfo: () => ({
            pid: 123,
            title: 'test'
          }),
          getOsInfo: () => ({
            platform: 'test',
            release: '1.0'
          }),
          getTrace: (err: Error) => ({
            message: err.message,
            stack: err.stack,
            name: err.name
          })
        },
        exitOnError: true,
        profile: () => mockLogger,
        configure: () => mockLogger,
        child: () => mockLogger,
        close: () => mockLogger
      } as unknown as Logger;

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
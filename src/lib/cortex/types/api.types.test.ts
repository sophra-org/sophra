import { describe, it, expectTypeOf } from 'vitest';
import type { APIResponse, HealthStatus, EnhancedHealthStatus } from './api';

describe('API Types', () => {
  describe('APIResponse', () => {
    it('should validate APIResponse structure', () => {
      type TestResponse = APIResponse<string>;
      
      expectTypeOf<TestResponse>().toMatchTypeOf<{
        success: boolean;
        data?: string;
        error?: string;
      }>();
    });

    it('should work with different data types', () => {
      type NumberResponse = APIResponse<number>;
      type ObjectResponse = APIResponse<{ id: string }>;
      type ArrayResponse = APIResponse<string[]>;

      expectTypeOf<NumberResponse>().toMatchTypeOf<{
        success: boolean;
        data?: number;
        error?: string;
      }>();

      expectTypeOf<ObjectResponse>().toMatchTypeOf<{
        success: boolean;
        data?: { id: string };
        error?: string;
      }>();

      expectTypeOf<ArrayResponse>().toMatchTypeOf<{
        success: boolean;
        data?: string[];
        error?: string;
      }>();
    });
  });

  describe('HealthStatus', () => {
    it('should validate HealthStatus structure', () => {
      expectTypeOf<HealthStatus>().toMatchTypeOf<{
        elasticsearch: boolean;
        postgres: boolean;
        redis: boolean;
        sync: boolean;
        timestamp: string;
        error?: string;
        stats?: {
          elasticsearch?: {
            indices: number;
            documents: number;
            size: string;
            health: 'green' | 'yellow' | 'red';
          };
          services: {
            [key: string]: {
              latency: number;
              errors?: string[];
            };
          };
        };
      }>();
    });

    it('should allow service stats with any key', () => {
      const status: HealthStatus = {
        elasticsearch: true,
        postgres: true,
        redis: true,
        sync: true,
        timestamp: new Date().toISOString(),
        stats: {
          services: {
            'custom-service': { latency: 100 },
            'another-service': { latency: 200, errors: ['timeout'] },
          },
        },
      };

      expectTypeOf(status).toMatchTypeOf<HealthStatus>();
    });
  });

  describe('EnhancedHealthStatus', () => {
    it('should validate EnhancedHealthStatus structure', () => {
      expectTypeOf<EnhancedHealthStatus>().toMatchTypeOf<HealthStatus & {
        metrics: {
          elasticsearch: {
            indices: {
              count: number;
              totalSize: string;
              docsCount: number;
              health: 'green' | 'yellow' | 'red';
            };
            cluster: {
              status: string;
              nodeCount: number;
              cpuUsage: number;
              memoryUsage: {
                total: string;
                used: string;
                free: string;
              };
            };
            performance: {
              queryLatency: number;
              indexingLatency: number;
              searchRate: number;
              indexingRate: number;
            };
          };
          redis: {
            memory: {
              used: string;
              peak: string;
              fragmentationRatio: number;
            };
            hits: {
              keyspaceHits: number;
              keyspaceMisses: number;
              hitRate: number;
            };
            performance: {
              connectedClients: number;
              blockedClients: number;
              opsPerSecond: number;
            };
          };
          postgres: {
            connections: {
              active: number;
              idle: number;
              max: number;
            };
            performance: {
              queryLatency: number;
              transactionsPerSecond: number;
              cacheHitRatio: number;
            };
            storage: {
              databaseSize: string;
              tableCount: number;
            };
          };
        };
      }>();
    });

    it('should validate that EnhancedHealthStatus extends HealthStatus', () => {
      const status: EnhancedHealthStatus = {
        elasticsearch: true,
        postgres: true,
        redis: true,
        sync: true,
        timestamp: new Date().toISOString(),
        metrics: {
          elasticsearch: {
            indices: {
              count: 10,
              totalSize: '1GB',
              docsCount: 1000,
              health: 'green',
            },
            cluster: {
              status: 'green',
              nodeCount: 3,
              cpuUsage: 50,
              memoryUsage: {
                total: '16GB',
                used: '8GB',
                free: '8GB',
              },
            },
            performance: {
              queryLatency: 50,
              indexingLatency: 100,
              searchRate: 1000,
              indexingRate: 500,
            },
          },
          redis: {
            memory: {
              used: '2GB',
              peak: '2.5GB',
              fragmentationRatio: 1.2,
            },
            hits: {
              keyspaceHits: 10000,
              keyspaceMisses: 1000,
              hitRate: 0.9,
            },
            performance: {
              connectedClients: 100,
              blockedClients: 0,
              opsPerSecond: 5000,
            },
          },
          postgres: {
            connections: {
              active: 50,
              idle: 10,
              max: 100,
            },
            performance: {
              queryLatency: 20,
              transactionsPerSecond: 1000,
              cacheHitRatio: 0.95,
            },
            storage: {
              databaseSize: '5GB',
              tableCount: 50,
            },
          },
        },
      };

      expectTypeOf(status).toMatchTypeOf<EnhancedHealthStatus>();
      expectTypeOf(status).toMatchTypeOf<HealthStatus>();
    });
  });
}); 
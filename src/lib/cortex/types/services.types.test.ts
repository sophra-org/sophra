import { describe, it, expectTypeOf } from 'vitest';
import type { Services } from './services';
import type { BaseDocument } from '@/lib/cortex/elasticsearch/types';

describe('Services Types', () => {
  describe('Services', () => {
    it('should validate Services structure', () => {
      expectTypeOf<Services>().toHaveProperty('elasticsearch');
      expectTypeOf<Services>().toHaveProperty('redis');
      expectTypeOf<Services>().toHaveProperty('postgres');
      expectTypeOf<Services>().toHaveProperty('vectorization');
      expectTypeOf<Services>().toHaveProperty('analytics');
      expectTypeOf<Services>().toHaveProperty('abTesting');
      expectTypeOf<Services>().toHaveProperty('feedback');
      expectTypeOf<Services>().toHaveProperty('metrics');
      expectTypeOf<Services>().toHaveProperty('sessions');
      expectTypeOf<Services>().toHaveProperty('observe');
      expectTypeOf<Services>().toHaveProperty('learning');
      expectTypeOf<Services>().toHaveProperty('engine');
      expectTypeOf<Services>().toHaveProperty('sync');
      expectTypeOf<Services>().toHaveProperty('documents');
      expectTypeOf<Services>().toHaveProperty('health');
    });

    describe('Engine Service', () => {
      it('should validate engine service structure', () => {
        expectTypeOf<Services['engine']>().toMatchTypeOf<{
          instance: any | null;
          testService(): Promise<{
            operational: boolean;
            latency: number;
            errors: string[];
            metrics: {
              status: string;
              uptime: number;
              operations: {
                total: number;
                successful: number;
                failed: number;
                pending: number;
              };
              performance: {
                latency: number;
                throughput: number;
                errorRate: number;
                cpuUsage: number;
                memoryUsage: number;
              };
            };
          }>;
        }>();
      });
    });

    describe('Sync Service', () => {
      it('should validate sync service structure', () => {
        expectTypeOf<Services['sync']>().toMatchTypeOf<{
          getSyncService(): Promise<any>;
          vectorizeDocument(params: { index: string; id: string }): Promise<void>;
          upsertDocument(params: {
            index: string;
            id: string;
            document: Partial<BaseDocument>;
            tableName: string;
          }): Promise<{ id: string }>;
          deleteDocument(params: {
            index: string;
            id: string;
            tableName: string;
          }): Promise<void>;
        }>();
      });
    });

    describe('Documents Service', () => {
      it('should validate documents service structure', () => {
        expectTypeOf<Services['documents']>().toMatchTypeOf<{
          createDocument(params: {
            index: string;
            id: string;
            document: BaseDocument;
          }): Promise<any>;
          getDocument(id: string): Promise<BaseDocument & any>;
          updateDocument(id: string, document: Partial<BaseDocument>): Promise<void>;
          deleteDocument(id: string): Promise<void>;
        }>();
      });
    });

    describe('Health Service', () => {
      it('should validate health service structure', () => {
        expectTypeOf<Services['health']>().toMatchTypeOf<{
          check(): Promise<{
            success: boolean;
            error?: string;
            data: {
              elasticsearch: boolean;
              postgres: boolean;
              redis: boolean;
              sync: boolean;
              timestamp: string;
            };
          }>;
        }>();
      });

      it('should validate health check response', () => {
        type HealthCheckResponse = Awaited<ReturnType<Services['health']['check']>>;

        expectTypeOf<HealthCheckResponse>().toMatchTypeOf<{
          success: boolean;
          error?: string;
          data: {
            elasticsearch: boolean;
            postgres: boolean;
            redis: boolean;
            sync: boolean;
            timestamp: string;
          };
        }>();
      });
    });

    describe('Observe Service', () => {
      it('should validate observe service structure', () => {
        expectTypeOf<Services['observe']>().toMatchTypeOf<{
          collector: any;
          coordinator: any;
        }>();
      });
    });
  });
}); 
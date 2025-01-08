import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET } from './route';
import { NextRequest } from 'next/server';
import { serviceManager } from '@/lib/cortex/utils/service-manager';
import logger from '@/lib/shared/logger';

// Mock dependencies
vi.mock('@/lib/cortex/utils/service-manager', () => ({
  serviceManager: {
    checkConnections: vi.fn(),
  },
}));

vi.mock('@/lib/shared/logger', () => ({
  default: {
    info: vi.fn(),
    error: vi.fn(),
  },
}));

describe('Health Check API Additional Tests', () => {
  let mockRequest: NextRequest;

  beforeEach(() => {
    mockRequest = new NextRequest('http://localhost/api/health');
    vi.clearAllMocks();

    // Mock process.env
    process.env = {
      NODE_ENV: 'test',
      ELASTICSEARCH_URL: 'http://localhost:9200',
      POSTGRESQL_URL: 'postgres://user:pass@localhost:5432/db',
      SOPHRA_REDIS_URL: 'redis://user:pass@localhost:6379',
    };

    // Mock process.uptime
    vi.spyOn(process, 'uptime').mockReturnValue(3600); // 1 hour uptime
  });

  describe('Success Scenarios', () => {
    it('should return 200 when all services are healthy', async () => {
      vi.mocked(serviceManager.checkConnections).mockResolvedValue({
        elasticsearch: true,
        postgres: true,
        redis: true,
      });

      const response = await GET(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual({
        success: true,
        data: {
          status: 'healthy',
          timestamp: expect.any(String),
          services: {
            elasticsearch: {
              connected: true,
              url: 'http://localhost:9200',
            },
            postgres: {
              connected: true,
              url: 'localhost:5432/db',
            },
            redis: {
              connected: true,
              url: 'localhost:6379',
            },
          },
          uptime: 3600,
          environment: 'test',
        },
        meta: {
          took: expect.any(Number),
        },
      });
    });

    it('should return 503 when some services are unhealthy', async () => {
      vi.mocked(serviceManager.checkConnections).mockResolvedValue({
        elasticsearch: true,
        postgres: false,
        redis: true,
      });

      const response = await GET(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(503);
      expect(data.success).toBe(false);
      expect(data.data.status).toBe('unhealthy');
      expect(data.data.services.postgres.connected).toBe(false);
    });

    it('should handle missing service URLs gracefully', async () => {
      process.env.POSTGRESQL_URL = undefined;
      process.env.SOPHRA_REDIS_URL = undefined;

      vi.mocked(serviceManager.checkConnections).mockResolvedValue({
        elasticsearch: true,
        postgres: true,
        redis: true,
      });

      const response = await GET(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.data.services.postgres.url).toBeUndefined();
      expect(data.data.services.redis.url).toBeUndefined();
    });

    it('should include accurate timing information', async () => {
      vi.mocked(serviceManager.checkConnections).mockResolvedValue({
        elasticsearch: true,
        postgres: true,
        redis: true,
      });

      const startTime = Date.now();
      const response = await GET(mockRequest);
      const data = await response.json();
      const endTime = Date.now();

      expect(data.meta.took).toBeGreaterThanOrEqual(0);
      expect(data.meta.took).toBeLessThanOrEqual(endTime - startTime);
    });
  });

  describe('Error Scenarios', () => {
    it('should handle service manager errors', async () => {
      vi.mocked(serviceManager.checkConnections).mockRejectedValue(
        new Error('Connection check failed')
      );

      const response = await GET(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data).toEqual({
        success: false,
        error: 'Connection check failed',
        meta: {
          took: expect.any(Number),
        },
      });
    });

    it('should handle non-Error exceptions', async () => {
      vi.mocked(serviceManager.checkConnections).mockRejectedValue('Unknown error');

      const response = await GET(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data).toEqual({
        success: false,
        error: 'Health check failed',
        meta: {
          took: expect.any(Number),
        },
      });
    });

    it('should log errors appropriately', async () => {
      const error = new Error('Connection check failed');
      vi.mocked(serviceManager.checkConnections).mockRejectedValue(error);

      await GET(mockRequest);

      expect(logger.error).toHaveBeenCalledWith('Basic health check failed', {
        error,
      });
    });
  });

  describe('Security and Privacy', () => {
    it('should not expose sensitive information in URLs', async () => {
      process.env.POSTGRESQL_URL = 'postgres://user:password@host:5432/db';
      process.env.SOPHRA_REDIS_URL = 'redis://user:secret@host:6379';

      vi.mocked(serviceManager.checkConnections).mockResolvedValue({
        elasticsearch: true,
        postgres: true,
        redis: true,
      });

      const response = await GET(mockRequest);
      const data = await response.json();

      expect(data.data.services.postgres.url).not.toContain('password');
      expect(data.data.services.redis.url).not.toContain('secret');
    });
  });

  describe('Response Format', () => {
    it('should include all required fields in the response', async () => {
      vi.mocked(serviceManager.checkConnections).mockResolvedValue({
        elasticsearch: true,
        postgres: true,
        redis: true,
      });

      const response = await GET(mockRequest);
      const data = await response.json();

      expect(data).toHaveProperty('success');
      expect(data).toHaveProperty('data');
      expect(data).toHaveProperty('meta');
      expect(data.data).toHaveProperty('status');
      expect(data.data).toHaveProperty('timestamp');
      expect(data.data).toHaveProperty('services');
      expect(data.data).toHaveProperty('uptime');
      expect(data.data).toHaveProperty('environment');
    });

    it('should return valid timestamps', async () => {
      vi.mocked(serviceManager.checkConnections).mockResolvedValue({
        elasticsearch: true,
        postgres: true,
        redis: true,
      });

      const response = await GET(mockRequest);
      const data = await response.json();

      expect(() => new Date(data.data.timestamp)).not.toThrow();
      expect(new Date(data.data.timestamp).getTime()).toBeLessThanOrEqual(Date.now());
    });
  });
});

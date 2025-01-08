import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { GET, runtime } from './route';
import logger from '@lib/shared/logger';
import OpenAI from 'openai';

// Mock dependencies
vi.mock('@lib/shared/logger', () => ({
  default: {
    error: vi.fn(),
  },
}));

vi.mock('openai', () => ({
  default: vi.fn().mockImplementation(() => ({
    models: {
      list: vi.fn(),
    },
  })),
}));

describe('Health Route Additional Tests', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = {
      ...originalEnv,
      OPENAI_API_KEY: 'test-api-key',
      npm_package_version: '1.0.0',
    };
    vi.clearAllMocks();
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('Configuration', () => {
    it('should use Node.js runtime', () => {
      expect(runtime).toBe('nodejs');
    });
  });

  describe('GET Endpoint', () => {
    it('should return successful health check response', async () => {
      const mockModels = {
        data: [
          { id: 'model-1' },
          { id: 'model-2' },
          { id: 'model-3' },
          { id: 'model-4' },
          { id: 'model-5' },
          { id: 'model-6' },
        ],
      };

      vi.mocked(OpenAI).mockImplementation(
        () =>
          ({
            models: {
              list: vi.fn().mockResolvedValue(mockModels),
            },
          } as any)
      );

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual({
        success: true,
        status: 'ok',
        version: '1.0.0',
        timestamp: expect.any(String),
        openai_status: {
          connected: true,
          available_models: ['model-1', 'model-2', 'model-3', 'model-4', 'model-5'],
        },
      });
    });

    it('should handle OpenAI connection failure', async () => {
      vi.mocked(OpenAI).mockImplementation(
        () =>
          ({
            models: {
              list: vi.fn().mockRejectedValue(new Error('API Error')),
            },
          } as any)
      );

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual({
        success: true,
        status: 'ok',
        version: '1.0.0',
        timestamp: expect.any(String),
        openai_status: {
          connected: false,
          error: 'API Error',
        },
      });

      expect(logger.error).toHaveBeenCalledWith(
        'OpenAI connection error:',
        expect.any(Object)
      );
    });

    it('should handle missing OpenAI API key', async () => {
      delete process.env.OPENAI_API_KEY;

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.openai_status.connected).toBe(false);
      expect(data.openai_status.error).toContain('API key');
    });

    it('should handle missing package version', async () => {
      delete process.env.npm_package_version;

      const response = await GET();
      const data = await response.json();

      expect(data.version).toBe('0.9.0');
    });

    it('should include ISO timestamp', async () => {
      const response = await GET();
      const data = await response.json();

      expect(Date.parse(data.timestamp)).not.toBeNaN();
      expect(data.timestamp).toMatch(
        /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/
      );
    });
  });

  describe('Error Handling', () => {
    it('should handle schema validation errors', async () => {
      // Mock OpenAI to return invalid data
      vi.mocked(OpenAI).mockImplementation(
        () =>
          ({
            models: {
              list: vi.fn().mockResolvedValue({
                data: [{ invalid: 'data' }],
              }),
            },
          } as any)
      );

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data).toEqual({
        success: false,
        status: 'error',
        message: expect.any(String),
        version: '1.0.0',
        timestamp: expect.any(String),
      });
    });

    it('should handle unexpected errors', async () => {
      // Mock OpenAI to throw unexpected error
      vi.mocked(OpenAI).mockImplementation(() => {
        throw new Error('Unexpected error');
      });

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data).toEqual({
        success: false,
        status: 'error',
        message: 'Unexpected error',
        version: '1.0.0',
        timestamp: expect.any(String),
      });

      expect(logger.error).toHaveBeenCalledWith(
        'Health check failed:',
        expect.any(Object)
      );
    });

    it('should handle non-Error objects', async () => {
      // Mock OpenAI to throw non-Error object
      vi.mocked(OpenAI).mockImplementation(() => {
        throw 'String error';
      });

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data).toEqual({
        success: false,
        status: 'error',
        message: 'Health check failed',
        version: '1.0.0',
        timestamp: expect.any(String),
      });
    });
  });

  describe('Response Format', () => {
    it('should set correct content type', async () => {
      const response = await GET();
      expect(response.headers.get('content-type')).toBe('application/json');
    });

    it('should be JSON parseable', async () => {
      const response = await GET();
      expect(() => response.json()).not.toThrow();
    });

    it('should limit available models to 5', async () => {
      const mockModels = {
        data: Array(10)
          .fill(null)
          .map((_, i) => ({ id: `model-${i + 1}` })),
      };

      vi.mocked(OpenAI).mockImplementation(
        () =>
          ({
            models: {
              list: vi.fn().mockResolvedValue(mockModels),
            },
          } as any)
      );

      const response = await GET();
      const data = await response.json();

      expect(data.openai_status.available_models).toHaveLength(5);
      expect(data.openai_status.available_models).toEqual([
        'model-1',
        'model-2',
        'model-3',
        'model-4',
        'model-5',
      ]);
    });

    it('should handle empty models list', async () => {
      vi.mocked(OpenAI).mockImplementation(
        () =>
          ({
            models: {
              list: vi.fn().mockResolvedValue({ data: [] }),
            },
          } as any)
      );

      const response = await GET();
      const data = await response.json();

      expect(data.openai_status.available_models).toEqual([]);
    });
  });
});

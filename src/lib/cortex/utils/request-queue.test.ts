import { describe, it, expect, vi, beforeEach } from 'vitest';
import { RequestQueue } from './request-queue';
import type { Logger } from '@/lib/shared/types';

describe('RequestQueue', () => {
  let requestQueue: RequestQueue;
  let mockLogger: Logger;

  beforeEach(() => {
    mockLogger = {
      info: vi.fn(),
      error: vi.fn(),
      debug: vi.fn(),
      warn: vi.fn(),
      service: 'test',
      http: vi.fn(),
      verbose: vi.fn(),
      silent: false,
      format: {},
      levels: {},
      level: 'info',
    } as unknown as Logger;

    requestQueue = new RequestQueue(2); // Set concurrent limit to 2 for testing
  });

  describe('request processing', () => {
    it('should process requests concurrently within limit', async () => {
      const delays = [100, 50, 150];
      const results: number[] = [];

      const requests = delays.map(delay => async () => {
        await new Promise(resolve => setTimeout(resolve, delay));
        results.push(delay);
        return delay;
      });

      // Start all requests
      const promises = requests.map(req => requestQueue.add(req));
      
      // Wait for all to complete
      await Promise.all(promises);

      // First two should start immediately (concurrent)
      // Third should wait for one of first two
      expect(results).toEqual([50, 100, 150]);
    });

    it('should handle errors in requests', async () => {
      const errorMessage = 'Test error';
      const failingRequest = async () => {
        throw new Error(errorMessage);
      };

      await expect(requestQueue.add(failingRequest)).rejects.toThrow(errorMessage);
    });

    it('should process queued requests after errors', async () => {
      const successRequest = async () => 'success';
      const errorRequest = async () => {
        throw new Error('Test error');
      };

      // Queue multiple requests including failures
      const results = await Promise.allSettled([
        requestQueue.add(successRequest),
        requestQueue.add(errorRequest),
        requestQueue.add(successRequest),
      ]);

      expect(results[0].status).toBe('fulfilled');
      expect(results[1].status).toBe('rejected');
      expect(results[2].status).toBe('fulfilled');
    });
  });

  describe('concurrent processing', () => {
    it('should respect concurrent request limit', async () => {
      const activeRequests = new Set<number>();
      let maxConcurrent = 0;
      const requestId = {current: 0};

      const createRequest = () => async () => {
        const id = ++requestId.current;
        activeRequests.add(id);
        maxConcurrent = Math.max(maxConcurrent, activeRequests.size);
        await new Promise(resolve => setTimeout(resolve, 50));
        activeRequests.delete(id);
        return id;
      };

      // Create 5 requests
      const requests = Array(5).fill(null).map(() => createRequest());
      
      // Execute all requests
      await Promise.all(requests.map(req => requestQueue.add(req)));

      // Should never exceed concurrent limit of 2
      expect(maxConcurrent).toBe(2);
    });

    it('should queue requests when at concurrent limit', async () => {
      const executionOrder: number[] = [];
      const requestId = {current: 0};

      const createRequest = (delay: number) => async () => {
        const id = ++requestId.current;
        await new Promise(resolve => setTimeout(resolve, delay));
        executionOrder.push(id);
        return id;
      };

      // Create requests with different delays
      const requests = [
        createRequest(100), // Long running
        createRequest(100), // Long running
        createRequest(50),  // Should wait despite shorter duration
      ];

      // Execute all requests
      await Promise.all(requests.map(req => requestQueue.add(req)));

      // Third request should execute last despite shorter duration
      // because queue was full
      expect(executionOrder[2]).toBe(3);
    });
  });

  describe('error recovery', () => {
    it('should continue processing after failed requests', async () => {
      const results: (string | Error)[] = [];

      const successRequest = async () => {
        results.push('success');
        return 'success';
      };

      const errorRequest = async () => {
        const error = new Error('Test error');
        results.push(error);
        throw error;
      };

      // Mix of successful and failing requests
      await Promise.allSettled([
        requestQueue.add(successRequest),
        requestQueue.add(errorRequest),
        requestQueue.add(successRequest),
        requestQueue.add(successRequest),
      ]);

      // Should have all results in order
      expect(results.length).toBe(4);
      expect(results[0]).toBe('success');
      expect(results[1]).toBeInstanceOf(Error);
      expect(results[2]).toBe('success');
      expect(results[3]).toBe('success');
    });
  });
});
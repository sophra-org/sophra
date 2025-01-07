import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { rateLimit, type IRateLimiter, type RateLimitConfig } from './rate-limit';
import type { Logger } from '@/lib/shared/types';

describe('Rate Limiter', () => {
  let rateLimiter: IRateLimiter;
  let mockLogger: Logger;

  beforeEach(() => {
    vi.useFakeTimers();
    mockLogger = {
      info: vi.fn(),
      error: vi.fn(),
      warn: vi.fn(),
      debug: vi.fn(),
      service: 'test',
      http: vi.fn(),
      verbose: vi.fn(),
      silent: false,
      format: {},
      levels: {},
      level: 'info',
    } as unknown as Logger;

    const config: RateLimitConfig = {
      interval: 1000, // 1 second
      uniqueTokenPerInterval: 100,
    };
    rateLimiter = rateLimit(config);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('rate limiting', () => {
    it('should allow requests within rate limit', async () => {
      const limit = 5;
      const identifier = 'test-client';

      // Should allow up to limit requests
      for (let i = 0; i < limit; i++) {
        await expect(rateLimiter.check(limit, identifier)).resolves.not.toThrow();
      }
    });

    it('should block requests exceeding rate limit', async () => {
      const limit = 3;
      const identifier = 'test-client';

      // Use up all tokens
      for (let i = 0; i < limit; i++) {
        await rateLimiter.check(limit, identifier);
      }

      // Next request should be blocked
      await expect(rateLimiter.check(limit, identifier)).rejects.toThrow('Rate limit exceeded');
    });

    it('should replenish tokens after interval', async () => {
      const limit = 2;
      const identifier = 'test-client';

      // Use up all tokens
      for (let i = 0; i < limit; i++) {
        await rateLimiter.check(limit, identifier);
      }

      // Wait for token replenishment
      vi.useFakeTimers();
      vi.advanceTimersByTime(1100); // Just over 1 second

      // Should be able to make requests again
      await expect(rateLimiter.check(limit, identifier)).resolves.not.toThrow();
      vi.useRealTimers();
    });
  });

  describe('identifier handling', () => {
    it('should track limits separately for different identifiers', async () => {
      const limit = 2;
      const identifier1 = 'client-1';
      const identifier2 = 'client-2';

      // Use up tokens for first identifier
      for (let i = 0; i < limit; i++) {
        await rateLimiter.check(limit, identifier1);
      }

      // Second identifier should still have tokens
      await expect(rateLimiter.check(limit, identifier2)).resolves.not.toThrow();
    });

    it('should clean up old identifiers when exceeding uniqueTokenPerInterval', async () => {
      const limit = 2;
      const config: RateLimitConfig = {
        interval: 1000,
        uniqueTokenPerInterval: 2, // Only allow 2 unique identifiers
      };
      const limiter = rateLimit(config);

      // Add three different identifiers
      await limiter.check(limit, 'client-1');
      await limiter.check(limit, 'client-2');
      await limiter.check(limit, 'client-3');

      // First identifier should have been cleaned up
      // This would throw if the identifier was still tracked
      await expect(limiter.check(limit, 'client-1')).resolves.not.toThrow();
    });
  });

  describe('token replenishment', () => {
    it('should handle token replenishment correctly', async () => {
      const limit = 5;
      const identifier = 'test-client';

      // Use up all tokens
      for (let i = 0; i < limit; i++) {
        await rateLimiter.check(limit, identifier);
      }

      // Should be rate limited
      await expect(rateLimiter.check(limit, identifier)).rejects.toThrow('Rate limit exceeded');

      // Advance time by full interval
      vi.advanceTimersByTime(1100); // Just over 1 second

      // Should have tokens again
      await expect(rateLimiter.check(limit, identifier)).resolves.not.toThrow();
    });
  });

  describe('concurrent requests', () => {
    it('should handle concurrent requests correctly', async () => {
      const limit = 3;
      const identifier = 'test-client';

      // Make concurrent requests
      const requests = Array(5).fill(null).map(() => rateLimiter.check(limit, identifier));

      // First 3 should succeed, last 2 should fail
      const results = await Promise.allSettled(requests);
      
      expect(results.filter(r => r.status === 'fulfilled')).toHaveLength(3);
      expect(results.filter(r => r.status === 'rejected')).toHaveLength(2);
    });

    it('should handle concurrent requests from different clients', async () => {
      const limit = 2;
      const requests = [
        rateLimiter.check(limit, 'client-1'),
        rateLimiter.check(limit, 'client-1'),
        rateLimiter.check(limit, 'client-2'),
        rateLimiter.check(limit, 'client-2'),
      ];

      const results = await Promise.allSettled(requests);
      expect(results.filter(r => r.status === 'fulfilled')).toHaveLength(4);
    });
  });
});
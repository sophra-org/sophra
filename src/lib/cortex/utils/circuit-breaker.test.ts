import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CircuitBreaker } from './circuit-breaker';
import type { Logger } from '@/lib/shared/types';

describe('CircuitBreaker', () => {
  let circuitBreaker: CircuitBreaker;
  let mockLogger: Logger;

  beforeEach(() => {
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

    circuitBreaker = new CircuitBreaker();
  });

  describe('initialization', () => {
    it('should initialize with circuit closed', () => {
      expect(circuitBreaker.isOpen()).toBe(false);
    });
  });

  describe('error handling', () => {
    it('should open circuit after reaching failure threshold', () => {
      // Simulate multiple failures
      for (let i = 0; i < 5; i++) {
        circuitBreaker.onError();
      }
      expect(circuitBreaker.isOpen()).toBe(true);
    });

    it('should reset after timeout period', async () => {
      // Setup circuit breaker in open state
      for (let i = 0; i < 5; i++) {
        circuitBreaker.onError();
      }
      expect(circuitBreaker.isOpen()).toBe(true);
      
      // Wait for reset timeout (30 seconds)
      vi.useFakeTimers();
      vi.advanceTimersByTime(31000);
      
      expect(circuitBreaker.isOpen()).toBe(false);
      vi.useRealTimers();
    });
  });

  describe('success handling', () => {
    it('should reset failure count after success', () => {
      // First accumulate some failures
      for (let i = 0; i < 3; i++) {
        circuitBreaker.onError();
      }

      // Then record a success
      circuitBreaker.onSuccess();

      // Circuit should be closed and subsequent errors should start from 0
      expect(circuitBreaker.isOpen()).toBe(false);
      circuitBreaker.onError();
      expect(circuitBreaker.isOpen()).toBe(false);
    });
  });

  describe('circuit state transitions', () => {
    it('should transition from closed to open on failures', () => {
      expect(circuitBreaker.isOpen()).toBe(false); // Initially closed
      
      // Add failures until threshold
      for (let i = 0; i < 5; i++) {
        circuitBreaker.onError();
      }
      
      expect(circuitBreaker.isOpen()).toBe(true); // Should be open
    });

    it('should allow reset after timeout', () => {
      // Open the circuit
      for (let i = 0; i < 5; i++) {
        circuitBreaker.onError();
      }
      expect(circuitBreaker.isOpen()).toBe(true);

      // Advance time
      vi.useFakeTimers();
      vi.advanceTimersByTime(31000);

      // Should auto-reset on next check
      expect(circuitBreaker.isOpen()).toBe(false);
      vi.useRealTimers();
    });

    it('should maintain open state within timeout period', () => {
      // Open the circuit
      for (let i = 0; i < 5; i++) {
        circuitBreaker.onError();
      }
      expect(circuitBreaker.isOpen()).toBe(true);

      // Advance time but not enough for reset
      vi.useFakeTimers();
      vi.advanceTimersByTime(15000); // Half the timeout

      // Should still be open
      expect(circuitBreaker.isOpen()).toBe(true);
      vi.useRealTimers();
    });
  });
});
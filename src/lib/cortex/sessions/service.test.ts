import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SessionService } from './service';
import type { RedisClient } from '@/lib/cortex/redis/client';
import type { Logger } from '@/lib/shared/types';

describe('SessionService', () => {
  let sessionService: SessionService;
  let mockRedisClient: RedisClient;
  let mockLogger: Logger;

  beforeEach(() => {
    mockRedisClient = {
      setEx: vi.fn().mockResolvedValue('OK'),
      get: vi.fn(),
      del: vi.fn().mockResolvedValue(1),
      expire: vi.fn().mockResolvedValue(1),
      exists: vi.fn().mockResolvedValue(1),
    } as unknown as RedisClient;

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

    sessionService = new SessionService({
      redis: mockRedisClient,
      logger: mockLogger,
      environment: 'test'
    });
  });

  describe('createSession', () => {
    it('should create a new session', async () => {
      const sessionConfig = {
        userId: 'user-123',
        metadata: { test: 'data' }
      };

      const session = await sessionService.createSession(sessionConfig);

      expect(session).toBeDefined();
      expect(session.id).toBeDefined();
      expect(session.userId).toBe(sessionConfig.userId);
      expect(session.createdAt).toBeDefined();
      expect(session.expiresAt).toBeDefined();
      expect(mockRedisClient.setEx).toHaveBeenCalled();
    });

    it('should handle session creation errors', async () => {
      mockRedisClient.setEx = vi.fn().mockRejectedValue(new Error('Redis error'));

      const sessionConfig = {
        userId: 'user-123',
        metadata: { test: 'data' }
      };

      await expect(sessionService.createSession(sessionConfig)).rejects.toThrow();
      expect(mockLogger.error).toHaveBeenCalled();
    });
  });

  describe('getSession', () => {
    it('should retrieve an existing session', async () => {
      const mockSession = {
        id: 'session-123',
        userId: 'user-123',
        createdAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 3600000).toISOString(),
        metadata: { test: 'data' }
      };

      mockRedisClient.getEx = vi.fn().mockResolvedValue(JSON.stringify(mockSession));

      const session = await sessionService.getSession(mockSession.id);

      expect(session).toBeDefined();
      expect(session?.id).toBe(mockSession.id);
      expect(session?.userId).toBe(mockSession.userId);
      expect(mockRedisClient.getEx).toHaveBeenCalledWith(
        `session:${mockSession.id}`
      );
    });

    it('should return null for non-existent session', async () => {
      mockRedisClient.getEx = vi.fn().mockResolvedValue(null);

      const session = await sessionService.getSession('non-existent');
      expect(session).toBeNull();
    });
  });

  describe('validateSession', () => {
    it('should validate active session', async () => {
      const mockSession = {
        id: 'session-123',
        userId: 'user-123',
        createdAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 3600000).toISOString(),
      };

      mockRedisClient.getEx = vi.fn().mockResolvedValue(JSON.stringify(mockSession));

      const isValid = await sessionService.validateSession(mockSession.id);
      expect(isValid).toBe(true);
    });

    it('should invalidate expired session', async () => {
      const mockSession = {
        id: 'session-123',
        userId: 'user-123',
        createdAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() - 1000).toISOString(),
      };

      mockRedisClient.getEx = vi.fn().mockResolvedValue(JSON.stringify(mockSession));

      const isValid = await sessionService.validateSession(mockSession.id);
      expect(isValid).toBe(false);
      expect(mockRedisClient.del).toHaveBeenCalled();
    });
  });

  describe('extendSession', () => {
    it('should extend session expiration', async () => {
      const mockSession = {
        id: 'session-123',
        userId: 'user-123',
        createdAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 3600000).toISOString(),
      };

      mockRedisClient.getEx = vi.fn().mockResolvedValue(JSON.stringify(mockSession));
      mockRedisClient.setEx = vi.fn().mockResolvedValue('OK');

      const duration = 1800; // 30 minutes
      const extended = await sessionService.extendSession(mockSession.id, duration);

      expect(extended).toBe(true);
      expect(mockRedisClient.setEx).toHaveBeenCalled();
    });

    it('should handle extension errors', async () => {
      mockRedisClient.getEx = vi.fn().mockRejectedValue(new Error('Redis error'));

      const duration = 1800;
      await expect(
        sessionService.extendSession('non-existent', duration)
      ).rejects.toThrow();
      expect(mockLogger.error).toHaveBeenCalled();
    });
  });
});
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { validateToken } from './auth';
import type { Logger } from '@/lib/shared/types';
import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

// Mock dependencies
vi.mock('jsonwebtoken', () => ({
  default: {
    verify: vi.fn(),
    sign: vi.fn(),
    TokenExpiredError: class TokenExpiredError extends Error {
      expiredAt: Date;
      constructor(message: string, expiredAt: Date) {
        super(message);
        this.name = 'TokenExpiredError';
        this.expiredAt = expiredAt;
      }
    },
  },
}));

describe('Auth Middleware', () => {
  // skipcq: JS-0356
  let mockLogger: Logger;
  let mockRes: Response;
  let mockNext: NextFunction;
  const JWT_SECRET = 'test-secret';

  beforeEach(() => {
    // Reset all mocks
    vi.clearAllMocks();

    // Setup environment
    process.env.JWT_SECRET = JWT_SECRET;

    // Setup mock logger
    mockLogger = {
      debug: vi.fn(),
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
      service: 'auth',
      silent: false,
      format: vi.fn(),
      levels: {},
    } as unknown as Logger;

    // Setup mock response
    mockRes = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
      send: vi.fn().mockReturnThis(),
      sendStatus: vi.fn().mockReturnThis(),
    } as unknown as Response;

    // Setup mock next function
    mockNext = vi.fn();
  });

  afterEach(() => {
    // Cleanup environment
    vi.unstubAllEnvs();
  });

  describe('validateToken', () => {
    it('should successfully validate a valid token', () => {
      const mockToken = 'valid.jwt.token';
      const mockPayload = { sub: 'user123' };
      const mockReq = {
        headers: {
          authorization: `Bearer ${mockToken}`,
        },
      } as Request;

      (jwt.verify as any).mockReturnValue(mockPayload);

      validateToken(mockReq, mockRes, mockNext);

      expect(jwt.verify).toHaveBeenCalledWith(mockToken, JWT_SECRET);
      expect(mockNext).toHaveBeenCalled();
      expect((mockReq as any).user).toEqual(mockPayload);
    });

    it('should handle missing token', () => {
      const mockReq = {
        headers: {},
      } as Request;

      validateToken(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'No token provided',
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should handle missing JWT_SECRET', () => {
      delete process.env.JWT_SECRET;
      
      const mockReq = {
        headers: {
          authorization: 'Bearer token',
        },
      } as Request;

      validateToken(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Server configuration error',
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should handle invalid tokens', () => {
      const mockToken = 'invalid.token';
      const mockReq = {
        headers: {
          authorization: `Bearer ${mockToken}`,
        },
      } as Request;

      (jwt.verify as any).mockImplementation(() => {
        throw new Error('Invalid token');
      });

      validateToken(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Invalid token',
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should handle expired tokens', () => {
      const mockToken = 'expired.token';
      const mockReq = {
        headers: {
          authorization: `Bearer ${mockToken}`,
        },
      } as Request;
      const expiredAt = new Date();

      (jwt.verify as any).mockImplementation(() => {
        throw new jwt.TokenExpiredError('Token expired', expiredAt);
      });

      validateToken(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Invalid token',
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should handle malformed authorization header', () => {
      const mockReq = {
        headers: {
          authorization: 'malformed-header',
        },
      } as Request;

      validateToken(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'No token provided',
      });
      expect(mockNext).not.toHaveBeenCalled();
    });
  });
}); 

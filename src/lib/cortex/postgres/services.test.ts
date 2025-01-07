import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PostgresDataService } from './services';
import type { Logger } from '@/lib/shared/types';
import { prisma } from '@/lib/shared/database/client';

vi.mock('@/lib/shared/database/client', () => ({
  prisma: {
    $connect: vi.fn(),
    $disconnect: vi.fn(),
    $queryRaw: vi.fn(),
  },
}));

describe('PostgresDataService', () => {
  let service: PostgresDataService;
  let mockLogger: Logger;

  beforeEach(() => {
    mockLogger = {
      debug: vi.fn(),
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
      service: 'postgres',
      http: vi.fn(),
      verbose: vi.fn(),
      silent: false,
      format: {},
      levels: {},
      level: 'info',
    } as unknown as Logger;

    vi.clearAllMocks();
    service = new PostgresDataService(mockLogger);
  });

  describe('initialize', () => {
    it('should initialize successfully', async () => {
      (prisma.$connect as jest.Mock).mockResolvedValue(undefined);
      
      await service.initialize();
      
      expect(prisma.$connect).toHaveBeenCalled();
      expect(mockLogger.info).toHaveBeenCalledWith('PostgreSQL connection initialized');
    });

    it('should handle initialization errors', async () => {
      const error = new Error('Connection failed');
      (prisma.$connect as jest.Mock).mockRejectedValue(error);
      
      await expect(service.initialize()).rejects.toThrow('Connection failed');
      expect(mockLogger.error).toHaveBeenCalledWith('Failed to initialize PostgreSQL connection', { error });
    });
  });

  describe('healthCheck', () => {
    it('should return true when healthy', async () => {
      (prisma.$queryRaw as jest.Mock).mockResolvedValue([{ '?column?': 1 }]);
      
      const result = await service.healthCheck();
      
      expect(result).toBe(true);
    });

    it('should return false and log error when unhealthy', async () => {
      const error = new Error('Query failed');
      (prisma.$queryRaw as jest.Mock).mockRejectedValue(error);
      
      const result = await service.healthCheck();
      
      expect(result).toBe(false);
      expect(mockLogger.error).toHaveBeenCalledWith('Health check failed', { error });
    });
  });

  describe('disconnect', () => {
    it('should disconnect successfully', async () => {
      (prisma.$connect as jest.Mock).mockResolvedValue(undefined);
      (prisma.$disconnect as jest.Mock).mockResolvedValue(undefined);
      
      await service.initialize();
      await service.disconnect();
      
      expect(prisma.$disconnect).toHaveBeenCalled();
    });

    it('should handle disconnect when not initialized', async () => {
      await service.disconnect();
      
      expect(prisma.$disconnect).not.toHaveBeenCalled();
    });
  });
});
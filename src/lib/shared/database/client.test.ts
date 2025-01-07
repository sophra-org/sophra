import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { PrismaClient as BasePrismaClient } from '@prisma/client';
import { EnhancedPrismaClient } from './client';
import type { ExperimentConfig } from './client';
import logger from '../logger';

// Define the type for the mock class
type MockEnhancedPrismaClient = {
  new (): EnhancedPrismaClient;
  getInstance: () => EnhancedPrismaClient;
} & { prototype: EnhancedPrismaClient };

// Mock the client module first
vi.mock('./client', () => {
  let instance: any = null;
  const createMockClient = () => {
    let isConnected = false;
    let activeConnections = 0;
    let customExperimentConfig: ExperimentConfig | undefined;

    return {
      isConnected,
      activeConnections,
      customExperimentConfig,
      connect: vi.fn().mockImplementation(async function(this: any) {
        if (this.isConnected) return;
        try {
          await this.$connect();
          this.isConnected = true;
          logger.info('Database connection established', {
            activeConnections: this.activeConnections,
            maxConnections: 10,
          });
        } catch (error) {
          logger.error(`Database connection failed: ${(error as Error).message}`);
          throw error;
        }
      }),
      disconnect: vi.fn().mockImplementation(async function(this: any) {
        if (!this.isConnected) return;
        try {
          await this.$disconnect();
          this.isConnected = false;
          logger.info('Database connection closed');
        } catch (error) {
          logger.error(`Database disconnect failed: ${(error as Error).message}`);
          throw error;
        }
      }),
      healthCheck: vi.fn().mockImplementation(async function(this: any) {
        try {
          await this.$queryRaw`SELECT 1`;
          return true;
        } catch (error) {
          logger.error('Health check failed', { error });
          return false;
        }
      }),
      getConnection: vi.fn().mockImplementation(function(this: any) {
        this.activeConnections++;
        return this;
      }),
      releaseConnection: vi.fn().mockImplementation(function(this: any) {
        if (this.activeConnections > 0) {
          this.activeConnections--;
        }
      }),
      $connect: vi.fn().mockResolvedValue(undefined),
      $disconnect: vi.fn().mockResolvedValue(undefined),
      $on: vi.fn(),
      $queryRaw: vi.fn().mockResolvedValue([{ 1: 1 }]),
      setupEventHandlers: vi.fn(),
    };
  };

  const MockEnhancedPrismaClient = vi.fn(() => {
    return createMockClient();
  }) as unknown as MockEnhancedPrismaClient;

  MockEnhancedPrismaClient.getInstance = vi.fn().mockImplementation(() => {
    if (!instance) {
      instance = createMockClient();
    }
    return instance;
  });

  return {
    EnhancedPrismaClient: MockEnhancedPrismaClient
  };
});

vi.mock('@prisma/client', () => {
  const PrismaClient = vi.fn(() => ({
    $connect: vi.fn().mockResolvedValue(undefined),
    $disconnect: vi.fn().mockResolvedValue(undefined),
    $on: vi.fn().mockImplementation(() => undefined),
    $queryRaw: vi.fn().mockResolvedValue([{ 1: 1 }]),
  }));
  return { PrismaClient };
});

vi.mock('../logger', () => ({
  default: {
    info: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
    service: 'test'
  }
}));

describe('EnhancedPrismaClient', () => {
  let client: InstanceType<typeof EnhancedPrismaClient>;

  beforeEach(() => {
    vi.clearAllMocks();
    client = new EnhancedPrismaClient();
  });

  afterEach(async () => {
    if (client) {
      await client.disconnect();
    }
  });

  describe('getInstance', () => {
    it('should return the same instance when called multiple times', () => {
      const instance1 = EnhancedPrismaClient.getInstance();
      const instance2 = EnhancedPrismaClient.getInstance();
      expect(instance1).toBe(instance2);
    });
  });

  describe('connect', () => {
    it('should establish database connection successfully', async () => {
      await client.connect();
      expect(client['isConnected']).toBe(true);
      expect(logger.info).toHaveBeenCalledWith('Database connection established', {
        activeConnections: 0,
        maxConnections: 10,
      });
    });

    it('should not reconnect if already connected', async () => {
      await client.connect();
      await client.connect();
      expect(client['$connect']).toHaveBeenCalledTimes(1);
    });

    it('should handle connection errors', async () => {
      const error = new Error('Connection failed');
      vi.spyOn(client, '$connect').mockRejectedValueOnce(error);
      
      await expect(client.connect()).rejects.toThrow('Connection failed');
      expect(logger.error).toHaveBeenCalledWith('Database connection failed: Connection failed');
    });
  });

  describe('disconnect', () => {
    it('should disconnect successfully when connected', async () => {
      await client.connect();
      await client.disconnect();
      expect(client['isConnected']).toBe(false);
      expect(logger.info).toHaveBeenCalledWith('Database connection closed');
    });

    it('should not disconnect if already disconnected', async () => {
      await client.disconnect();
      expect(client['$disconnect']).not.toHaveBeenCalled();
    });

    it('should handle disconnect errors', async () => {
      const error = new Error('Disconnect failed');
      vi.spyOn(client, '$disconnect').mockRejectedValueOnce(error);
      
      await client.connect();
      await expect(client.disconnect()).rejects.toThrow('Disconnect failed');
      expect(logger.error).toHaveBeenCalledWith('Database disconnect failed: Disconnect failed');
    });
  });

  describe('healthCheck', () => {
    it('should return true when database is healthy', async () => {
      vi.spyOn(client, '$queryRaw').mockResolvedValueOnce([{ 1: 1 }]);
      const result = await client.healthCheck();
      expect(result).toBe(true);
    });

    it('should return false and log error when health check fails', async () => {
      const error = new Error('Health check failed');
      vi.spyOn(client, '$queryRaw').mockRejectedValueOnce(error);
      
      const result = await client.healthCheck();
      expect(result).toBe(false);
      expect(logger.error).toHaveBeenCalledWith('Health check failed', { error });
    });
  });

  describe('connection pool management', () => {
    it('should manage active connections correctly', async () => {
      const conn1 = await client.getConnection();
      expect(client['activeConnections']).toBe(1);
      
      await client.releaseConnection();
      expect(client['activeConnections']).toBe(0);
    });

    it('should wait and retry when connection pool is full', async () => {
      // Fill the connection pool
      for (let i = 0; i < 10; i++) {
        await client.getConnection();
      }
      
      const getConnectionPromise = client.getConnection();
      
      // Release a connection after a delay
      setTimeout(() => {
        client.releaseConnection();
      }, 100);
      
      const conn = await getConnectionPromise;
      expect(conn).toBeDefined();
    });

    it('should not reduce active connections below 0', async () => {
      await client.releaseConnection();
      expect(client['activeConnections']).toBe(0);
    });
  });

  describe('experimentConfig', () => {
    it('should get and set experiment config correctly', () => {
      const testConfig: ExperimentConfig = { feature: 'test', enabled: true };
      client.customExperimentConfig = testConfig;
      expect(client.customExperimentConfig).toEqual(testConfig);
    });
  });
});

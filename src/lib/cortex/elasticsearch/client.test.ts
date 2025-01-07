import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ElasticClient } from './client';
import { Client } from '@elastic/elasticsearch';
import type { Logger } from '@/lib/shared/types';
import { CustomError } from '@/lib/cortex/utils/errors';

// Mock elasticsearch client
vi.mock('@elastic/elasticsearch', () => ({
  Client: vi.fn().mockImplementation(() => ({
    ping: vi.fn(),
    indices: {
      exists: vi.fn(),
      create: vi.fn(),
      delete: vi.fn(),
    },
  })),
}));

describe('ElasticClient', () => {
  let client: ElasticClient;
  let mockLogger: Logger;
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = {
      ...originalEnv,
      ELASTICSEARCH_URL: 'http://localhost:9200',
      ELASTICSEARCH_API_KEY: 'test-api-key',
    };

    mockLogger = {
      debug: vi.fn(),
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
      service: 'elasticsearch',
      silent: false,
      format: vi.fn(),
      levels: {},
    } as unknown as Logger;

    client = new ElasticClient(mockLogger);
  });

  afterEach(() => {
    process.env = originalEnv;
    vi.clearAllMocks();
  });

  describe('constructor', () => {
    it('should create client instance with API key when provided', () => {
      expect(Client).toHaveBeenCalledWith({
        node: 'http://localhost:9200',
        auth: {
          apiKey: 'test-api-key',
        },
      });
    });

    it('should create client instance without auth when no API key provided', () => {
      delete process.env.ELASTICSEARCH_API_KEY;
      client = new ElasticClient(mockLogger);

      expect(Client).toHaveBeenCalledWith({
        node: 'http://localhost:9200',
      });
    });

    it('should use default URL when ELASTICSEARCH_URL is not provided', () => {
      delete process.env.ELASTICSEARCH_URL;
      client = new ElasticClient(mockLogger);

      expect(Client).toHaveBeenCalledWith(
        expect.objectContaining({
          node: 'http://localhost:9200',
        })
      );
    });

    it('should handle initialization errors', () => {
      const mockError = new Error('Initialization failed');
      vi.mocked(Client).mockImplementationOnce(() => {
        throw mockError;
      });

      expect(() => new ElasticClient(mockLogger)).toThrow('Initialization failed');
      expect(mockLogger.error).toHaveBeenCalledWith(
        'Failed to initialize Elasticsearch client',
        expect.objectContaining({ error: mockError })
      );
    });
  });

  describe('ping', () => {
    it('should return true when ping succeeds', async () => {
      const mockClient = client.getClient() as unknown as { ping: ReturnType<typeof vi.fn> };
      mockClient.ping.mockResolvedValue(true);

      const result = await client.ping();

      expect(result).toBe(true);
      expect(mockLogger.debug).toHaveBeenCalledWith('Elasticsearch ping successful');
    });

    it('should return false and log error when ping fails', async () => {
      const mockError = new Error('Ping failed');
      const mockClient = client.getClient() as unknown as { ping: ReturnType<typeof vi.fn> };
      mockClient.ping.mockRejectedValue(mockError);

      const result = await client.ping();

      expect(result).toBe(false);
      expect(mockLogger.error).toHaveBeenCalledWith(
        'Elasticsearch ping failed',
        expect.objectContaining({
          error: expect.objectContaining({
            message: 'Ping failed',
          }),
        })
      );
    });
  });

  describe('createIndex', () => {
    it('should create index when it does not exist', async () => {
      const mockClient = client.getClient() as unknown as {
        indices: {
          exists: ReturnType<typeof vi.fn>;
          create: ReturnType<typeof vi.fn>;
        };
      };
      vi.spyOn(mockClient.indices, 'exists').mockResolvedValue(false);
      vi.spyOn(mockClient.indices, 'create').mockResolvedValue({});

      const mappings = { properties: { field: { type: 'text' } } };
      await client.createIndex('test-index', mappings);

      expect(mockClient.indices.exists).toHaveBeenCalledWith({
        index: 'test-index',
      });
      expect(mockClient.indices.create).toHaveBeenCalledWith({
        index: 'test-index',
        body: { mappings },
      });
      expect(mockLogger.info).toHaveBeenCalledWith('Created index: test-index');
    });

    it('should skip creation when index already exists', async () => {
      const mockClient = client.getClient() as unknown as {
        indices: {
          exists: ReturnType<typeof vi.fn>;
          create: ReturnType<typeof vi.fn>;
        };
      };
      vi.spyOn(mockClient.indices, 'exists').mockResolvedValue(true);

      const mappings = { properties: { field: { type: 'text' } } };
      await client.createIndex('test-index', mappings);

      expect(mockClient.indices.exists).toHaveBeenCalledWith({
        index: 'test-index',
      });
      expect(mockClient.indices.create).not.toHaveBeenCalled();
      expect(mockLogger.debug).toHaveBeenCalledWith('Index test-index already exists');
    });

    it('should handle creation errors', async () => {
      const mockError = new Error('Creation failed');
      const mockClient = client.getClient() as unknown as {
        indices: {
          exists: ReturnType<typeof vi.fn>;
          create: ReturnType<typeof vi.fn>;
        };
      };
      vi.spyOn(mockClient.indices, 'exists').mockResolvedValue(false);
      vi.spyOn(mockClient.indices, 'create').mockRejectedValue(mockError);

      const mappings = { properties: { field: { type: 'text' } } };
      await expect(client.createIndex('test-index', mappings)).rejects.toThrow(
        CustomError
      );

      expect(mockLogger.error).toHaveBeenCalledWith(
        'Failed to create index: test-index',
        expect.objectContaining({
          error: expect.objectContaining({
            message: 'Creation failed',
          }),
        })
      );
    });
  });

  describe('deleteIndex', () => {
    it('should delete index when it exists', async () => {
      const mockClient = client.getClient() as unknown as {
        indices: {
          exists: ReturnType<typeof vi.fn>;
          delete: ReturnType<typeof vi.fn>;
        };
      };
      vi.spyOn(mockClient.indices, 'exists').mockResolvedValue(true);
      vi.spyOn(mockClient.indices, 'delete').mockResolvedValue({});

      await client.deleteIndex('test-index');

      expect(mockClient.indices.exists).toHaveBeenCalledWith({
        index: 'test-index',
      });
      expect(mockClient.indices.delete).toHaveBeenCalledWith({
        index: 'test-index',
      });
      expect(mockLogger.info).toHaveBeenCalledWith('Deleted index: test-index');
    });

    it('should skip deletion when index does not exist', async () => {
      const mockClient = client.getClient() as unknown as {
        indices: {
          exists: ReturnType<typeof vi.fn>;
          delete: ReturnType<typeof vi.fn>;
        };
      };
      vi.spyOn(mockClient.indices, 'exists').mockResolvedValue(false);

      await client.deleteIndex('test-index');

      expect(mockClient.indices.exists).toHaveBeenCalledWith({
        index: 'test-index',
      });
      expect(mockClient.indices.delete).not.toHaveBeenCalled();
      expect(mockLogger.debug).toHaveBeenCalledWith('Index test-index does not exist');
    });

    it('should handle deletion errors', async () => {
      const mockError = new Error('Deletion failed');
      const mockClient = client.getClient() as unknown as {
        indices: {
          exists: ReturnType<typeof vi.fn>;
          delete: ReturnType<typeof vi.fn>;
        };
      };
      vi.spyOn(mockClient.indices, 'exists').mockResolvedValue(true);
      vi.spyOn(mockClient.indices, 'delete').mockRejectedValue(mockError);

      await expect(client.deleteIndex('test-index')).rejects.toThrow(CustomError);

      expect(mockLogger.error).toHaveBeenCalledWith(
        'Failed to delete index: test-index',
        expect.objectContaining({
          error: expect.objectContaining({
            message: 'Deletion failed',
          }),
        })
      );
    });
  });

  describe('getClient', () => {
    it('should return the elasticsearch client instance', () => {
      const esClient = client.getClient();
      expect(esClient).toBeDefined();
      expect(esClient).toBeInstanceOf(Object);
    });
  });
}); 
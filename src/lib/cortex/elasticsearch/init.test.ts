import { describe, it, expect, vi, beforeEach } from 'vitest';
import { initializeIndices } from './init';
import type { ElasticsearchService } from './services';
import type { Logger } from '@/lib/shared/types';
import { BaseMapping } from './mappings';

describe('Elasticsearch Initialization', () => {
  let mockElasticsearch: jest.Mocked<ElasticsearchService>;
  let mockLogger: Logger;

  beforeEach(() => {
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

    mockElasticsearch = {
      indexExists: vi.fn(),
      createIndex: vi.fn(),
    } as unknown as jest.Mocked<ElasticsearchService>;
  });

  describe('initializeIndices', () => {
    it('should create indices that do not exist', async () => {
      mockElasticsearch.indexExists.mockResolvedValue(false);
      mockElasticsearch.createIndex.mockResolvedValue(undefined);

      await initializeIndices(mockElasticsearch, mockLogger);

      expect(mockElasticsearch.indexExists).toHaveBeenCalledTimes(2); // documents and test_documents
      expect(mockElasticsearch.createIndex).toHaveBeenCalledTimes(2);
      expect(mockElasticsearch.createIndex).toHaveBeenCalledWith('documents', {
        body: {
          settings: {
            number_of_shards: 1,
            number_of_replicas: 1,
            analysis: {
              analyzer: {
                default: {
                  type: 'standard',
                  stopwords: '_english_',
                },
              },
            },
          },
          mappings: {
            dynamic: false,
            properties: BaseMapping,
          },
        },
      });
      expect(mockLogger.info).toHaveBeenCalledWith('Elasticsearch indices initialized successfully');
    });

    it('should skip creation for indices that already exist', async () => {
      mockElasticsearch.indexExists.mockResolvedValue(true);

      await initializeIndices(mockElasticsearch, mockLogger);

      expect(mockElasticsearch.indexExists).toHaveBeenCalledTimes(2);
      expect(mockElasticsearch.createIndex).not.toHaveBeenCalled();
      expect(mockLogger.info).toHaveBeenCalledWith(expect.stringMatching(/Index .* already exists/));
    });

    it('should handle initialization errors', async () => {
      const mockError = new Error('Initialization failed');
      mockElasticsearch.indexExists.mockRejectedValue(mockError);

      await expect(initializeIndices(mockElasticsearch, mockLogger)).rejects.toThrow(
        'Initialization failed'
      );

      expect(mockLogger.error).toHaveBeenCalledWith(
        'Failed to initialize Elasticsearch indices',
        expect.objectContaining({ error: mockError })
      );
    });

    it('should handle mixed index states', async () => {
      // First index exists, second doesn't
      mockElasticsearch.indexExists
        .mockResolvedValueOnce(true)
        .mockResolvedValueOnce(false);
      mockElasticsearch.createIndex.mockResolvedValue(undefined);

      await initializeIndices(mockElasticsearch, mockLogger);

      expect(mockElasticsearch.indexExists).toHaveBeenCalledTimes(2);
      expect(mockElasticsearch.createIndex).toHaveBeenCalledTimes(1);
      expect(mockLogger.info).toHaveBeenCalledWith(expect.stringMatching(/Index .* already exists/));
      expect(mockLogger.info).toHaveBeenCalledWith(expect.stringMatching(/Created index: .*/));
    });

    it('should handle creation errors for specific indices', async () => {
      mockElasticsearch.indexExists.mockResolvedValue(false);
      const mockError = new Error('Creation failed');
      mockElasticsearch.createIndex
        .mockResolvedValueOnce(undefined)
        .mockRejectedValueOnce(mockError);

      await expect(initializeIndices(mockElasticsearch, mockLogger)).rejects.toThrow(
        'Creation failed'
      );

      expect(mockElasticsearch.createIndex).toHaveBeenCalledTimes(2);
      expect(mockLogger.error).toHaveBeenCalledWith(
        'Failed to initialize Elasticsearch indices',
        expect.objectContaining({ error: mockError })
      );
    });
  });
}); 
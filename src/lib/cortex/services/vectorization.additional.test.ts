import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { VectorizationService } from './vectorization';
import { BaseDocument } from '@lib/cortex/elasticsearch/types';
import logger from '@lib/shared/logger';

// Mock dependencies
vi.mock('@lib/shared/logger', () => ({
  default: {
    error: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
  },
}));

// Mock global fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('VectorizationService Additional Tests', () => {
  const validApiKey = 'test-api-key';
  let service: VectorizationService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new VectorizationService({ apiKey: validApiKey });
  });

  describe('Constructor', () => {
    it('should initialize with valid API key', () => {
      expect(() => new VectorizationService({ apiKey: validApiKey })).not.toThrow();
    });

    it('should throw error without API key', () => {
      expect(() => new VectorizationService({ apiKey: '' })).toThrow(
        'OpenAI API key is required for vectorization service'
      );
    });
  });

  describe('Embedding Generation', () => {
    const validEmbedding = Array(3072).fill(0.1);
    const mockOpenAIResponse = {
      data: [{ embedding: validEmbedding }],
    };

    it('should generate embeddings successfully', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockOpenAIResponse),
      });

      const embeddings = await service.generateEmbeddings('test text', validApiKey);

      expect(embeddings).toEqual(validEmbedding);
      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.openai.com/v1/embeddings',
        expect.objectContaining({
          method: 'POST',
          headers: {
            Authorization: `Bearer ${validApiKey}`,
            'Content-Type': 'application/json',
          },
          body: expect.any(String),
        })
      );
    });

    it('should handle OpenAI API errors', async () => {
      const errorMessage = 'Invalid API key';
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: () => Promise.resolve({ error: { message: errorMessage } }),
      });

      await expect(service.generateEmbeddings('test text', validApiKey)).rejects.toThrow(
        `OpenAI API error: ${errorMessage}`
      );
      expect(logger.error).toHaveBeenCalledWith(
        'OpenAI API error',
        expect.objectContaining({
          status: 401,
        })
      );
    });

    it('should validate embedding dimensions', async () => {
      const invalidEmbedding = Array(100).fill(0.1); // Wrong dimensions
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ data: [{ embedding: invalidEmbedding }] }),
      });

      await expect(service.generateEmbeddings('test text', validApiKey)).rejects.toThrow(
        'Invalid embedding dimensions'
      );
    });

    it('should handle missing embedding in response', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ data: [] }),
      });

      await expect(service.generateEmbeddings('test text', validApiKey)).rejects.toThrow(
        'No embedding returned from OpenAI API'
      );
    });

    it('should handle network errors', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      await expect(service.generateEmbeddings('test text', validApiKey)).rejects.toThrow(
        'Network error'
      );
      expect(logger.error).toHaveBeenCalledWith(
        'Embedding generation failed',
        expect.any(Object)
      );
    });
  });

  describe('Document Vectorization', () => {
    const mockDocument: BaseDocument = {
      id: 'test-doc',
      title: 'Test Title',
      abstract: 'Test Abstract',
      content: 'Test Content',
      authors: ['Author 1'],
      source: 'Test Source',
      tags: ['test'],
      metadata: {},
      processing_status: 'pending',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      embeddings: [],
      evaluationScore: {
        actionability: 0,
        aggregate: 0,
        clarity: 0,
        credibility: 0,
        relevance: 0,
      },
      evaluation_score: {
        actionability: 0,
        aggregate: 0,
        clarity: 0,
        credibility: 0,
        relevance: 0,
      },
      type: 'document',
    };

    const validEmbedding = Array(3072).fill(0.1);

    it('should vectorize document successfully', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ data: [{ embedding: validEmbedding }] }),
      });

      const result = await service.vectorizeDocument(mockDocument);

      expect(result).toEqual({
        ...mockDocument,
        embeddings: validEmbedding,
        processing_status: 'completed',
        metadata: {
          last_vectorized: expect.any(String),
        },
      });
    });

    it('should use provided API key over instance key', async () => {
      const customApiKey = 'custom-api-key';
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ data: [{ embedding: validEmbedding }] }),
      });

      await service.vectorizeDocument(mockDocument, { apiKey: customApiKey });

      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: `Bearer ${customApiKey}`,
          }),
        })
      );
    });

    it('should handle missing API key', async () => {
      const serviceWithoutKey = new VectorizationService({ apiKey: '' });

      await expect(serviceWithoutKey.vectorizeDocument(mockDocument)).rejects.toThrow(
        'OpenAI API key is required for vectorization'
      );
    });

    it('should handle vectorization errors', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Vectorization failed'));

      await expect(service.vectorizeDocument(mockDocument)).rejects.toThrow(
        'Vectorization failed'
      );
      expect(logger.error).toHaveBeenCalledWith(
        'Vectorization failed',
        expect.objectContaining({
          docId: mockDocument.id,
        })
      );
    });
  });

  describe('Batch Processing', () => {
    const createMockDocument = (id: string): BaseDocument => ({
      id,
      title: `Title ${id}`,
      abstract: `Abstract ${id}`,
      content: `Content ${id}`,
      authors: ['Author 1'],
      source: 'Test Source',
      tags: ['test'],
      metadata: {},
      processing_status: 'pending',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      embeddings: [],
      evaluationScore: {
        actionability: 0,
        aggregate: 0,
        clarity: 0,
        credibility: 0,
        relevance: 0,
      },
      evaluation_score: {
        actionability: 0,
        aggregate: 0,
        clarity: 0,
        credibility: 0,
        relevance: 0,
      },
      type: 'document',
    });

    const mockDocuments = [
      createMockDocument('doc-1'),
      createMockDocument('doc-2'),
    ];

    const validEmbedding = Array(3072).fill(0.1);

    it('should process multiple documents in parallel', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ data: [{ embedding: validEmbedding }] }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ data: [{ embedding: validEmbedding }] }),
        });

      const results = await service.vectorizeBatch(mockDocuments);

      expect(results).toHaveLength(2);
      results.forEach((result) => {
        expect(result).toHaveProperty('embeddings');
        expect(result.processing_status).toBe('completed');
      });
    });

    it('should handle errors in batch processing', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ data: [{ embedding: validEmbedding }] }),
        })
        .mockRejectedValueOnce(new Error('Processing failed'));

      await expect(service.vectorizeBatch(mockDocuments)).rejects.toThrow();
      expect(logger.error).toHaveBeenCalled();
    });
  });

  describe('Health Check', () => {
    it('should return true when service is healthy', async () => {
      const health = await service.checkHealth();
      expect(health).toBe(true);
    });

    it('should handle health check errors gracefully', async () => {
      // Simulate an error by making the service invalid
      const invalidService = new VectorizationService({ apiKey: validApiKey });
      Object.defineProperty(invalidService, 'openaiApiKey', { value: undefined });

      const health = await invalidService.checkHealth();
      expect(health).toBe(false);
    });
  });
});

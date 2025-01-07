import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ValidationService } from './validation-service';
import type { Logger } from '@/lib/shared/types';
import type { BaseDocument } from '@/lib/cortex/elasticsearch/types';
import type { SearchResult } from './validation-service';

const mockBaseDocument: BaseDocument = {
    id: '123',
    title: 'Test Document',
    content: 'Test Content',
    abstract: '',
    authors: [],
    source: '',
    tags: [],
    metadata: {},
    processing_status: 'pending',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    embeddings: Array(3072).fill(0.1),
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
    type: ''
};

describe('ValidationService', () => {
  let validationService: ValidationService;
  let mockLogger: Logger;

  beforeEach(() => {
    mockLogger = {
      debug: vi.fn(),
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
      service: 'validation-service',
      silent: false,
      format: vi.fn(),
      levels: {},
    } as unknown as Logger;

    validationService = new ValidationService();
  });

  describe('validateSearchResults', () => {
    it('should validate valid search results', () => {
      const mockResults: SearchResult<BaseDocument>[] = [
        {
          id: '123',
          score: 0.95,
          document: mockBaseDocument,
          hits: {
            total: { value: 1, relation: 'eq' },
            hits: [],
          },
        },
      ];

      const isValid = validationService.validateSearchResults(mockResults);
      expect(isValid).toBe(true);
    });

    it('should invalidate results with missing required fields', () => {
      const mockResults: SearchResult<BaseDocument>[] = [
        {
          id: 123, // Invalid type - should be string
          score: 0.95,
          document: mockBaseDocument,
          hits: {
            total: { value: 1, relation: 'eq' },
            hits: [],
          },
        },
      ];

      const isValid = validationService.validateSearchResults(mockResults);
      expect(isValid).toBe(false);
    });

    it('should handle empty results array', () => {
      const isValid = validationService.validateSearchResults([]);
      expect(isValid).toBe(true);
    });
  });

  describe('validateVectorization', () => {
    it('should validate correctly vectorized document', () => {
      const mockDocumentWithVectors: BaseDocument = {
        ...mockBaseDocument,
        embeddings: Array(3072).fill(0.1),
      };

      const isValid = validationService.validateVectorization(mockDocumentWithVectors);
      expect(isValid).toBe(true);
    });

    it('should invalidate document without embeddings', () => {
      const mockDocumentWithoutVectors: BaseDocument = {
        ...mockBaseDocument,
        embeddings: [],
      };

      const isValid = validationService.validateVectorization(mockDocumentWithoutVectors);
      expect(isValid).toBe(false);
    });

    it('should invalidate document with wrong embeddings length', () => {
      const mockDocumentWithWrongLength: BaseDocument = {
        ...mockBaseDocument,
        embeddings: Array(100).fill(0.1),
      };

      const isValid = validationService.validateVectorization(mockDocumentWithWrongLength);
      expect(isValid).toBe(false);
    });

    it('should invalidate document with non-numeric embeddings', () => {
      const mockDocumentWithInvalidEmbeddings: BaseDocument = {
        ...mockBaseDocument,
        embeddings: Array(3072).fill('invalid'),
      };

      const isValid = validationService.validateVectorization(mockDocumentWithInvalidEmbeddings);
      expect(isValid).toBe(false);
    });
  });
}); 
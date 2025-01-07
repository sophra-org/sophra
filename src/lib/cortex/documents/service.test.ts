import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ElasticsearchDocumentService } from './service';
import type { Logger } from '@/lib/shared/types';
import type { ElasticsearchService } from '@/lib/cortex/elasticsearch/services';
import type { BaseDocument, ProcessedDocumentMetadata } from '@/lib/cortex/elasticsearch/types';
import { prisma } from '@/lib/shared/database/client';

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
    type: ''
};

const mockProcessedDoc: ProcessedDocumentMetadata = {
  id: '123',
  version: 1,
  created_at: new Date('2024-01-01T00:00:00Z'),
  updated_at: new Date('2024-01-01T00:00:00Z'),
};

vi.mock('@/lib/shared/database/client', () => ({
  prisma: {
    $queryRaw: vi.fn(),
    $executeRaw: vi.fn(),
  },
}));

describe('ElasticsearchDocumentService', () => {
  let documentService: ElasticsearchDocumentService;
  let mockElasticsearch: jest.Mocked<ElasticsearchService>;

  beforeEach(() => {
    mockElasticsearch = {
      getDocument: vi.fn(),
      updateDocument: vi.fn().mockImplementation(async () => Promise.resolve()),
      upsertDocument: vi.fn(),
      deleteDocument: vi.fn().mockImplementation(async () => Promise.resolve()),
      indexExists: vi.fn(),
      createIndex: vi.fn(),
      search: vi.fn(),
    } as unknown as jest.Mocked<ElasticsearchService>;

    documentService = new ElasticsearchDocumentService(
      mockElasticsearch,
      'test-index',
      prisma
    );
  });

  describe('createDocument', () => {
    it('should create a document successfully', async () => {
      mockElasticsearch.upsertDocument.mockResolvedValue(mockProcessedDoc);

      const result = await documentService.createDocument(mockBaseDocument);

      expect(result).toEqual(mockProcessedDoc);
      expect(mockElasticsearch.upsertDocument).toHaveBeenCalledWith(
        'test-index',
        mockBaseDocument.id,
        expect.objectContaining({
          id: mockBaseDocument.id,
          title: mockBaseDocument.title,
          content: mockBaseDocument.content,
          processing_status: 'pending',
        })
      );
    });

    it('should handle document creation errors', async () => {
      const mockError = new Error('Failed to create document');
      mockElasticsearch.upsertDocument.mockRejectedValue(mockError);

      await expect(documentService.createDocument(mockBaseDocument))
        .rejects.toThrow('Failed to create document');
    });
  });

  describe('getDocument', () => {
    it('should retrieve a document successfully', async () => {
      const mockDocumentResponse = {
        id: '123',
        title: 'Test Document',
        content: 'Test Content',
        abstract: '',
        authors: [],
        source: '',
        tags: [],
        metadata: {},
        processing_status: 'pending',
        created_at: '2024-01-01T00:00:00.000Z',
        updated_at: '2024-01-01T00:00:00.000Z',
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
        type: '',
        version: 1
      };

      mockElasticsearch.getDocument.mockResolvedValue(mockDocumentResponse);

      const result = await documentService.getDocument('123');

      expect(result).toEqual(mockDocumentResponse);
      expect(mockElasticsearch.getDocument).toHaveBeenCalledWith('test-index', '123');
    });

    it('should handle document not found', async () => {
      mockElasticsearch.getDocument.mockResolvedValue(null);

      await expect(documentService.getDocument('123'))
        .rejects.toThrow('Document not found: 123');
    });
  });

  describe('updateDocument', () => {
    it('should update a document successfully', async () => {
      await documentService.updateDocument('123', {
        title: 'Updated Title',
      });

      expect(mockElasticsearch.updateDocument).toHaveBeenCalledWith(
        'test-index',
        '123',
        { title: 'Updated Title' }
      );
    });

    it('should handle update errors', async () => {
      const mockError = new Error('Failed to update document');
      mockElasticsearch.updateDocument.mockRejectedValueOnce(mockError);

      await expect(documentService.updateDocument('123', { title: 'Updated Title' }))
        .rejects.toThrow('Failed to update document');
    });
  });

  describe('deleteDocument', () => {
    it('should delete a document successfully', async () => {
      await documentService.deleteDocument('123');

      expect(mockElasticsearch.deleteDocument).toHaveBeenCalledWith('test-index', '123');
    });

    it('should handle deletion errors', async () => {
      const mockError = new Error('Failed to delete document');
      mockElasticsearch.deleteDocument.mockRejectedValueOnce(mockError);

      await expect(documentService.deleteDocument('123'))
        .rejects.toThrow('Failed to delete document');
    });
  });

  describe('ensureTable', () => {
    it('should create table if it does not exist', async () => {
      vi.spyOn(prisma, '$queryRaw').mockResolvedValue([{ exists: false }]);
      vi.spyOn(prisma, '$executeRaw').mockResolvedValue(1); // Fixing the type error by returning a number

      await documentService.ensureTable('test_table');

      expect(prisma.$queryRaw).toHaveBeenCalled();
      expect(prisma.$executeRaw).toHaveBeenCalled();
    });

    it('should not create table if it already exists', async () => {
      vi.spyOn(prisma, '$queryRaw').mockResolvedValue([{ exists: true }]);
      vi.spyOn(prisma, '$executeRaw').mockResolvedValue(1); // Fixing the type error by returning a number

      await documentService.ensureTable('test_table');

      expect(prisma.$queryRaw).toHaveBeenCalled();
      expect(prisma.$executeRaw).not.toHaveBeenCalled();
    });

    it('should handle table creation errors', async () => {
      const mockError = new Error('Failed to create table');
      vi.spyOn(prisma, '$queryRaw').mockRejectedValue(mockError);

      await expect(documentService.ensureTable('test_table'))
        .rejects.toThrow('Failed to create table');
    });
  });
});
import { describe, it, expect } from 'vitest';
import { BaseMapping } from './mappings';

describe('Elasticsearch Mappings', () => {
  describe('BaseMapping', () => {
    it('should define required fields with correct types', () => {
      expect(BaseMapping).toEqual(
        expect.objectContaining({
          id: { type: 'keyword' },
          title: {
            type: 'text',
            fields: {
              keyword: {
                type: 'keyword',
                ignore_above: 256,
              },
            },
          },
          content: {
            type: 'text',
            fields: {
              keyword: {
                type: 'keyword',
                ignore_above: 256,
              },
            },
          },
          processing_status: { type: 'keyword' },
          created_at: { type: 'date' },
          updated_at: { type: 'date' },
        })
      );
    });

    it('should define embeddings field with correct vector configuration', () => {
      expect(BaseMapping.embeddings).toEqual({
        type: 'dense_vector',
        dims: 3072,
        index: true,
        similarity: 'cosine',
        index_options: {
          type: 'int8_hnsw',
          m: 16,
          ef_construction: 100,
        },
      });
    });

    it('should define evaluation score fields with correct structure', () => {
      const expectedScoreStructure = {
        type: 'object',
        properties: {
          actionability: { type: 'float' },
          aggregate: { type: 'float' },
          clarity: { type: 'float' },
          credibility: { type: 'float' },
          relevance: { type: 'float' },
        },
      };

      expect(BaseMapping.evaluationScore).toEqual(expectedScoreStructure);
      expect(BaseMapping.evaluation_score).toEqual(expectedScoreStructure);
    });

    it('should define metadata field with correct structure', () => {
      expect(BaseMapping.metadata).toEqual({
        type: 'object',
        properties: {
          title: {
            type: 'text',
            fields: {
              keyword: {
                type: 'keyword',
                ignore_above: 256,
              },
            },
          },
        },
      });
    });

    it('should define array fields with correct text and keyword mappings', () => {
      const expectedArrayFieldStructure = {
        type: 'text',
        fields: {
          keyword: {
            type: 'keyword',
            ignore_above: 256,
          },
        },
      };

      expect(BaseMapping.authors).toEqual(expectedArrayFieldStructure);
      expect(BaseMapping.tags).toEqual(expectedArrayFieldStructure);
    });

    it('should define count fields with correct type', () => {
      expect(BaseMapping.citationCount).toEqual({ type: 'long' });
      expect(BaseMapping.viewCount).toEqual({ type: 'long' });
    });

    it('should define year fields with correct type', () => {
      expect(BaseMapping.yearPublished).toEqual({ type: 'long' });
      expect(BaseMapping.year_published).toEqual({ type: 'long' });
    });

    it('should include all required fields', () => {
      const requiredFields = [
        'id',
        'title',
        'content',
        'abstract',
        'authors',
        'source',
        'tags',
        'metadata',
        'processing_status',
        'created_at',
        'updated_at',
        'embeddings',
        'evaluationScore',
        'evaluation_score',
      ];

      requiredFields.forEach(field => {
        expect(BaseMapping).toHaveProperty(field);
      });
    });
  });
}); 
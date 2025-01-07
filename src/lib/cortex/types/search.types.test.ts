import { describe, it, expectTypeOf } from 'vitest';
import type { TextQuery, VectorQuery, AdvancedSearchRequest, SearchResult, CachedSearchResult } from './search';
import type { BaseDocument } from '@/lib/cortex/elasticsearch/types';

describe('Search Types', () => {
  describe('TextQuery', () => {
    it('should validate TextQuery structure', () => {
      expectTypeOf<TextQuery>().toMatchTypeOf<{
        fields: string[];
        query: string;
        fuzziness?: "AUTO" | "0" | "1" | "2";
        operator?: "AND" | "OR";
      }>();
    });

    it('should validate text query with all options', () => {
      const query: TextQuery = {
        fields: ['title', 'content'],
        query: 'search term',
        fuzziness: 'AUTO',
        operator: 'AND',
      };

      expectTypeOf(query).toMatchTypeOf<TextQuery>();
    });

    it('should validate text query with minimal options', () => {
      const query: TextQuery = {
        fields: ['content'],
        query: 'search term',
      };

      expectTypeOf(query).toMatchTypeOf<TextQuery>();
    });
  });

  describe('VectorQuery', () => {
    it('should validate VectorQuery structure', () => {
      expectTypeOf<VectorQuery>().toMatchTypeOf<{
        field: string;
        vector: number[];
        k?: number;
        minScore?: number;
      }>();
    });

    it('should validate vector query with all options', () => {
      const query: VectorQuery = {
        field: 'embedding',
        vector: [0.1, 0.2, 0.3],
        k: 10,
        minScore: 0.8,
      };

      expectTypeOf(query).toMatchTypeOf<VectorQuery>();
    });

    it('should validate vector query with minimal options', () => {
      const query: VectorQuery = {
        field: 'embedding',
        vector: [0.1, 0.2, 0.3],
      };

      expectTypeOf(query).toMatchTypeOf<VectorQuery>();
    });
  });

  describe('AdvancedSearchRequest', () => {
    it('should validate AdvancedSearchRequest structure', () => {
      expectTypeOf<AdvancedSearchRequest>().toMatchTypeOf<{
        index: string;
        searchType: "text" | "vector" | "hybrid";
        textQuery?: TextQuery;
        vectorQuery?: VectorQuery;
        boost?: {
          textWeight?: number;
          vectorWeight?: number;
        };
        from?: number;
        size?: number;
        facets?: {
          fields: string[];
          size?: number;
        };
        aggregations?: Record<string, any>;
      }>();
    });

    it('should validate text search request', () => {
      const request: AdvancedSearchRequest = {
        index: 'documents',
        searchType: 'text',
        textQuery: {
          fields: ['title', 'content'],
          query: 'search term',
          fuzziness: 'AUTO',
        },
        size: 10,
      };

      expectTypeOf(request).toMatchTypeOf<AdvancedSearchRequest>();
    });

    it('should validate vector search request', () => {
      const request: AdvancedSearchRequest = {
        index: 'documents',
        searchType: 'vector',
        vectorQuery: {
          field: 'embedding',
          vector: [0.1, 0.2, 0.3],
          k: 10,
        },
      };

      expectTypeOf(request).toMatchTypeOf<AdvancedSearchRequest>();
    });

    it('should validate hybrid search request', () => {
      const request: AdvancedSearchRequest = {
        index: 'documents',
        searchType: 'hybrid',
        textQuery: {
          fields: ['title', 'content'],
          query: 'search term',
        },
        vectorQuery: {
          field: 'embedding',
          vector: [0.1, 0.2, 0.3],
        },
        boost: {
          textWeight: 0.3,
          vectorWeight: 0.7,
        },
        facets: {
          fields: ['category', 'tags'],
          size: 10,
        },
      };

      expectTypeOf(request).toMatchTypeOf<AdvancedSearchRequest>();
    });
  });

  describe('SearchResult', () => {
    interface TestDocument extends BaseDocument {
      title: string;
      content: string;
      abstract: string;
      authors: string[];
      source: string;
      tags: string[];
      metadata: {
        title?: string;
        [key: string]: unknown;
      };
      processing_status: string;
      created_at: string;
      updated_at: string;
      embeddings: number[];
      evaluationScore: {
        actionability: number;
        aggregate: number;
        clarity: number;
        credibility: number;
        relevance: number;
      };
      evaluation_score: {
        actionability: number;
        aggregate: number;
        clarity: number;
        credibility: number;
        relevance: number;
      };
      id: string;
    }

    it('should validate SearchResult structure', () => {
      expectTypeOf<SearchResult<TestDocument>>().toMatchTypeOf<{
        hits: Array<{
          _id: string;
          _score: number;
          _source: TestDocument;
        }>;
        total: number;
        took: number;
        maxScore?: number;
        facets?: Record<string, Array<{ key: string; doc_count: number }>>;
        aggregations?: Record<string, any>;
      }>();
    });

    it('should validate search result with facets', () => {
      const result: SearchResult<TestDocument> = {
        hits: [
          {
            _id: '1',
            _score: 1.0,
            _source: {
                id: '1',
                title: 'Test Document',
                content: 'Test content',
                abstract: 'Test abstract',
                authors: ['Author 1'],
                source: 'test',
                tags: ['test'],
                metadata: {},
                processing_status: 'complete',
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
                embeddings: [0.1, 0.2, 0.3],
                evaluationScore: {
                    actionability: 0.8,
                    aggregate: 0.85,
                    clarity: 0.9,
                    credibility: 0.85,
                    relevance: 0.9,
                },
                evaluation_score: {
                    actionability: 0.8,
                    aggregate: 0.85,
                    clarity: 0.9,
                    credibility: 0.85,
                    relevance: 0.9,
                },
                type: ''
            },
          },
        ],
        total: 1,
        took: 5,
        maxScore: 1.0,
        facets: {
          category: [
            { key: 'tech', doc_count: 10 },
            { key: 'science', doc_count: 5 },
          ],
        },
      };

      expectTypeOf(result).toMatchTypeOf<SearchResult<TestDocument>>();
    });
  });

  describe('CachedSearchResult', () => {
    interface TestDocument extends BaseDocument {
      title: string;
      content: string;
      abstract: string;
      authors: string[];
      source: string;
      tags: string[];
      metadata: {
        title?: string;
        [key: string]: unknown;
      };
      processing_status: string;
      created_at: string;
      updated_at: string;
      embeddings: number[];
      evaluationScore: {
        actionability: number;
        aggregate: number;
        clarity: number;
        credibility: number;
        relevance: number;
      };
      evaluation_score: {
        actionability: number;
        aggregate: number;
        clarity: number;
        credibility: number;
        relevance: number;
      };
      id: string;
    }

    it('should validate CachedSearchResult structure', () => {
      expectTypeOf<CachedSearchResult<TestDocument>>().toMatchTypeOf<SearchResult<TestDocument> & {
        cached: boolean;
        cachedAt: string;
        ttl: number;
      }>();
    });

    it('should validate cached search result', () => {
      const result: CachedSearchResult<TestDocument> = {
        hits: [
          {
            _id: '1',
            _score: 1.0,
            _source: {
                id: '1',
                title: 'Test Document',
                content: 'Test content',
                abstract: 'Test abstract',
                authors: ['Author 1'],
                source: 'test',
                tags: ['test'],
                metadata: {},
                processing_status: 'complete',
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
                embeddings: [0.1, 0.2, 0.3],
                evaluationScore: {
                    actionability: 0.8,
                    aggregate: 0.85,
                    clarity: 0.9,
                    credibility: 0.85,
                    relevance: 0.9,
                },
                evaluation_score: {
                    actionability: 0.8,
                    aggregate: 0.85,
                    clarity: 0.9,
                    credibility: 0.85,
                    relevance: 0.9,
                },
                type: ''
            },
          },
        ],
        total: 1,
        took: 5,
        cached: true,
        cachedAt: new Date().toISOString(),
        ttl: 3600,
      };

      expectTypeOf(result).toMatchTypeOf<CachedSearchResult<TestDocument>>();
    });
  });
}); 
import type { estypes } from '@elastic/elasticsearch';

/**
 * 📋 Base Document Structure: Our Document Blueprint!
 *
 * This is like a template that tells Elasticsearch how to understand and store our documents.
 * Think of it as a form where each field has a specific type of information it can hold! 📝
 *
 * Field Types:
 * - 🔑 keyword: Exact match fields (like IDs)
 * - 📝 text: Searchable text fields
 * - 📅 date: Time and date information
 * - 🧮 dense_vector: Mathematical representation for AI
 * - 📊 object: Structured data fields
 * - 🔢 long: Number fields
 *
 * Special Features:
 * - 🔍 Smart text search with keywords
 * - 🤖 AI-ready vector fields
 * - ⭐ Score tracking for quality
 * - 📈 View and citation counting
 *
 * @type {Record<string, estypes.MappingProperty>}
 */
export const BaseMapping: Record<string, estypes.MappingProperty> = {
  id: {
    type: 'keyword',
  },
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
  abstract: {
    type: 'text',
    fields: {
      keyword: {
        type: 'keyword',
        ignore_above: 256,
      },
    },
  },
  authors: {
    type: 'text',
    fields: {
      keyword: {
        type: 'keyword',
        ignore_above: 256,
      },
    },
  },
  source: {
    type: 'text',
    fields: {
      keyword: {
        type: 'keyword',
        ignore_above: 256,
      },
    },
  },
  tags: {
    type: 'text',
    fields: {
      keyword: {
        type: 'keyword',
        ignore_above: 256,
      },
    },
  },
  metadata: {
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
  },
  processing_status: {
    type: 'keyword',
  },
  created_at: {
    type: 'date',
  },
  updated_at: {
    type: 'date',
  },
  embeddings: {
    type: 'dense_vector',
    dims: 3072,
    index: true,
    similarity: 'cosine',
    index_options: {
      type: 'int8_hnsw',
      m: 16,
      ef_construction: 100,
    },
  },
  evaluationScore: {
    type: 'object',
    properties: {
      actionability: { type: 'float' },
      aggregate: { type: 'float' },
      clarity: { type: 'float' },
      credibility: { type: 'float' },
      relevance: { type: 'float' },
    },
  },
  evaluation_score: {
    type: 'object',
    properties: {
      actionability: { type: 'float' },
      aggregate: { type: 'float' },
      clarity: { type: 'float' },
      credibility: { type: 'float' },
      relevance: { type: 'float' },
    },
  },
  yearPublished: { type: 'long' },
  year_published: { type: 'long' },
  citationCount: { type: 'long' },
  viewCount: { type: 'long' },
};

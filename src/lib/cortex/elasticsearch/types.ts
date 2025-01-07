import { estypes } from "@elastic/elasticsearch";
import { BaseMapping } from "./mappings";
export { BaseMapping };

/**
 * 📚 Document Types and Interfaces
 *
 * This file contains all the building blocks we use to work with documents.
 * Think of it as our dictionary that helps everyone speak the same language! 📖
 */

/**
 * 📄 Base Document: The Foundation of Every Document
 *
 * This is like a form that every document must fill out.
 * Each field has a specific purpose and type of information it can hold!
 *
 * Fields include:
 * - 🔑 Basic info (id, title, content)
 * - 👥 Attribution (authors, source)
 * - 🏷️ Organization (tags, metadata)
 * - 📊 AI features (embeddings)
 * - ⭐ Quality scores
 * - 📈 Analytics data
 *
 * @interface BaseDocument
 */
export interface BaseDocument {
  id: string;
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
  yearPublished?: number;
  year_published?: number;
  citationCount?: number;
  viewCount?: number;
  type: string;
}

/**
 * 📋 Document Metadata: Extra Information from Elasticsearch
 *
 * This is like the library card that keeps track of document details.
 *
 * @interface DocumentMetadata
 * @property {string} id - Unique identifier
 * @property {number} version - How many times it's been updated
 * @property {string} [created_at] - When it was first added
 * @property {string} [updated_at] - When it was last changed
 */
export interface DocumentMetadata {
  id: string;
  version: number;
  created_at?: string;
  updated_at?: string;
}

/**
 * ⏰ Processed Document: Document with Proper Dates
 *
 * Like the base document, but with dates that are easier to work with!
 *
 * @interface ProcessedDocument
 */
export interface ProcessedDocument
  extends Omit<BaseDocument, "created_at" | "updated_at"> {
  created_at: Date;
  updated_at: Date;
}

/**
 * 📝 Processed Document Metadata: Document Info with Proper Dates
 *
 * Like DocumentMetadata, but with dates in a more useful format!
 *
 * @interface ProcessedDocumentMetadata
 */
export interface ProcessedDocumentMetadata
  extends Omit<DocumentMetadata, "created_at" | "updated_at"> {
  created_at: Date;
  updated_at: Date;
}

/**
 * 🔍 Elasticsearch Query: How We Ask for Documents
 *
 * The special format Elasticsearch understands for searching.
 * Like speaking Elasticsearch's native language! 🗣️
 *
 * @type ElasticsearchClientQuery
 */
export type ElasticsearchClientQuery = BaseQuery;

export type ElasticsearchClientParams = {
  query: ElasticsearchClientQuery;
  size: number;
  from: number;
  aggregations?: Record<string, estypes.AggregationsAggregationContainer>;
  sort?: Array<Record<string, "asc" | "desc">>;
};

// Our internal types
type TermQuery = {
  term: {
    _id: string;
    "id.keyword": string;
  };
};

type MultiMatchQuery = {
  multi_match: {
    query: string;
    fields: string[];
    operator?: "AND" | "OR";
    fuzziness?: "AUTO" | "0" | "1" | "2";
  };
};

export type BaseQuery =
  | TermQuery
  | MultiMatchQuery
  | BoolQuery
  | ScriptScoreQuery
  | MatchAllQuery
  | ExistsQuery;

type MatchAllQuery = {
  match_all: object | Record<string, never>;
};

type ExistsQuery = {
  exists: {
    field: string;
  };
};

type BoolQuery = {
  bool: {
    should?: Array<BaseQuery>;
    must?: Array<BaseQuery>;
    must_not?: Array<BaseQuery>;
    filter?: Array<BaseQuery>;
  };
};

type ScriptScoreQuery = {
  script_score: {
    query: BaseQuery;
    script: {
      source: string;
      params: { query_vector: number[] };
    };
    min_score?: number;
  };
};

type _SearchQuery = BaseQuery | ScriptScoreQuery;

/**
 * Search parameters for Elasticsearch queries
 */
export interface SearchParams {
  query: BaseQuery;
  size?: number;
  from?: number;
  sort?: Array<Record<string, "asc" | "desc">>;
  aggregations?: Record<
    string,
    {
      terms: {
        field: string;
        size?: number;
      };
    }
  >;
}

/**
 * Search options for Elasticsearch queries
 */
export interface SearchOptions {
  index: string;
  query: ElasticsearchClientQuery;
  size: number;
  from: number;
  facets?: {
    fields: string[];
    size?: number;
  };
  aggregations?: Record<string, estypes.AggregationsAggregationContainer>;
  sort?: Array<Record<string, "asc" | "desc">>;
}

/**
 * Convert our query to Elasticsearch client format
 */
export function toElasticsearchQuery(
  query: SearchParams["query"]
): ElasticsearchClientQuery {
  if ("bool" in query) {
    return {
      bool: {
        should: query.bool.should?.map(toElasticsearchQuery),
        must: query.bool.must?.map(toElasticsearchQuery),
        must_not: query.bool.must_not?.map(toElasticsearchQuery),
        filter: query.bool.filter?.map(toElasticsearchQuery),
      },
    };
  }

  if ("script_score" in query) {
    return {
      script_score: {
        query: toElasticsearchQuery(query.script_score.query),
        script: query.script_score.script,
        min_score: query.script_score.min_score,
      },
    };
  }

  // For other query types (TermQuery, MultiMatchQuery, MatchAllQuery, ExistsQuery)
  // they are already in the correct format
  return query;
}

export interface SearchRequestBody {
  query: estypes.QueryDslQueryContainer;
  size?: number;
  from?: number;
  sort?: Array<Record<string, "asc" | "desc">>;
  _source?: string[] | boolean;
  highlight?: {
    fields: Record<
      string,
      {
        type?: string;
        number_of_fragments?: number;
        fragment_size?: number;
      }
    >;
    pre_tags?: string[];
    post_tags?: string[];
  };
}

export interface BulkOperationResponse {
  took: number;
  errors: boolean;
  items: Array<{
    [key: string]: {
      _index: string;
      _type: string;
      _id: string;
      _version?: number;
      status: number;
      error?: {
        type: string;
        reason: string;
      };
    };
  }>;
}

// Raw Elasticsearch response type
export interface ElasticsearchResponse<T> {
  body?: {
    hits: {
      hits: Array<{
        _index: string;
        _id: string;
        _score: number | null;
        _source: T;
      }>;
      total: {
        value: number;
        relation: 'eq' | 'gte';
      };
      max_score: number | null;
    };
    took: number;
    aggregations?: Record<string, any>;
  };
  hits?: {
    hits: Array<{
      _index: string;
      _id: string;
      _score: number | null;
      _source: T;
    }>;
    total: {
      value: number;
      relation: 'eq' | 'gte';
    };
    max_score: number | null;
  };
  took?: number;
  aggregations?: Record<string, any>;
}

// Our standardized response type
export interface SearchResponse<T> {
  hits: {
    hits: Array<{
      _source: T;
      _score: number;
      _id: string;
    }>;
    total: {
      value: number;
      relation: 'eq' | 'gte';
    };
    max_score: number;
  };
  took: number;
  aggregations?: Record<string, any>;
}

export function transformSearchResponse<T>(
  response: ElasticsearchResponse<T>
): SearchResponse<T> {
  // Handle both old and new response formats
  const hits = response.body?.hits || response.hits;
  const took = response.body?.took || response.took || 0;
  const aggregations = response.body?.aggregations || response.aggregations;

  if (!hits) {
    throw new Error('Invalid Elasticsearch response: missing hits property');
  }

  return {
    hits: {
      hits: hits.hits.map((hit) => ({
        _source: hit._source,
        _score: hit._score || 0,
        _id: hit._id,
      })),
      total: hits.total,
      max_score: hits.max_score || 0,
    },
    took,
    aggregations,
  };
}

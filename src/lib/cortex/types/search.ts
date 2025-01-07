import type { BaseDocument } from "@/lib/cortex/elasticsearch/types";
import type { estypes } from "@elastic/elasticsearch";

/**
 * 🔍 Search Types: Your Search Engine Blueprint!
 *
 * All the building blocks for finding exactly what you need.
 * Like having a magical magnifying glass that finds anything! 🔮
 */

/**
 * 📝 Text Query: Your Word Search Helper
 *
 * How to search using regular words and text.
 * Like telling your helper what words to look for! 📖
 *
 * @interface TextQuery
 * @property {string[]} fields - Where to look
 * @property {string} query - What to look for
 * @property {string} [fuzziness] - How exact to be
 * @property {string} [operator] - How to combine words
 */
export interface TextQuery {
  fields: string[];
  query: string;
  fuzziness?: "AUTO" | "0" | "1" | "2";
  operator?: "AND" | "OR";
}

/**
 * 🧮 Vector Query: Your AI Search Helper
 *
 * How to search using AI-generated patterns.
 * Like finding similar pictures by their colors! 🎨
 *
 * @interface VectorQuery
 * @property {string} field - Where to look
 * @property {number[]} vector - The pattern to match
 * @property {number} [k] - How many to find
 * @property {number} [minScore] - How similar they must be
 */
export interface VectorQuery {
  field: string;
  vector: number[];
  k?: number;
  minScore?: number;
}

/**
 * 🎯 Advanced Search: Your Super Search Powers
 *
 * All the fancy ways you can search for things.
 * Like having a Swiss Army knife for searching! 🔧
 *
 * @interface AdvancedSearchRequest
 * @property {string} index - Which collection to search
 * @property {string} searchType - How to search
 * @property {TextQuery} [textQuery] - Word search settings
 * @property {VectorQuery} [vectorQuery] - Pattern search settings
 * @property {Object} [boost] - How to mix search types
 */
export interface AdvancedSearchRequest {
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
  aggregations?: Record<string, estypes.AggregationsAggregationContainer>;
}

/**
 * 📦 Search Result: What We Found
 *
 * The treasures your search discovered!
 * Like opening a chest of found items! 🎁
 *
 * @interface SearchResult
 * @template T - Type of items we found
 * @property {Array} hits - The matching items
 * @property {number} total - How many we found
 * @property {number} took - How long it took
 */
export interface SearchResult<T extends BaseDocument> {
  hits: Array<{
    _id: string;
    _score: number;
    _source: T;
  }>;
  total: number;
  took: number;
  maxScore?: number;
  facets?: Record<string, Array<{ key: string; doc_count: number }>>;
  aggregations?: Record<string, estypes.AggregationsAggregate>;
}

/**
 * 💫 Cached Search Result: Quick Answers
 *
 * A search result we remembered for you!
 * Like having a magical memory that saves time! ⚡
 *
 * @interface CachedSearchResult
 * @template T - Type of items we remembered
 * @extends {SearchResult<T>}
 * @property {boolean} cached - If it's from memory
 * @property {string} cachedAt - When we remembered it
 * @property {number} ttl - How long to remember
 */
export interface CachedSearchResult<T extends BaseDocument>
  extends SearchResult<T> {
  cached: boolean;
  cachedAt: string;
  ttl: number;
}

import type { ElasticsearchService } from "@/lib/cortex/elasticsearch/services";
import type {
  BaseDocument,
  BaseQuery,
  ElasticsearchClientQuery,
  ProcessedDocumentMetadata,
  SearchResponse,
} from "@/lib/cortex/elasticsearch/types";
import type { RedisCacheService } from "@/lib/cortex/redis/services";
import type { VectorizationService } from "@/lib/cortex/services/vectorization";
import type { SearchResult } from "@/lib/cortex/types/search";
import { prisma } from "@/lib/shared/database/client";
import type { Logger } from "@/lib/shared/types";
import type { estypes } from "@elastic/elasticsearch";

/**
 * 🛠️ Configuration needed to set up the sync service
 *
 * Think of this as the instruction manual for building your sync service.
 * Each piece is important for making everything work together smoothly!
 *
 * @interface SyncServiceConfig
 * @property {Logger} logger - 📝 Keeps track of what's happening
 * @property {ElasticsearchService} elasticsearch - 🔍 Handles searching
 * @property {PostgresDataService} postgres - 💾 Stores data permanently
 * @property {RedisCacheService} redis - ⚡ Makes things fast with caching
 * @property {number} [searchCacheTTL] - ⏰ How long to keep search results (in seconds)
 * @property {VectorizationService} embeddingService - 🧮 Processes documents
 */
interface SyncServiceConfig {
  logger: Logger;
  elasticsearch: ElasticsearchService;
  redis: RedisCacheService;
  searchCacheTTL?: number;
  embeddingService: VectorizationService;
}

/**
 * 🔄 The Data Sync Service: Your Data's Best Friend!
 *
 * This service is like a super-organized librarian that keeps all our data stores
 * (Elasticsearch, Postgres, and Redis) in perfect harmony. It makes sure that when
 * you update data in one place, it gets updated everywhere else too!
 *
 * 🎯 What This Service Does:
 * - Keeps data consistent across different storage systems
 * - Handles smart caching to make things fast
 * - Manages document processing and vectorization
 * - Takes care of search operations
 *
 * 🔌 Connected Services:
 * - 🔍 Elasticsearch (for searching)
 * - 💾 Postgres (for permanent storage)
 * - ⚡ Redis (for quick access caching)
 * - 🧮 Vectorization (for document processing)
 *
 * @class DataSyncService
 */
export class DataSyncService {
  private readonly logger: Logger;
  private readonly es: ElasticsearchService;
  private redis: RedisCacheService;
  private readonly searchCacheTTL: number;
  private readonly embeddingService: VectorizationService;

  constructor(config: SyncServiceConfig) {
    this.logger = config.logger;
    this.es = config.elasticsearch;
    this.redis = config.redis;
    this.searchCacheTTL = config.searchCacheTTL || 300; // 5 minutes default
    this.embeddingService = config.embeddingService;
  }

  /**
   * 📝 Creates or updates a document everywhere it needs to be
   *
   * This is like hitting "save" but making sure your work is backed up in
   * multiple places - just to be extra safe!
   *
   * @param {Object} params - Everything we need to know about the document
   * @param {string} params.index - Which collection it belongs to
   * @param {string} params.id - The document's unique ID
   * @param {BaseDocument} params.document - The actual content
   * @param {string} params.tableName - Where to store it in Postgres
   *
   * @returns {Promise<ProcessedDocumentMetadata>} Info about the saved document
   * @throws Will let you know if something goes wrong during saving
   */
  async upsertDocument(params: {
    index: string;
    id: string;
    document: BaseDocument;
    tableName: string;
  }): Promise<ProcessedDocumentMetadata> {
    try {
      // Ensure index exists
      await this.createIndex(params.index);

      // Store in Elasticsearch
      const result = await this.es.upsertDocument(params.index, params.id, params.document);

      // Try to cache in Redis, but don't fail if Redis fails
      try {
        await this.redis.set(
          `doc:${params.index}:${params.id}`, 
          JSON.stringify(params.document), 
          "EX",
          this.searchCacheTTL
        );
      } catch (error) {
        this.logger.warn('Redis cache failure during document upsert', {
          error,
          id: params.id,
          index: params.index,
        });
      }

      // Invalidate any cached searches that might include this document
      await this.invalidateSearchCache(params.index);

      return result;
    } catch (error) {
      this.logger.error('Failed to upsert document', {
        index: params.index,
        id: params.id,
        error,
      });
      throw error;
    }
  }

  /**
   * 🏗️ Creates a new index if it doesn't exist
   *
   * Think of this as building a new shelf in our library - we need to set it up
   * before we can start putting books (documents) on it!
   *
   * @param {string} index - The name for our new index
   * @throws Will let you know if something goes wrong during creation
   */
  async createIndex(index: string): Promise<void> {
    try {
      const exists = await this.es.indexExists(index);
      if (!exists) {
        await this.es.createIndex(index, {
          body: {
            settings: {
              number_of_shards: 1,
              number_of_replicas: 1,
            },
            mappings: {
              dynamic: false,
              properties: {
                title: { type: "text" },
                content: { type: "text" },
                abstract: { type: "text" },
                embeddings: {
                  type: "dense_vector",
                  dims: 384,
                  index: true,
                  similarity: "cosine",
                },
                authors: { type: "keyword" },
                tags: { type: "keyword" },
                source: { type: "keyword" },
                metadata: {
                  properties: {
                    last_vectorized: { type: "date" },
                    updated: { type: "boolean" },
                    vector_dimensions: { type: "long" },
                    vector_model: { type: "text" },
                  },
                },
                processing_status: { type: "keyword" },
                created_at: { type: "date" },
                updated_at: { type: "date" },
              },
            },
          },
        });
        this.logger.debug("Created index", { index });
      }
    } catch (error) {
      this.logger.error("Failed to create index", {
        index,
        error: error instanceof Error ? error.message : "Unknown error",
      });
      throw error;
    }
  }

  /**
   * 🔍 Smart Search with Caching
   *
   * This is like having a really smart assistant who remembers recent searches
   * to give you answers faster!
   *
   * @template T - The type of document we're searching for
   * @param {Object} params - Your search requirements
   * @param {string} params.index - Where to look
   * @param {Record<string, unknown>} params.query - What to look for
   * @param {number} [params.size] - How many results you want (defaults to 10)
   * @param {number} [params.from] - Where to start from (for pagination)
   * @param {Record<string, 'asc' | 'desc'>[]} [params.sort] - How to order results
   * @param {Object} [params.facets] - Ways to group results
   * @param {boolean} [params.forceFresh] - Skip the cache and get fresh results
   *
   * @returns {Promise<SearchResult<T>>} Your search results, neatly organized
   */
  async search<T extends BaseDocument>(params: {
    index: string;
    query: Record<string, unknown>;
    size?: number;
    from?: number;
    sort?: Record<string, "asc" | "desc">[];
  }): Promise<SearchResponse<T>> {
    const cacheKey = this.buildSearchCacheKey(params);

    try {
      // Try to get from cache first
      const cachedResult = await this.redis.get(cacheKey);
      if (cachedResult) {
        this.logger.debug("Cache hit for search", { index: params.index });
        const parsed = JSON.parse(cachedResult as string);
        if (!parsed || !parsed.hits) {
          throw new Error('Invalid cached search response');
        }
        return parsed as SearchResponse<T>;
      }

      // Cache miss - search in Elasticsearch
      const searchResult = await this.es.search<T>(
        params.index,
        {
          query: params.query as BaseQuery,
          size: params.size,
          from: params.from,
          sort: params.sort,
        },
      );

      if (!searchResult || !searchResult.hits) {
        throw new Error('Invalid search response');
      }

      // Cache the result
      try {
        await this.redis.set(
          cacheKey,
          JSON.stringify(searchResult),
          "EX",
          this.searchCacheTTL
        );
      } catch (cacheError) {
        this.logger.warn("Failed to cache search results", {
          error: cacheError,
          index: params.index,
        });
        // Don't throw for cache errors
      }

      // Add max_score to match expected type
      return {
        ...searchResult,
        took: searchResult.took || 0,  // Default to 0 if undefined
        hits: {
          ...searchResult.hits,
          max_score: Math.max(...searchResult.hits.hits.map(hit => hit._score || 0)),
          total: {
            value: searchResult.hits.total.value,
            relation: searchResult.hits.total.relation as "eq" | "gte"
          }
        }
      };
    } catch (error) {
      this.logger.error("Search failed", {
        error,
        index: params.index,
        query: params.query,
      });
      throw error;
    }
  }

  /**
   * Invalidates all cached searches for an index
   */
  private async invalidateSearchCache(index: string): Promise<void> {
    const cachePattern = `search:${index}:*`;
    try {
      const keys = await this.redis.keys(cachePattern);
      if (keys.length > 0) {
        await this.redis.del(...keys);
        this.logger.debug("Invalidated search cache", {
          index,
          keyCount: keys.length,
        });
      }
    } catch (error) {
      this.logger.error("Failed to invalidate search cache", { index, error });
      // Don't throw - this is a non-critical operation
    }
  }

  /**
   * Builds a cache key for search results
   */
  private buildSearchCacheKey(params: {
    index: string;
    query: Record<string, unknown>;
    size?: number;
    from?: number;
    sort?: Record<string, "asc" | "desc">[];
  }): string {
    return `search:${params.index}:${JSON.stringify({
      query: params.query,
      size: params.size,
      from: params.from,
      sort: params.sort,
    })}`;
  }

  /**
   * Deletes a document from all data stores
   */
  async deleteDocument(params: {
    index: string;
    id: string;
    tableName?: string;
  }): Promise<void> {
    try {
      // Delete from Postgres first if tableName is provided
      if (params.tableName) {
        try {
          await (prisma[params.tableName as keyof typeof prisma] as any).delete({
            where: {
              id: params.id,
            },
          });
        } catch (dbError) {
          this.logger.error('Failed to delete from database', {
            error: dbError,
            id: params.id,
            tableName: params.tableName,
          });
          throw dbError;
        }
      }

      // Then delete from Elasticsearch
      try {
        await this.es.deleteDocument(params.index, params.id);
      } catch (esError) {
        this.logger.error('Failed to delete from Elasticsearch', {
          error: esError,
          id: params.id,
          index: params.index,
        });
        throw esError;
      }

      // Finally, remove from Redis cache
      try {
        await this.redis.del(`doc:${params.index}:${params.id}`);
        await this.invalidateSearchCache(params.index);
      } catch (cacheError) {
        this.logger.warn('Failed to clear cache during deletion', {
          error: cacheError,
          id: params.id,
          index: params.index,
        });
        // Don't throw for cache errors
      }
    } catch (error) {
      this.logger.error("Failed to delete document", {
        error,
        id: params.id,
        index: params.index,
        tableName: params.tableName,
      });
      throw error;
    }
  }

  /**
   * Vectorizes a document by generating and storing embeddings
   */
  async vectorizeDocument(
    doc: BaseDocument,
    config?: { apiKey?: string }
  ): Promise<BaseDocument & { embeddings: number[] }> {
    try {
      // Pass through the API key to the vectorization service
      return await this.embeddingService.vectorizeDocument(doc, {
        apiKey: config?.apiKey,
      });
    } catch (error) {
      this.logger.error("Document vectorization failed", {
        error,
        docId: doc.id,
        hasApiKey: !!config?.apiKey,
      });
      throw error;
    }
  }

  public async shutdown(): Promise<void> {
    try {
      if (this.redis?.disconnect) {
        await this.redis.disconnect();
      }
      await prisma.$disconnect();
    } catch (error: any) {
      this.logger.error("Error during shutdown", { error });
    }
  }

  // Add type guard
  private isValidDateString(value: string | undefined): value is string {
    return typeof value === "string" && !isNaN(Date.parse(value));
  }

  public updateRedisService(redis: RedisCacheService): void {
    this.redis = redis;
  }

  async ensureTableExists(tableName: string): Promise<void> {
    try {
      await prisma.$executeRaw`
        CREATE TABLE IF NOT EXISTS ${tableName} (
          id TEXT PRIMARY KEY,
          document JSONB NOT NULL,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        )
      `;
    } catch (error) {
      this.logger.error("Failed to create table", { error, tableName });
      throw error;
    }
  }
}

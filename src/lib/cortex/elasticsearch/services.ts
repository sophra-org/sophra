import { BaseService, BaseServiceConfig } from "@/lib/cortex/core/services";
import { CustomError } from "@/lib/cortex/utils/errors";
import type { Logger } from "@/lib/shared/types";
import { Client, estypes } from "@elastic/elasticsearch";
import {
  ElasticsearchResponse,
  transformSearchResponse,
  type BaseDocument,
  type ProcessedDocumentMetadata,
  type SearchParams,
  type SearchRequestBody,
} from "./types";

interface WeightDocument {
  weights: {
    title: number;
    content: number;
    description: number;
  };
  updatedAt?: string;
}

const ES_TIMEOUT = 15000; // 15 seconds timeout

/**
 * 📊 Metrics Service Interface: Our Performance Tracker!
 *
 * Helps us keep track of what's happening and when things go wrong.
 * Like having a fitness tracker for our search system! 💪
 *
 * @interface MetricsService
 */
export interface MetricsService {
  incrementIndexError?: (params: { error_type: string; index: string }) => void;
  incrementUpdateError?: (params: {
    error_type: string;
    index: string;
  }) => void;
  incrementDeleteError?: (params: {
    error_type: string;
    index: string;
  }) => void;
  incrementSearchError?: (params: {
    error_type: string;
    index: string;
    search_type: string;
  }) => void;
  incrementBulkError?: (params: { error_type: string; index: string }) => void;
}

/**
 * ⚙️ Elasticsearch Configuration
 *
 * The essential settings needed to connect to Elasticsearch.
 * Like having the right key and address to enter a building! 🔑
 *
 * @interface ElasticsearchConfig
 * @property {string} node - Where to find Elasticsearch
 * @property {Object} auth - Security credentials
 */
export interface ElasticsearchConfig {
  node: string;
  auth?: {
    apiKey: string;
  };
}

/**
 * 🔍 Search Options: Your Search Control Panel
 *
 * All the ways you can customize your search.
 * Like having knobs and buttons to fine-tune your results! 🎛️
 *
 * @interface SearchOptions
 * @property {string} index - Where to search
 * @property {Object} query - What to look for
 * @property {number} [size] - How many results to return
 * @property {number} [from] - Where to start from (for pagination)
 */
export interface SearchOptions {
  index: string;
  query: Record<string, unknown>;
  size?: number;
  from?: number;
  sort?: Array<Record<string, "asc" | "desc">>;
  facets?: {
    fields: string[];
    size?: number;
  };
  aggregations?: Record<string, estypes.AggregationsAggregationContainer>;
}

/**
 * 🔍 Search Response: What We Get Back
 *
 * The format of results from our searches.
 * Like getting an organized report of findings! 📋
 *
 * @interface SearchResponse
 * @template T - The type of document we're working with
 */
export interface SearchResponse<T> {
  hits: {
    total: {
      value: number;
      relation: string;
    };
    hits: Array<{
      _source: T;
      _score: number;
      _id: string;
    }>;
  };
  took?: number;
  aggregations?: Record<string, unknown>;
}

export interface ElasticsearchStats {
  indices: number;
  documents: number;
  size: string;
  health: "green" | "yellow" | "red";
}

export interface ElasticsearchHealth {
  operational: boolean;
  latency: number;
  errors: string[];
  metrics: {
    cluster: {
      status: string;
      name: string;
      nodes: number;
      dataNodes: number;
      activePrimaryShards: number;
      activeShards: number;
      relocatingShards: number;
      initializingShards: number;
      unassignedShards: number;
      pendingTasks: number;
      maxTaskWaitTime?: string;
    };
    indices: {
      total: number;
      healthy: number;
      unhealthy: number;
      size: string;
      documentCount: number;
    };
    performance: {
      queryLatency: number;
      indexingLatency: number;
      searchRate: number;
      indexingRate: number;
      cpuUsage?: number;
      memoryUsage?: string;
      diskUsage?: string;
    };
  };
}

export interface BulkResponse {
  errors: boolean;
  items: Array<{
    index?: {
      _index: string;
      _id: string;
      status: number;
      error?: {
        type: string;
        reason: string;
      };
    };
  }>;
}

interface IndicesStatsResponse {
  body: {
    _all: {
      total: {
        docs: {
          count: number;
        };
        store: {
          size_in_bytes: number;
        };
      };
    };
    indices: Record<string, unknown>;
  };
}

interface CatIndicesResponse {
  index: string;
  health: string;
  status: string;
  "docs.count": string;
  "docs.deleted": string;
  "store.size": string;
  primaryShards: string;
  replicaShards: string;
  [key: string]: string;
}

interface CatIndicesApiResponse {
  body: CatIndicesResponse[];
}

interface CreateIndexOptions {
  body: {
    settings?: {
      number_of_shards?: number;
      number_of_replicas?: number;
      analysis?: {
        analyzer?: {
          [key: string]: {
            type: string;
            stopwords?: string;
          };
        };
      };
    };
    mappings?: {
      dynamic?: boolean | "strict" | "runtime";
      properties?: Record<string, unknown>;
    };
  };
}

export interface VectorSearchOptions {
  size?: number;
  minScore?: number;
  textQuery?: string;
  fields?: string[];
  operator?: "AND" | "OR";
  fuzziness?: "AUTO" | "0" | "1" | "2";
}

export interface ElasticsearchServiceConfig extends BaseServiceConfig {
  metrics?: MetricsService;
  logger: Logger;
  config: {
    node: string;
    auth?: {
      apiKey: string;
    };
    ssl?: {
      rejectUnauthorized: boolean;
    };
    maxRetries?: number;
    requestTimeout?: number;
    sniffOnStart?: boolean;
  };
}

/**
 * 🔍 Elasticsearch Service: Your Search Power Tool!
 *
 * This service is like a super-smart librarian that can:
 * - 📚 Store and organize documents
 * - 🔍 Find exactly what you need
 * - 📊 Keep track of everything
 * - 🚀 Handle lots of requests efficiently
 *
 * Features:
 * - ⚡ Smart request queuing
 * - 📝 Detailed logging
 * - 📊 Performance tracking
 * - 🔒 Secure connections
 *
 * @class ElasticsearchService
 */
export class ElasticsearchService extends BaseService {
  protected readonly client: Client;
  protected readonly logger: Logger;
  protected readonly metrics?: MetricsService;
  public readonly requestQueue = {
    add: async <T>(fn: () => Promise<T>): Promise<T> => {
      try {
        return await fn();
      } catch (error) {
        this.logger.error("Request queue error", { error });
        throw error;
      }
    },
  };

  /**
   * 🎒 Sets Up Your Search Service
   *
   * Gets everything ready to handle your search needs.
   * Like preparing a librarian with all their tools! 📚
   *
   * @param {ElasticsearchConfig} config - Connection settings
   * @param {Logger} logger - Our note-taker
   * @param {MetricsService} [metrics] - Our performance tracker
   */
  constructor(
    config: ElasticsearchServiceConfig & {
      environment: "development" | "production" | "test";
    }
  ) {
    super({ ...config, logger: config.logger });

    this.logger = config.logger;
    this.metrics = config.metrics;

    const elasticConfig = {
      node: process.env.ELASTICSEARCH_URL,
      auth: process.env.SOPHRA_ES_API_KEY
        ? {
            apiKey: process.env.SOPHRA_ES_API_KEY as string,
          }
        : undefined,
      ssl: {
        rejectUnauthorized: false,
      },
      maxRetries: 3,
      requestTimeout: 30000,
      sniffOnStart: false,
    } as const;

    this.client = new Client(elasticConfig);
  }

  /**
   *📝 Creates or Updates a Document
   *
   * Stores a document in Elasticsearch, creating it if it's new
   * or updating it if it already exists.
   *
   * @param {string} index - Where to store it
   * @param {string} id - Document's unique ID
   * @param {BaseDocument} document - The document to store
   * @returns {Promise<ProcessedDocumentMetadata>} Info about the saved document
   */
  async upsertDocument(
    index: string,
    id: string,
    document: BaseDocument
  ): Promise<ProcessedDocumentMetadata> {
    try {
      const response = await this.client.index({
        index,
        id: id,
        body: {
          ...document,
          id: id,
        },
      });

      this.logger.debug("Document upserted", {
        index,
        id,
        response_id: response._id,
        version: response._version,
      });
      return {
        id: response._id,
        version: response._version,
        created_at: new Date(),
        updated_at: new Date(),
      };
    } catch (error) {
      if (this.metrics?.incrementIndexError) {
        this.metrics.incrementIndexError({
          error_type: error instanceof Error ? error.name : "unknown",
          index,
        });
      }
      this.logger.error("Failed to upsert document", {
        error,
        index,
        id,
        errorDetails: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  async getDocument<T extends BaseDocument>(
    index: string,
    id: string
  ): Promise<T | null> {
    try {
      this.logger.debug("Attempting ES document retrieval", {
        index,
        id,
        method: "GET",
        url: `${process.env.ELASTICSEARCH_URL}/${index}/_doc/${id}`,
      });

      const response = await this.client.get({
        index,
        id,
      });

      this.logger.debug("Raw ES response", {
        index,
        id,
        found: response.found,
        responseId: response._id,
        responseSource: response._source,
        responseFields: response._source ? Object.keys(response._source) : [],
      });

      if (!response.found || !response._source) {
        this.logger.warn("Document not found in response", {
          index,
          id,
          response: {
            found: response.found,
            hasSource: !!response._source,
          },
        });
        return null;
      }

      const source = response._source as Record<string, any>;
      const document = {
        ...source,
        id: response._id,
        title: source.title || "",
        content: source.content || "",
        abstract: source.abstract || "",
        authors: Array.isArray(source.authors) ? source.authors : [],
        tags: Array.isArray(source.tags) ? source.tags : [],
        source: source.source || "",
        metadata: source.metadata || {},
        created_at: source.created_at || new Date().toISOString(),
        updated_at: source.updated_at || new Date().toISOString(),
        processing_status: source.processing_status || "pending",
      } as T;

      this.logger.debug("Transformed document", {
        index,
        id,
        documentFields: Object.keys(document as Record<string, unknown>),
        hasRequiredFields: {
          title: !!source.title,
          content: !!source.content,
          abstract: !!source.abstract,
        },
      });

      return document;
    } catch (error) {
      const statusCode = (error as { statusCode?: number }).statusCode;

      if (statusCode === 404) {
        this.logger.debug("Document not found in ES (404)", {
          index,
          id,
          error: error instanceof Error ? error.message : String(error),
        });
        return null;
      }

      this.logger.error("Error retrieving document", {
        index,
        id,
        errorType: error instanceof Error ? error.name : typeof error,
        errorMessage: error instanceof Error ? error.message : String(error),
        statusCode,
      });

      throw error;
    }
  }

  async updateDocument(
    index: string,
    id: string,
    document: Partial<BaseDocument>
  ): Promise<void> {
    try {
      await this.client.index({
        index,
        id,
        body: {
          ...document,
          updated_at: new Date().toISOString(),
        },
      });

      this.logger.debug("Document updated", {
        index,
        id,
        updatedFields: Object.keys(document),
      });
    } catch (error) {
      this.logger.error("Failed to update document", {
        error,
        index,
        id,
        errorType: error instanceof Error ? error.name : typeof error,
        errorMessage: error instanceof Error ? error.message : String(error),
        document: JSON.stringify(document),
      });
      throw error;
    }
  }

  async deleteDocument(index: string, id: string): Promise<void> {
    try {
      await this.client.delete({
        index,
        id,
      });
    } catch (error) {
      if (this.metrics?.incrementDeleteError) {
        this.metrics.incrementDeleteError({
          error_type: error instanceof Error ? error.name : "unknown",
          index,
        });
      }
      throw error;
    }
  }

  async search<T extends BaseDocument>(
    index: string,
    params: SearchParams,
    options?: SearchOptions
  ): Promise<SearchResponse<T>> {
    return this.requestQueue.add(async () => {
      try {
        const response = await this.client.search<T>({
          index,
          body: {
            query: options?.query || params.query,
            size: options?.size || params.size,
            from: options?.from || params.from,
            sort: options?.sort || params.sort,
            aggregations: options?.aggregations || params.aggregations,
          },
        });

        return transformSearchResponse(
          response as unknown as ElasticsearchResponse<T>
        );
      } catch (error) {
        this.logger.error("Search failed", { error });
        throw error;
      }
    });
  }

  async bulkIndex<T extends BaseDocument>(
    index: string,
    documents: T[]
  ): Promise<void> {
    if (documents.length === 0) {
      return;
    }

    const operations = documents.flatMap((doc) => [
      { index: { _index: index } },
      doc,
    ]);
    try {
      const response = await this.client.bulk({
        body: operations,
      });

      if (response.errors) {
        throw new Error("Bulk operation failed");
      }
    } catch (error) {
      if (this.metrics?.incrementBulkError) {
        this.metrics.incrementBulkError({
          error_type: error instanceof Error ? error.name : "unknown",
          index,
        });
      }
      throw error;
    }
  }

  async health(): Promise<boolean> {
    try {
      const response = await this.client.cluster.health();
      return response.status !== "red";
    } catch (error) {
      return false;
    }
  }

  async ping(): Promise<ElasticsearchHealth> {
    try {
      const startTime = Date.now();
      await this.client.ping();
      return {
        operational: true,
        latency: Date.now() - startTime,
        errors: [],
        metrics: {
          cluster: {
            status: "",
            name: "",
            nodes: 0,
            dataNodes: 0,
            activePrimaryShards: 0,
            activeShards: 0,
            relocatingShards: 0,
            initializingShards: 0,
            unassignedShards: 0,
            pendingTasks: 0,
          },
          indices: {
            total: 0,
            healthy: 0,
            unhealthy: 0,
            size: "0B",
            documentCount: 0,
          },
          performance: {
            queryLatency: 0,
            indexingLatency: 0,
            searchRate: 0,
            indexingRate: 0,
            cpuUsage: 0,
            memoryUsage: "0B",
            diskUsage: "0B",
          },
        },
      };
    } catch (error) {
      return {
        operational: false,
        latency: 0,
        errors: [error instanceof Error ? error.message : "Unknown error"],
        metrics: {
          cluster: {
            status: "",
            name: "",
            nodes: 0,
            dataNodes: 0,
            activePrimaryShards: 0,
            activeShards: 0,
            relocatingShards: 0,
            initializingShards: 0,
            unassignedShards: 0,
            pendingTasks: 0,
          },
          indices: {
            total: 0,
            healthy: 0,
            unhealthy: 0,
            size: "0B",
            documentCount: 0,
          },
          performance: {
            queryLatency: 0,
            indexingLatency: 0,
            searchRate: 0,
            indexingRate: 0,
            cpuUsage: 0,
            memoryUsage: "0B",
            diskUsage: "0B",
          },
        },
      };
    }
  }

  async indexExists(index: string): Promise<boolean> {
    try {
      console.log(`Checking if index exists: ${index}`);
      const response = await this.client.indices.exists({ index });

      // Type guard for response object
      if (
        response &&
        typeof response === "object" &&
        "statusCode" in response
      ) {
        const exists = (response as { statusCode: number }).statusCode === 200;
        console.log(
          `Index ${index} exists check result (from statusCode):`,
          exists
        );
        return exists;
      }

      // Handle boolean response
      console.log(`Index ${index} exists check result (direct):`, response);
      return Boolean(response);
    } catch (error) {
      console.error(`Error checking if index exists: ${index}`, error);
      return false;
    }
  }

  async createIndex(index: string, options: CreateIndexOptions): Promise<void> {
    try {
      console.log(`Attempting to create index: ${index}`);
      const exists = await this.indexExists(index);

      if (exists) {
        console.log(`Index ${index} already exists, throwing error`);
        throw new Error(`Index ${index} already exists`);
      }

      // Ensure options.body exists
      const createOptions = {
        index,
        body: options.body || options,
      };

      console.log(`Creating index ${index} with options:`, createOptions);
      await this.client.indices.create(createOptions);

      console.log(`Successfully created index: ${index}`);
    } catch (error) {
      console.error(`Failed to create index ${index}:`, error);
      throw error;
    }
  }

  async deleteIndex(index: string): Promise<void> {
    try {
      const exists = await this.client.indices.exists({ index });
      if (!exists) {
        throw new Error(`Index ${index} does not exist`);
      }

      await this.client.indices.delete({ index });
    } catch (error) {
      this.logger.error("Failed to delete index", { error, index });
      throw error;
    }
  }

  async documentExists(index: string, id: string): Promise<boolean> {
    try {
      return await this.client.exists({
        index,
        id,
      });
    } catch (error) {
      return false;
    }
  }

  async getStats(): Promise<{
    indices: number;
    documents: number;
    size: string;
    health: "green" | "yellow" | "red";
  }> {
    try {
      const [stats, health] = await Promise.all([
        this.client.indices.stats({
          index: "_all",
        }),
        this.client.cluster.health(),
      ]);

      const indices = Object.keys(stats.indices || {}).length;
      const totalDocs = stats._all?.total?.docs?.count || 0;
      const totalSize = stats._all?.total?.store?.size_in_bytes || 0;
      const clusterHealth = health.status;

      if (
        !clusterHealth ||
        !["green", "yellow", "red"].includes(clusterHealth)
      ) {
        throw new Error("Invalid cluster health status");
      }

      return {
        indices,
        documents: totalDocs,
        size: this.formatBytes(totalSize),
        health: clusterHealth as "green" | "yellow" | "red",
      };
    } catch (error) {
      this.logger.error("Failed to get Elasticsearch stats", { error });
      return {
        indices: 0,
        documents: 0,
        size: "0 B",
        health: "red",
      };
    }
  }

  async testService(): Promise<ElasticsearchHealth> {
    const start = Date.now();
    const errors: string[] = [];

    try {
      const pingPromise = this.client.ping();
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error("Ping timeout")), 5000);
      });

      await Promise.race([pingPromise, timeoutPromise]);

      const [health, stats, nodesStats, indicesStats] = await Promise.all([
        this.client.cluster.health(),
        this.client.cluster.health(),
        this.client.nodes.stats({
          metric: ["indices", "os", "process", "jvm", "thread_pool"],
        }),
        this.client.indices.stats({
          index: "_all",
        }),
      ]);

      const metrics = {
        cluster: {
          status: health.status ?? "unknown",
          name: health.cluster_name ?? "unknown",
          nodes: health.number_of_nodes ?? 0,
          dataNodes: health.number_of_data_nodes ?? 0,
          activePrimaryShards: health.active_primary_shards ?? 0,
          activeShards: health.active_shards ?? 0,
          relocatingShards: health.relocating_shards ?? 0,
          initializingShards: health.initializing_shards ?? 0,
          unassignedShards: health.unassigned_shards ?? 0,
          pendingTasks: health.number_of_pending_tasks ?? 0,
          maxTaskWaitTime: `${health.task_max_waiting_in_queue_millis ?? 0}ms`,
        },
        indices: {
          total: Object.keys(indicesStats.indices ?? {}).length,
          healthy: this.getHealthyIndicesCount(indicesStats),
          unhealthy: this.getUnhealthyIndicesCount(indicesStats),
          size: this.formatBytes(
            indicesStats._all?.total?.store?.size_in_bytes ?? 0
          ),
          documentCount: indicesStats._all?.total?.docs?.count ?? 0,
        },
        performance: this.calculatePerformanceMetrics(nodesStats),
      };

      return {
        operational: true,
        latency: Date.now() - start,
        errors,
        metrics: metrics as {
          cluster: {
            status: string;
            name: string;
            nodes: number;
            dataNodes: number;
            activePrimaryShards: number;
            activeShards: number;
            relocatingShards: number;
            initializingShards: number;
            unassignedShards: number;
            pendingTasks: number;
            maxTaskWaitTime?: string;
          };
          indices: {
            total: number;
            healthy: number;
            unhealthy: number;
            size: string;
            documentCount: number;
          };
          performance: {
            queryLatency: number;
            indexingLatency: number;
            searchRate: number;
            indexingRate: number;
          };
        },
      };
    } catch (error) {
      const err = error instanceof Error ? error : new Error("Unknown error");
      this.logger.error("ES test failed", {
        error: err.message,
        stack: err.stack,
        name: err.name,
      });

      errors.push(err.message);
      return {
        operational: false,
        latency: Date.now() - start,
        errors,
        metrics: {
          cluster: {
            status: "red",
            name: "unknown",
            nodes: 0,
            dataNodes: 0,
            activePrimaryShards: 0,
            activeShards: 0,
            relocatingShards: 0,
            initializingShards: 0,
            unassignedShards: 0,
            pendingTasks: 0,
          },
          indices: {
            total: 0,
            healthy: 0,
            unhealthy: 0,
            size: "0b",
            documentCount: 0,
          },
          performance: {
            queryLatency: 0,
            indexingLatency: 0,
            searchRate: 0,
            indexingRate: 0,
          },
        },
      };
    }
  }

  private calculatePerformanceMetrics(
    nodesStats: estypes.NodesStatsResponse
  ): PerformanceMetrics {
    const nodes = nodesStats.nodes || {};
    const nodeValues = Object.values(nodes);

    if (!nodeValues.length) {
      return {
        queryLatency: 0,
        indexingLatency: 0,
        searchRate: 0,
        indexingRate: 0,
        cpuUsage: 0,
        memoryUsage: "0B",
        diskUsage: "0B",
      };
    }

    const aggregatedStats = nodeValues.reduce<PerformanceMetrics>(
      (acc, node) => {
        const threadPool = node.thread_pool || {};
        const os = node.os || {};
        const jvm = node.jvm || {};

        return {
          queryLatency: acc.queryLatency + (threadPool.search?.active || 0),
          indexingLatency:
            acc.indexingLatency + (threadPool.write?.active || 0),
          searchRate: acc.searchRate + (threadPool.search?.completed || 0),
          indexingRate: acc.indexingRate + (threadPool.write?.completed || 0),
          cpuUsage: acc.cpuUsage + (os.cpu?.percent || 0),
          memoryUsage:
            (acc.memoryUsage as number) + (jvm.mem?.heap_used_in_bytes || 0),
          diskUsage:
            (acc.diskUsage as number) + (os.cgroup?.cpuacct?.usage_nanos || 0),
        };
      },
      {
        queryLatency: 0,
        indexingLatency: 0,
        searchRate: 0,
        indexingRate: 0,
        cpuUsage: 0,
        memoryUsage: 0,
        diskUsage: 0,
      }
    );

    return {
      ...aggregatedStats,
      memoryUsage: this.formatBytes(aggregatedStats.memoryUsage as number),
      diskUsage: this.formatBytes(aggregatedStats.diskUsage as number),
    };
  }

  private formatBytes(bytes: number): string {
    if (bytes === 0) return "0b";
    const k = 1024;
    const sizes = ["b", "kb", "mb", "gb", "tb"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))}${sizes[i]}`;
  }

  private getHealthyIndicesCount(stats: any): number {
    return Object.values(stats.indices).filter(
      (index: any) =>
        !index.health || ["green", "yellow"].includes(index.health)
    ).length;
  }

  private getUnhealthyIndicesCount(stats: any): number {
    return Object.values(stats.indices).filter(
      (index: any) => index.health === "red"
    ).length;
  }

  async healthCheck(): Promise<boolean> {
    try {
      this.logger.info("Testing ES connection", {
        url: process.env.ELASTICSEARCH_URL,
        hasApiKey: !!process.env.SOPHRA_ES_API_KEY,
        keyLength: process.env.SOPHRA_ES_API_KEY?.length,
      });

      this.logger.info("Attempting ping...");
      await this.client.ping();
      this.logger.info("Ping successful, checking cluster health...");

      const health = await this.client.cluster.health();
      this.logger.info("ES connection successful", {
        status: health.status,
        clusterName: health.cluster_name,
        numberOfNodes: health.number_of_nodes,
      });

      return true;
    } catch (error) {
      const err = error instanceof Error ? error : new Error("Unknown error");
      this.logger.error("ES test failed", {
        error: err.message,
        stack: err.stack,
        name: err.name,
        type: err.constructor.name,
      });

      return false;
    }
  }

  async listIndices(): Promise<
    Array<{
      name: string;
      health: string;
      status: string;
      docsCount: number;
      docsDeleted: number;
      storeSize: string;
      primaryShards: number;
      replicaShards: number;
    }>
  > {
    try {
      const response = (await this.client.cat.indices({
        format: "json",
      })) as unknown as CatIndicesApiResponse;

      if (!response?.body) {
        this.logger.error("Invalid response from cat indices", { response });
        return [];
      }

      const indices = response.body;
      if (!Array.isArray(indices)) {
        this.logger.error("Invalid indices response format", { indices });
        return [];
      }

      return indices.map((index: CatIndicesResponse) => ({
        name: index.index,
        health: index.health || "unknown",
        status: index.status || "unknown",
        docsCount: parseInt(index["docs.count"], 10) || 0,
        docsDeleted: parseInt(index["docs.deleted"], 10) || 0,
        storeSize: this.formatBytes(parseInt(index["store.size"], 10) || 0),
        primaryShards: parseInt(index.pri, 10) || 1,
        replicaShards: parseInt(index.rep, 10) || 1,
      }));
    } catch (error) {
      this.logger.error("Failed to list indices", { error });
      return [];
    }
  }

  private isNotFoundError(error: unknown): boolean {
    return (
      error instanceof Error &&
      "meta" in error &&
      typeof error.meta === "object" &&
      error.meta !== null &&
      "statusCode" in error.meta &&
      error.meta.statusCode === 404
    );
  }

  async getSearchWeights(searchId: string): Promise<Record<string, number>> {
    const defaultWeights = {
      title: 1.0,
      content: 1.0,
      description: 1.0,
    };

    try {
      const response = await this.client.get<WeightDocument>({
        index: "search_weights",
        id: searchId,
      });

      if (!response.found || !response._source?.weights) {
        return defaultWeights;
      }

      return response._source.weights;
    } catch (error) {
      this.logger.error("Failed to get search weights", { error, searchId });
      return defaultWeights;
    }
  }

  async updateWeights(
    searchId: string,
    weights: Record<string, number>
  ): Promise<void> {
    try {
      await this.client.index({
        index: "search_weights",
        id: searchId,
        body: {
          weights,
          updatedAt: new Date().toISOString(),
        },
      });

      this.logger.info("Search weights updated", { searchId, weights });
    } catch (error) {
      this.logger.error("Failed to update search weights", {
        error,
        searchId,
        weights,
      });
      throw error;
    }
  }

  async vectorSearch<T extends BaseDocument>(
    index: string,
    queryVector: number[],
    options: VectorSearchOptions = {}
  ): Promise<SearchResult<T>> {
    const {
      size = 10,
      minScore = 0.7,
      textQuery,
      fields = ["title", "content"],
      operator = "OR",
      fuzziness = "AUTO",
    } = options;

    try {
      const searchBody: SearchRequestBody = {
        query: {
          bool: {
            should: [
              // Text search if provided
              ...(textQuery
                ? [
                    {
                      multi_match: {
                        query: textQuery,
                        fields,
                        operator,
                        fuzziness,
                      },
                    },
                  ]
                : []),
              // Vector search
              {
                script_score: {
                  query: {
                    exists: {
                      field: "embeddings", // Check if field exists
                    },
                  },
                  script: {
                    source:
                      "cosineSimilarity(params.query_vector, 'embeddings')",
                    params: {
                      query_vector: queryVector,
                    },
                  },
                },
              },
            ],
          },
        },
        size,
      };

      const response = await this.client.search({
        index,
        body: searchBody,
      });

      return {
        hits: response.hits.hits.map((hit) => ({
          _id: hit._id ?? "",
          _score: hit._score || 0,
          _source: hit._source as T,
        })),
        total:
          typeof response.hits.total === "number"
            ? response.hits.total
            : (response.hits.total?.value ?? 0),
        took: response.took ?? 0,
      };
    } catch (error) {
      this.logger.error("Vector search failed", { error });
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    try {
      await (this.client as any).close(); // Cast to any since close() exists but type is incorrect
      this.logger.info("Elasticsearch connection closed");
    } catch (error) {
      const err = error instanceof Error ? error : new Error("Unknown error");
      this.logger.error("Error disconnecting from Elasticsearch", {
        error: err.message,
        stack: err.stack,
      });
    }
  }

  async initialize(): Promise<void> {
    try {
      // Verify credentials and connection
      const pingResult = await this.client.ping({});

      if (!pingResult) {
        throw new Error("Invalid ping response from Elasticsearch");
      }

      this.logger.info("Elasticsearch connection successful", {
        node: process.env.ELASTICSEARCH_URL,
        hasApiKey: !!process.env.SOPHRA_ES_API_KEY,
      });
    } catch (error) {
      const err = error instanceof Error ? error : new Error("Unknown error");
      this.logger.error("Elasticsearch initialization failed", {
        error: err.message,
        type: err.name,
        stack: err.stack,
      });
      throw new CustomError("ES_INIT_FAILED", err);
    }
  }

  async refreshIndex(index: string): Promise<void> {
    await this.client.indices.refresh({ index });
  }

  async putMapping(
    index: string,
    mapping: Record<string, unknown>
  ): Promise<void> {
    await this.client.indices.putMapping({
      index,
      body: mapping,
    });
  }

  async getMapping(index: string): Promise<Record<string, unknown>> {
    const response = await this.client.indices.getMapping({ index });
    return response as Record<string, unknown>;
  }

  async putSettings(
    index: string,
    settings: Record<string, unknown>
  ): Promise<void> {
    await this.client.indices.putSettings({
      index,
      body: settings,
    });
  }

  async getSettings(index: string): Promise<Record<string, unknown>> {
    const response = await this.client.indices.getSettings({ index });
    return response[index]?.settings as Record<string, unknown>;
  }

  async count(index: string): Promise<number> {
    const response = await this.client.count({ index });
    return response.count;
  }
  async scroll<T>(scrollId: string): Promise<T[]> {
    const response = await this.client.scroll({ scroll_id: scrollId });
    return response.hits.hits.map((hit) => {
      if (!hit._source) {
        throw new Error("Search hit missing _source");
      }
      return hit._source as T;
    });
  }

  async clearScroll(scrollId: string): Promise<void> {
    await this.client.clearScroll({ scroll_id: scrollId });
  }

  async bulk(operations: any[]): Promise<void> {
    await this.client.bulk({ body: operations });
  }

  async reindex(source: string, dest: string): Promise<void> {
    await this.client.reindex({
      body: {
        source: { index: source },
        dest: { index: dest },
      },
    });
  }

  async aliases(p0: {
    body: { actions: { add: { index: string; alias: string } }[] };
  }): Promise<Record<string, string[]>> {
    const response = await this.client.cat.aliases({ format: "json" });
    // Transform the response into Record<string, string[]> format
    const aliasMap: Record<string, string[]> = {};
    for (const alias of response) {
      if (alias.alias) {
        if (!aliasMap[alias.alias]) {
          aliasMap[alias.alias] = [];
        }
        aliasMap[alias.alias].push(alias.index!);
      }
    }
    return aliasMap;
  }

  async analyze(index: string, text: string): Promise<any> {
    const response = await this.client.indices.analyze({
      index,
      body: { text },
    });
    return response;
  }

  async partialUpdateDocument(
    index: string,
    id: string,
    update: {
      script?: {
        source: string;
        params: Record<string, any>;
      };
      doc?: Record<string, any>;
    }
  ): Promise<void> {
    try {
      const response = await fetch(
        `${process.env.ELASTICSEARCH_URL}/${index}/_update/${id}`,
        {
          method: "POST",
          headers: {
            Authorization: `ApiKey ${process.env.SOPHRA_ES_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(
            update.script ? { script: update.script } : { doc: update.doc }
          ),
        }
      );

      const result = await response.json();

      this.logger.debug("Document partially updated", {
        index,
        id,
        updateType: update.script ? "script" : "doc",
        result: result.result,
      });
    } catch (error) {
      this.logger.error("Failed to partially update document", {
        error,
        index,
        id,
      });
      throw error;
    }
  }

  async preprocessQuery(query: string): Promise<string> {
    // Normalize whitespace and convert to lowercase
    const normalized = query.trim().toLowerCase().replace(/\s+/g, " ");

    // Preserve special characters and symbols
    const specialChars = ["c++", "c#", ".net", "@", "/"];
    for (const char of specialChars) {
      if (query.toLowerCase().includes(char.toLowerCase())) {
        return query.trim();
      }
    }

    return normalized;
  }

  async analyzeQuery(query: string): Promise<QueryAnalysis> {
    const terms = query.toLowerCase().split(" ");

    // Intent detection
    const intentPatterns = {
      instructional: ["how", "guide", "tutorial"],
      error: ["error", "bug", "fix", "issue"],
      best_practices: ["best", "practice", "recommended"],
      comparison: ["vs", "versus", "compare"],
    };

    let detectedIntent: QueryAnalysis["intent"] = "instructional";
    for (const [intent, patterns] of Object.entries(intentPatterns)) {
      if (patterns.some((pattern) => terms.includes(pattern))) {
        detectedIntent = intent as QueryAnalysis["intent"];
        break;
      }
    }

    // Extract key terms and context
    const keyTerms = terms.filter((term) => term.length > 2);
    const context = terms.includes("production") ? "production" : undefined;

    return {
      intent: detectedIntent,
      terms: keyTerms,
      context,
    };
  }

  async expandQuery(query: string): Promise<ExpandedQuery> {
    const synonyms = {
      js: ["javascript", "js"],
      aws: ["amazon web services", "aws"],
      k8s: ["kubernetes", "k8s"],
      ml: ["machine learning", "ml"],
    };

    const terms = new Set<string>();
    const queryTerms = query.toLowerCase().split(" ");

    for (const term of queryTerms) {
      terms.add(term);
      if (Object.prototype.hasOwnProperty.call(synonyms, term)) {
        synonyms[term as keyof typeof synonyms].forEach((synonym) =>
          terms.add(synonym)
        );
      }
    }

    return {
      terms: Array.from(terms),
    };
  }
}

interface SearchHit<T> {
  _index: string;
  _id: string;
  _score: number;
  _source: T;
}

interface IndicesStatsResponseBody {
  _all: {
    total: {
      docs: {
        count: number;
      };
      store: {
        size_in_bytes: number;
      };
    };
  };
  indices: Record<string, unknown>;
}

type SearchResult<T> = {
  hits: Array<{
    _id: string;
    _score: number;
    _source: T;
  }>;
  total: number;
  took: number;
};

interface PerformanceMetrics {
  queryLatency: number;
  indexingLatency: number;
  searchRate: number;
  indexingRate: number;
  cpuUsage: number;
  memoryUsage: string | number;
  diskUsage: string | number;
}

interface QueryAnalysis {
  intent: "instructional" | "error" | "best_practices" | "comparison";
  terms: string[];
  context?: string;
}

interface ExpandedQuery {
  terms: string[];
}

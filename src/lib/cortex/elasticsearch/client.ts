/**
 * 📚 Elasticsearch Client: Your Data Librarian!
 *
 * Manages your connection to Elasticsearch.
 * Like having a friendly librarian who helps organize and find your books! 📖
 *
 * Features:
 * - 🔌 Connection management
 * - 📝 Index creation and deletion
 * - 🏥 Health checks
 * - 🔒 Secure authentication
 */

import { CustomError } from "@/lib/cortex/utils/errors";
import type { Logger } from "@/lib/shared/types";
import { Client } from "@elastic/elasticsearch";

/**
 * 📚 Elastic Client: Your Library Manager
 *
 * Handles all communication with Elasticsearch.
 * Like having a master librarian who knows every book's location! 🗺️
 *
 * @class ElasticClient
 */
export class ElasticClient {
  private readonly client: Client;
  private readonly logger: Logger;

  /**
   * 🎬 Create New Client
   *
   * Sets up your connection to Elasticsearch.
   * Like opening up the library for the day! 🌅
   *
   * @throws {CustomError} If connection setup fails
   */
  constructor(logger: Logger) {
    this.logger = logger;
    try {
      const config: Record<string, any> = {
        node: process.env.ELASTICSEARCH_URL || "http://localhost:9200",
      };

      // Only add auth if API key exists
      if (process.env.ELASTICSEARCH_API_KEY) {
        config.auth = {
          apiKey: process.env.ELASTICSEARCH_API_KEY,
        };
      }

      this.client = new Client(config);
    } catch (error) {
      this.logger.error("Failed to initialize Elasticsearch client", { error });
      throw error;
    }
  }

  /**
   * 🏥 Check Connection Health
   *
   * Makes sure we can talk to Elasticsearch.
   * Like checking if the library is open! 🚪
   *
   * @returns {Promise<boolean>} true if healthy, false if there's a problem
   */
  async ping(): Promise<boolean> {
    try {
      await this.client.ping();
      this.logger.debug("Elasticsearch ping successful");
      return true;
    } catch (error) {
      const err = error as Error & {
        meta?: { statusCode?: number; headers?: unknown; body?: unknown };
      };
      this.logger.error("Elasticsearch ping failed", {
        error: {
          message: err.message,
          name: err.name,
          statusCode: err.meta?.statusCode,
          headers: err.meta?.headers,
          body: err.meta?.body,
        },
      });
      return false;
    }
  }

  /**
   * 📚 Create New Index
   *
   * Creates a new place to store documents.
   * Like adding a new section to the library! 📚
   *
   * @param {string} index - What to call the new section
   * @param {Record<string, unknown>} mappings - How to organize it
   * @throws {CustomError} If creation fails
   */
  async createIndex(
    index: string,
    mappings: Record<string, unknown>
  ): Promise<void> {
    try {
      this.logger.debug(`Checking if index exists: ${index}`);
      const exists = await this.client.indices.exists({ index });
      this.logger.debug(`Index ${index} exists: ${exists}`);

      if (!exists) {
        this.logger.debug(`Creating index: ${index}`, { mappings });
        await this.client.indices.create({
          index,
          body: {
            mappings,
          },
        });
        this.logger.info(`Created index: ${index}`);
      } else {
        this.logger.debug(`Index ${index} already exists`);
      }
    } catch (error) {
      const err = error as Error & {
        meta?: { statusCode?: number; headers?: unknown; body?: unknown };
      };
      this.logger.error(`Failed to create index: ${index}`, {
        error: {
          message: err.message,
          name: err.name,
          statusCode: err.meta?.statusCode,
          headers: err.meta?.headers,
          body: err.meta?.body,
        },
      });
      throw new CustomError("ELASTIC_CREATE_INDEX_FAILED", error as Error);
    }
  }

  /**
   * 🗑️ Delete Index
   *
   * Removes an index and all its documents.
   * Like carefully removing a section from the library! 📚
   *
   * @param {string} index - Which section to remove
   * @throws {CustomError} If deletion fails
   */
  async deleteIndex(index: string): Promise<void> {
    try {
      this.logger.debug(`Checking if index exists: ${index}`);
      const exists = await this.client.indices.exists({ index });
      this.logger.debug(`Index ${index} exists: ${exists}`);

      if (exists) {
        await this.client.indices.delete({ index });
        this.logger.info(`Deleted index: ${index}`);
      } else {
        this.logger.debug(`Index ${index} does not exist`);
      }
    } catch (error) {
      const err = error as Error & {
        meta?: { statusCode?: number; headers?: unknown; body?: unknown };
      };
      this.logger.error(`Failed to delete index: ${index}`, {
        error: {
          message: err.message,
          name: err.name,
          statusCode: err.meta?.statusCode,
          headers: err.meta?.headers,
          body: err.meta?.body,
        },
      });
      throw new CustomError("ELASTIC_DELETE_INDEX_FAILED", error as Error);
    }
  }

  /**
   * 🔑 Get Client Instance
   *
   * Gets the raw Elasticsearch client.
   * Like getting the master key to the library! 🗝️
   *
   * @returns {Client} The Elasticsearch client
   */
  getClient(): Client {
    return this.client;
  }
}

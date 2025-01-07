import type { ElasticsearchService } from "@/lib/cortex/elasticsearch/services";
import type {
  BaseDocument,
  DocumentMetadata,
  ProcessedDocumentMetadata,
} from "@/lib/cortex/elasticsearch/types";
import logger from "@/lib/shared/logger";
import type { Logger } from "@/lib/shared/types";
import type { PrismaClient } from "@prisma/client";

/**
 * 📚 Document Service: Your Document Manager!
 *
 * This is the blueprint for how we handle documents in our system.
 * Think of it as a librarian's guide to managing books! 📖
 *
 * @interface DocumentService
 *
 * Core abilities:
 * - 📖 Fetch documents
 * - ✏️ Update documents
 * - 🗑️ Remove documents
 * - 📋 Set up storage space
 */
export interface DocumentService {
  getDocument(
    id: string,
    index?: string
  ): Promise<BaseDocument & ProcessedDocumentMetadata>;
  updateDocument(id: string, document: Partial<BaseDocument>): Promise<void>;
  deleteDocument(id: string): Promise<void>;
  ensureTable(tableName: string): Promise<void>;
}

/**
 * 🔍 Elasticsearch Document Service: Your Smart Document Library!
 *
 * This service is like a super-organized librarian that can:
 * - 📚 Store documents in a searchable way
 * - 🔍 Find documents quickly
 * - ✨ Keep everything up-to-date
 * - 🗄️ Manage document storage
 *
 * It works together with:
 * - 🔎 Elasticsearch (for searching)
 * - 💾 Prisma (for database storage)
 * - 📝 Logger (for keeping track of what's happening)
 *
 * @class ElasticsearchDocumentService
 * @implements {DocumentService}
 */
export class ElasticsearchDocumentService implements DocumentService {
  private readonly elasticsearch: ElasticsearchService;
  private readonly index: string;
  private readonly prisma: PrismaClient;
  private readonly logger: Logger;

  /**
   * 🎒 Sets Up Your Document Manager
   *
   * Gets everything ready to handle your documents.
   * Like setting up a new library with all its organization systems!
   *
   * @param {ElasticsearchService} elasticsearch - Our search helper
   * @param {string} index - Where to store documents (like choosing a shelf)
   * @param {PrismaClient} prisma - Our database helper
   */
  constructor(
    elasticsearch: ElasticsearchService,
    index: string,
    prisma: PrismaClient
  ) {
    this.elasticsearch = elasticsearch;
    this.index = index;
    this.prisma = prisma;
    this.logger = { ...logger, service: "documents" } as Logger;
  }

  /**
   * 📝 Creates a New Document
   *
   * Like adding a new book to our library, complete with all its details!
   *
   * @param {BaseDocument} document - The new document to add
   * @returns {Promise<ProcessedDocumentMetadata>} Info about the saved document
   */
  async createDocument(
    document: BaseDocument
  ): Promise<ProcessedDocumentMetadata> {
    const now = new Date().toISOString();

    // Create initial document without embeddings
    const initialDocument: Omit<BaseDocument, "embeddings"> = {
      ...document,
      created_at: now,
      updated_at: now,
      processing_status: "pending",
    };

    // Remove embeddings field if it exists
    if ("embeddings" in initialDocument) {
      const { embeddings: _ } = initialDocument as BaseDocument & {
        embeddings?: unknown;
      };
    }

    return this.elasticsearch.upsertDocument(
      this.index,
      document.id,
      initialDocument as BaseDocument
    );
  }

  /**
   * 📖 Fetches a Document
   *
   * Finds and brings back a document for you to read.
   * Like fetching a book from the library shelf!
   *
   * @param {string} id - Which document to get
   * @param {string} [index] - Which shelf to look on (optional)
   * @returns {Promise<BaseDocument & ProcessedDocumentMetadata>} The document and its details
   * @throws {Error} If we can't find the document
   */
  async getDocument(
    id: string,
    index?: string
  ): Promise<BaseDocument & ProcessedDocumentMetadata> {
    const document = await this.elasticsearch.getDocument<BaseDocument>(
      index || this.index,
      id
    );

    if (!document) {
      throw new Error(`Document not found: ${id}`);
    }

    const now = new Date();
    const created = document.created_at ? new Date(document.created_at) : now;
    const updated = document.updated_at ? new Date(document.updated_at) : now;

    const version = (document as unknown as DocumentMetadata).version ?? 1;

    return {
      ...document,
      id: id,
      created_at: created.toISOString() as string & Date,
      updated_at: updated.toISOString() as string & Date,
      version,
    };
  }

  /**
   * ✏️ Updates a Document
   *
   * Changes information in an existing document.
   * Like updating the information in a book!
   *
   * @param {string} id - Which document to update
   * @param {Partial<BaseDocument>} document - What to change
   * @returns {Promise<void>} When the update is complete
   */
  async updateDocument(
    id: string,
    document: Partial<BaseDocument>
  ): Promise<void> {
    await this.elasticsearch.updateDocument(this.index, id, document);
  }

  /**
   * 🗑️ Removes a Document
   *
   * Takes a document out of the system completely.
   * Like removing a book from the library catalog.
   *
   * @param {string} id - Which document to remove
   * @returns {Promise<void>} When the removal is complete
   */
  async deleteDocument(id: string): Promise<void> {
    await this.elasticsearch.deleteDocument(this.index, id);
  }

  /**
   * 🏗️ Creates or Checks for Storage Space
   *
   * Makes sure we have a place to store document information.
   * Like making sure we have the right shelves in our library!
   *
   * @param {string} tableName - What to call this storage space
   * @returns {Promise<void>} When the space is ready
   * @throws {Error} If something goes wrong during setup
   */
  async ensureTable(tableName: string): Promise<void> {
    try {
      const sanitizedTableName = tableName
        .replace(/[^a-zA-Z0-9_]/g, "_")
        .toLowerCase();

      // Check if table exists with proper typing
      const tableExists = await this.prisma.$queryRaw<[{ exists: boolean }]>`
        SELECT EXISTS (
          SELECT FROM information_schema.tables
          WHERE table_name = ${sanitizedTableName}
        );
      `;

      if (!tableExists[0].exists) {
        // Create the table if it doesn't exist
        await this.prisma.$executeRaw`
          CREATE TABLE IF NOT EXISTS ${sanitizedTableName} (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            title TEXT,
            content TEXT,
            abstract TEXT,
            authors TEXT[],
            metadata JSONB DEFAULT '{}',
            tags TEXT[],
            source TEXT,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
          );
        `;

        this.logger.info(`Created table: ${sanitizedTableName}`);
      }
    } catch (error) {
      this.logger.error("Failed to ensure table exists", { error });
      throw error;
    }
  }
}

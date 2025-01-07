import type { Logger } from "@/lib/shared/types";
import { BaseMapping } from "./mappings";
import type { ElasticsearchService } from "./services";

/**
 * 📚 Default Index Names
 *
 * These are our main storage spaces in Elasticsearch.
 * Like having different sections in a library! 📚
 */
const DEFAULT_INDICES = ["documents", "test_documents"];

/**
 * 🏗️ Sets Up Elasticsearch Storage Spaces
 *
 * This is like setting up new shelves in our library before we can store books.
 * Makes sure we have all the right places to put our documents!
 *
 * What it does:
 * - 🔍 Checks if our storage spaces exist
 * - 📦 Creates new ones if needed
 * - ⚙️ Sets up smart search features
 * - 📝 Keeps track of what it's doing
 *
 * @param {ElasticsearchService} elasticsearch - Our search helper
 * @param {Logger} logger - Keeps track of what's happening
 * @throws {Error} If something goes wrong during setup
 */
export async function initializeIndices(
  elasticsearch: ElasticsearchService,
  logger: Logger
): Promise<void> {
  try {
    logger.info("Initializing Elasticsearch indices");

    for (const index of DEFAULT_INDICES) {
      const exists = await elasticsearch.indexExists(index);

      if (!exists) {
        logger.info(`Creating index: ${index}`);
        await elasticsearch.createIndex(index, {
          body: {
            settings: {
              number_of_shards: 1,
              number_of_replicas: 1,
              analysis: {
                analyzer: {
                  default: {
                    type: "standard",
                    stopwords: "_english_",
                  },
                },
              },
            },
            mappings: {
              dynamic: false,
              properties: BaseMapping,
            },
          },
        });
        logger.info(`Created index: ${index}`);
      } else {
        logger.info(`Index ${index} already exists`);
      }
    }

    logger.info("Elasticsearch indices initialized successfully");
  } catch (error) {
    logger.error("Failed to initialize Elasticsearch indices", { error });
    throw error;
  }
}

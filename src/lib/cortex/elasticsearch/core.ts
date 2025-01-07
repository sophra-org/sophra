import type { ElasticsearchConfig } from "./services";

/**
 * 🔧 Creates Elasticsearch Configuration
 *
 * Sets up everything Elasticsearch needs to connect securely.
 * Think of it as preparing your special key card to enter a secure building! 🔑
 *
 * What it does:
 * - 🔍 Checks for required connection settings
 * - 🔐 Sets up security credentials
 * - 🎯 Configures connection details
 *
 * @throws {Error} If required environment variables are missing
 * @returns {ElasticsearchConfig} Ready-to-use configuration
 */
export function createElasticsearchConfig(): ElasticsearchConfig {
  if (!process.env.ELASTICSEARCH_URL) {
    throw new Error("ELASTICSEARCH_URL environment variable is required");
  }

  // Only include auth if API key is provided
  const config: ElasticsearchConfig = {
    node: process.env.ELASTICSEARCH_URL,
  };

  // Optionally add auth if API key exists
  if (process.env.SOPHRA_ES_API_KEY) {
    config.auth = {
      apiKey: process.env.SOPHRA_ES_API_KEY.includes(":")
        ? Buffer.from(process.env.SOPHRA_ES_API_KEY).toString("base64")
        : process.env.SOPHRA_ES_API_KEY,
    };
  }

  return config;
}

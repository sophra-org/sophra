import type { BaseDocument } from "@/lib/cortex/elasticsearch/types";
import logger from "@/lib/shared/logger";

const VECTOR_DIMENSIONS = 3072;

/**
 * 🧠 Vectorization Service: Your AI Translation Helper!
 *
 * Turns text into numbers that AI can understand.
 * Like teaching a robot to read with magic glasses! 🤖
 *
 * Features:
 * - 🎯 Text to vector conversion
 * - 📚 Document processing
 * - 🔄 Batch operations
 * - 🛡️ Error handling
 *
 * @class VectorizationService
 */
export class VectorizationService {
  private openaiApiKey: string;
  private serviceName = "VectorizationService";

  /**
   * 🎬 Set Up AI Translation
   *
   * Gets everything ready for turning text into vectors.
   * Like calibrating your magic glasses! 🔧
   *
   * @param {string} apiKey - Your special access key
   */
  constructor(config: { apiKey: string }) {
    if (!config.apiKey) {
      throw new Error("OpenAI API key is required for vectorization service");
    }
    this.openaiApiKey = config.apiKey;
  }

  private log(
    level: "error" | "info" | "warn" | "debug",
    message: string,
    meta?: any
  ) {
    logger[level](message, { service: this.serviceName, ...meta });
  }

  /**
   * 🎯 Generate Number Patterns
   *
   * Turns text into special number patterns.
   * Like creating a mathematical fingerprint! 👆
   *
   * @param {string} text - Words to transform
   * @returns {Promise<number[]>} The magical number pattern
   */
  async generateEmbeddings(text: string, apiKey: string): Promise<number[]> {
    try {
      const response = await fetch("https://api.openai.com/v1/embeddings", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          input: text,
          model: "text-embedding-3-large",
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        this.log("error", "OpenAI API error", {
          status: response.status,
          error: data,
          textLength: text.length,
        });
        throw new Error(
          `OpenAI API error: ${data.error?.message || "Unknown error"}`
        );
      }

      if (!data.data?.[0]?.embedding) {
        throw new Error("No embedding returned from OpenAI API");
      }

      const embedding = data.data[0].embedding;
      if (embedding.length !== VECTOR_DIMENSIONS) {
        throw new Error(
          `Invalid embedding dimensions: got ${embedding.length}, expected ${VECTOR_DIMENSIONS}`
        );
      }

      return embedding;
    } catch (error) {
      this.log("error", "Embedding generation failed", {
        error,
        textLength: text.length,
        hasApiKey: !!apiKey,
      });
      throw error;
    }
  }

  /**
   * 📚 Process a Document
   *
   * Turns a document into AI-readable format.
   * Like giving a book its own unique barcode! 📖
   *
   * @param {BaseDocument} doc - Document to process
   * @returns {Promise<BaseDocument & { embeddings: number[] }>} Enhanced document
   */
  async vectorizeDocument(
    doc: BaseDocument,
    config?: { apiKey?: string }
  ): Promise<BaseDocument & { embeddings: number[] }> {
    try {
      // Use provided API key or fall back to instance key
      const apiKey = config?.apiKey || this.openaiApiKey;

      if (!apiKey) {
        throw new Error("OpenAI API key is required for vectorization");
      }

      const text = `Title: ${doc.title}\nAbstract: ${doc.abstract}\nContent: ${doc.content}`;
      const embeddings = await this.generateEmbeddings(text, apiKey);

      return {
        ...doc,
        embeddings,
        processing_status: "completed",
        metadata: {
          ...doc.metadata,
          last_vectorized: new Date().toISOString(),
        },
      };
    } catch (error) {
      this.log("error", "Vectorization failed", {
        error,
        docId: doc.id,
        hasApiKey: !!config?.apiKey || !!this.openaiApiKey,
      });
      throw error;
    }
  }

  /**
   * 📚 Process Many Documents
   *
   * Handles multiple documents at once.
   * Like scanning a whole library at super speed! ⚡
   *
   * @param {BaseDocument[]} docs - Documents to process
   * @returns {Promise<Array<BaseDocument & { embeddings: number[] }>>} Enhanced documents
   */
  async vectorizeBatch(
    docs: BaseDocument[]
  ): Promise<Array<BaseDocument & { embeddings: number[] }>> {
    const results = await Promise.all(
      docs.map(async (doc) => {
        const vectorizedDoc = await this.vectorizeDocument(doc);
        return vectorizedDoc;
      })
    );
    return results;
  }

  async checkHealth(): Promise<boolean> {
    try {
      // Basic check - if service is instantiated
      return true;
    } catch (error) {
      return false;
    }
  }
}

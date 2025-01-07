import type { TextQuery, VectorQuery } from "@/lib/cortex/types/search";
import type { estypes } from "@elastic/elasticsearch";

/**
 * 🔍 Builds a Text Search Query
 *
 * Creates a query that looks for specific words or phrases.
 * Like teaching the system what words to look for in our documents! 📚
 *
 * Features:
 * - 📝 Searches in multiple fields (title, content, etc.)
 * - ⭐ Gives extra importance to titles
 * - 🎯 Handles fuzzy matching for typos
 *
 * @param {TextQuery} [textQuery] - What to search for
 * @returns {estypes.QueryDslQueryContainer} Ready-to-use search query
 */
export function buildTextQuery(
  textQuery?: TextQuery
): estypes.QueryDslQueryContainer {
  if (!textQuery) {
    return { match_all: {} };
  }

  return {
    multi_match: {
      query: textQuery.query,
      fields: textQuery.fields || ["title^2", "content", "abstract"],
      operator: textQuery.operator || "OR",
      fuzziness: textQuery.fuzziness || "AUTO",
    },
  };
}

/**
 * 🧮 Builds a Vector Search Query
 *
 * Creates a query that finds similar documents using AI-generated vectors.
 * Like finding books that are mathematically similar! 🤖
 *
 * Features:
 * - 📊 Uses vector similarity
 * - 🎯 Finds semantically similar content
 * - 🔢 Handles mathematical comparisons
 *
 * @param {VectorQuery} [vectorQuery] - Vector search parameters
 * @returns {estypes.QueryDslQueryContainer} Ready-to-use vector query
 * @throws {Error} If vector query is missing
 */
export function buildVectorQuery(
  vectorQuery?: VectorQuery
): estypes.QueryDslQueryContainer {
  if (!vectorQuery) {
    throw new Error("Vector query is required for vector search");
  }

  return {
    bool: {
      must: [
        {
          exists: {
            field: vectorQuery.field,
          },
        },
        {
          script_score: {
            query: { match_all: {} },
            script: {
              source: `cosineSimilarity(params.query_vector, '${vectorQuery.field}') + 1.0`,
              params: { query_vector: vectorQuery.vector },
            },
            min_score: vectorQuery.minScore || 0,
          },
        },
      ],
    },
  };
}

/**
 * 🎯 Builds a Combined Text and Vector Query
 *
 * Creates a super-smart query that uses both words and AI understanding.
 * Like having a librarian who understands both your words AND your intent! 🧠
 *
 * Features:
 * - 🔄 Combines text and vector search
 * - ⚖️ Balances different search types
 * - 🎚️ Adjustable importance weights
 *
 * @param {TextQuery} [textQuery] - Text to search for
 * @param {VectorQuery} [vectorQuery] - Vector similarity search
 * @param {Object} [boost] - How much importance to give each type
 * @param {number} [boost.textWeight] - Importance of text matching (default: 0.5)
 * @param {number} [boost.vectorWeight] - Importance of vector similarity (default: 0.5)
 * @returns {estypes.QueryDslQueryContainer} Ready-to-use combined query
 */
export function buildHybridQuery(
  textQuery?: TextQuery,
  vectorQuery?: VectorQuery,
  boost?: { textWeight?: number; vectorWeight?: number }
): estypes.QueryDslQueryContainer {
  const textWeight = boost?.textWeight ?? 0.5;
  const vectorWeight = boost?.vectorWeight ?? 0.5;

  const boolQuery: estypes.QueryDslQueryContainer & {
    bool: { minimum_should_match?: number };
  } = {
    bool: {
      should: [
        {
          function_score: {
            query: buildTextQuery(textQuery),
            functions: [{ weight: textWeight }],
            boost_mode: "multiply",
            score_mode: "sum",
          },
        },
        {
          function_score: {
            query: buildVectorQuery(vectorQuery),
            functions: [{ weight: vectorWeight }],
            boost_mode: "multiply",
            score_mode: "sum",
          },
        },
      ],
      minimum_should_match: 1,
    },
  };

  return boolQuery;
}

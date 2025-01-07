import type { SearchResponse } from "@/lib/cortex/elasticsearch/services";
import type { BaseDocument } from "@/lib/cortex/elasticsearch/types";

/**
 * 📋 Validation Result: Our Quality Check Report
 *
 * This is like a report card that tells us if our data is in good shape!
 *
 * @interface ValidationResult
 * @property {boolean} isValid - ✅ Is everything okay?
 * @property {string[]} errors - ❌ List of things that need fixing
 */
export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

/**
 * 🔍 Search Result with Extra Checks
 *
 * This extends our basic search results with validation superpowers!
 * Think of it as a search result that's gone through quality control.
 *
 * @interface SearchResult
 * @template T - The type of document we're working with
 * @extends SearchResponse<T>
 *
 * @property {unknown} id - The result's unique identifier
 * @property {unknown} score - How well this result matches
 * @property {boolean} document - Is there a document attached?
 * @property {ValidationResult[]} [validationResults] - Quality check results
 */
export interface SearchResult<T extends BaseDocument>
  extends SearchResponse<T> {
  id: unknown;
  score: unknown;
  document: T;
  validationResults?: ValidationResult[];
}

/**
 * 🛡️ Validation Service: Your Data Quality Guardian!
 *
 * This service is like a friendly but thorough security guard,
 * making sure all our data is exactly how it should be.
 *
 * What it helps with:
 * - ✨ Keeping search results clean and reliable
 * - 🧮 Making sure our math (vectors) is correct
 * - 🚦 Preventing bad data from causing problems
 *
 * @class ValidationService
 */
export class ValidationService {
  /**
   * 🔍 Checks If Search Results Are Valid
   *
   * Makes sure each search result has all the pieces it needs,
   * like checking if a puzzle has all its pieces!
   *
   * @template T - Type of document we're validating
   * @param {SearchResult<T>[]} results - The search results to check
   * @returns {boolean} true if everything looks good, false if something's missing
   */
  validateSearchResults<T extends BaseDocument>(
    results: SearchResult<T>[]
  ): boolean {
    return results.every((result) => {
      return (
        typeof result.id === "string" &&
        typeof result.score === "number" &&
        result.document &&
        typeof result.document === "object"
      );
    });
  }

  /**
   * 🧮 Validates Document Vectors
   *
   * Checks if a document's mathematical representation (embeddings)
   * is in the right format. Like making sure a recipe has all its
   * measurements correct!
   *
   * @param {BaseDocument} document - The document to check
   * @returns {boolean} true if the math checks out, false if something's off
   */
  validateVectorization(document: BaseDocument): boolean {
    return (
      Array.isArray(document.embeddings) &&
      document.embeddings.length === 3072 &&
      document.embeddings.every((val) => typeof val === "number")
    );
  }
}

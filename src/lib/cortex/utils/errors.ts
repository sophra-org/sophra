/**
 * 🎯 Error Utilities: Your Error Handling Helper!
 *
 * Makes errors easier to understand and handle.
 * Like having a friendly detective that investigates problems! 🔍
 */

/**
 * 🎨 Custom Error: Your Special Error Type
 *
 * A better way to handle errors in your app.
 * Like having a detailed incident report form! 📝
 *
 * Features:
 * - 🏷️ Error codes
 * - 📚 Stack traces
 * - 🔍 Original error tracking
 * - 📊 JSON formatting
 *
 * @class CustomError
 * @extends {Error}
 */
export class CustomError extends Error {
  readonly code: string;
  readonly originalError?: Error;

  /**
   * 🎬 Create New Error
   *
   * Makes a new custom error with all the details.
   * Like filling out an incident report! 📋
   *
   * @param {string} code - What kind of error it is
   * @param {Error} [originalError] - What caused it
   */
  constructor(code: string, originalError?: Error) {
    super(originalError?.message || code);
    this.code = code;
    this.originalError = originalError;
    this.name = "CustomError";

    // Maintains proper stack trace for where error was thrown
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, CustomError);
    }
  }

  /**
   * 📝 Convert to JSON
   *
   * Makes the error easy to save or send.
   * Like making a clean copy of the incident report! 📄
   *
   * @returns {Record<string, unknown>} The error details
   */
  toJSON(): Record<string, unknown> {
    return {
      name: this.name,
      code: this.code,
      message: this.message,
      stack: this.stack,
      originalError: this.originalError
        ? {
            name: this.originalError.name,
            message: this.originalError.message,
            stack: this.originalError.stack,
          }
        : undefined,
    };
  }
}

/**
 * 🎨 Format Error Message
 *
 * Makes errors look nice and readable.
 * Like making a neat summary of what went wrong! 📋
 *
 * @param {Error} error - The error to format
 * @returns {string} A pretty error message
 */
export function formatError(error: Error): string {
  if (error instanceof CustomError) {
    return JSON.stringify(error.toJSON());
  }
  return JSON.stringify({
    name: error.name,
    message: error.message,
    stack: error.stack,
  });
}

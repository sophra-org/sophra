import { NextResponse } from "next/server";
import { z } from "zod";

/**
 * ✨ Validation Utilities: Your Data Quality Guardian!
 *
 * Makes sure all your data is clean and correct.
 * Like having a friendly fairy that checks your homework! 🧚‍♀️
 */

/**
 * 🔍 Validate Request Data
 *
 * Checks if incoming data matches what we expect.
 * Like having a magical filter that catches mistakes! 🪄
 *
 * @template T - Type of data we're checking
 * @param {z.Schema<T>} schema - The rules to check against
 * @param {unknown} data - The data to check
 * @returns {Promise<{success: boolean, data?: T, response?: NextResponse}>}
 */
export const validateRequest = async <T>(
  schema: z.Schema<T>,
  data: unknown
): Promise<
  { success: true; data: T } | { success: false; response: NextResponse }
> => {
  try {
    const validData = await schema.parseAsync(data);
    return { success: true, data: validData };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        response: new NextResponse(
          JSON.stringify({
            error: "Validation Error",
            details: error.errors.map((err) => ({
              path: err.path.join("."),
              message: err.message,
            })),
          }),
          {
            status: 400,
            headers: {
              "Content-Type": "application/json",
            },
          }
        ),
      };
    }

    return {
      success: false,
      response: new NextResponse(JSON.stringify({ error: "Invalid Request" }), {
        status: 400,
        headers: {
          "Content-Type": "application/json",
        },
      }),
    };
  }
};

/**
 * 📋 Common Validation Rules
 *
 * Ready-to-use rules for common data types.
 * Like having a recipe book for data checking! 📖
 *
 * Includes:
 * - 📄 Pagination rules
 * - 📅 Date range rules
 * - 🔍 Search query rules
 */
export const commonSchemas = {
  /**
   * 📄 Pagination Rules
   *
   * Makes sure page numbers make sense.
   * Like numbering pages in a book! 📚
   */
  pagination: z.object({
    page: z.number().int().min(1).optional().default(1),
    limit: z.number().int().min(1).max(100).optional().default(10),
  }),

  /**
   * 📅 Date Range Rules
   *
   * Makes sure dates are valid.
   * Like checking a calendar! 🗓️
   */
  dateRange: z.object({
    startDate: z.string().datetime(),
    endDate: z.string().datetime(),
  }),

  /**
   * 🔍 Search Query Rules
   *
   * Makes sure search requests are valid.
   * Like having a proper search form! 📝
   */
  searchQuery: z.object({
    query: z.string().min(1).max(500),
    filters: z.record(z.string()).optional(),
    sort: z.enum(["asc", "desc"]).optional(),
  }),
};

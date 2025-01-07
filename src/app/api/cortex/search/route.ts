import {
  toElasticsearchQuery,
  type BaseDocument,
  type BaseQuery,
} from "@/lib/cortex/elasticsearch/types";
import { serviceManager } from "@/lib/cortex/utils/service-manager";
import prisma from "@/lib/shared/database/client";
import logger from "@/lib/shared/logger";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
// Declare Node.js runtime
export const runtime = "nodejs";


const VECTOR_DIMENSIONS = 3072;

const SearchRequestSchema = z.object({
  index: z.string(),
  searchType: z.enum(["text", "vector", "hybrid"]),
  sessionId: z.string().optional(),
  textQuery: z
    .object({
      query: z.string(),
      fields: z.array(z.string()),
      operator: z
        .string()
        .transform((val) => val.toUpperCase())
        .pipe(z.enum(["AND", "OR"]))
        .optional(),
      fuzziness: z.enum(["AUTO", "0", "1", "2"]).optional(),
    })
    .optional(),
  vectorQuery: z
    .object({
      vector: z
        .array(z.number())
        .refine((vector) => vector.length === VECTOR_DIMENSIONS, {
          message: `Vector must have exactly ${VECTOR_DIMENSIONS} dimensions`,
        }),
      field: z.string(),
      k: z.number().optional(),
      minScore: z.number().optional(),
    })
    .optional(),
  boost: z
    .object({
      text: z.number().optional(),
      vector: z.number().optional(),
    })
    .optional(),
  from: z.number().optional(),
  size: z.number().optional(),
  facets: z
    .object({
      fields: z.array(z.string()),
      size: z.number().optional(),
    })
    .optional(),
});

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const body = await req.json();
    const validatedBody = SearchRequestSchema.parse(body);
    const services = await serviceManager.getServices();

    logger.debug("Search request", {
      searchType: validatedBody.searchType,
      index: validatedBody.index,
    });

    // Extract search parameters
    const size = validatedBody.size ?? 10;
    const from = validatedBody.from ?? 0;

    // Build the query
    const query = buildSearchQuery(validatedBody);
    const elasticsearchQuery = toElasticsearchQuery(query);

    // Build search options
    const searchOptions = {
      index: validatedBody.index,
      query: elasticsearchQuery,
      size,
      from,
      facets: validatedBody.facets,
      aggregations: validatedBody.facets
        ? buildFacetsAggregation(validatedBody.facets)
        : undefined,
      sort: undefined,
    };

    const result = await services.elasticsearch.search<BaseDocument>(
      searchOptions.index,
      {
        size,
        from,
        query: elasticsearchQuery,
        ...(validatedBody.facets && {
          aggregations: buildFacetsAggregation(validatedBody.facets),
        }),
      }
    );

    const searchEvent = await createSearchEvent(validatedBody, result);

    return NextResponse.json({
      success: true,
      data: {
        hits: result.hits.hits,
        total: result.hits.total,
        took: result.took,
        maxScore: result.hits.hits[0]?._score ?? null,
        aggregations: result.aggregations,
        searchEventId: searchEvent.id,
      },
    });
  } catch (error) {
    logger.error("Search failed", {
      error,
      errorMessage: error instanceof Error ? error.message : "Unknown error",
      errorStack: error instanceof Error ? error.stack : undefined,
    });

    return NextResponse.json(
      {
        success: false,
        error: "Search failed",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

function buildSearchQuery(
  body: z.infer<typeof SearchRequestSchema>
): BaseQuery {
  const { searchType, textQuery, vectorQuery } = body;

  switch (searchType) {
    case "text":
      if (!textQuery) {
        return { match_all: {} };
      }
      return {
        multi_match: {
          query: textQuery.query,
          fields: textQuery.fields,
          operator: textQuery.operator || "OR",
          fuzziness: textQuery.fuzziness || "AUTO",
        },
      };

    case "vector":
      if (!vectorQuery?.field || !vectorQuery?.vector) {
        throw new Error("Vector query requires field and vector");
      }
      return {
        script_score: {
          query: {
            exists: {
              field: "embeddings",
            },
          },
          script: {
            source: "cosineSimilarity(params.query_vector, 'embeddings')",
            params: {
              query_vector: vectorQuery.vector,
            },
          },
          min_score: vectorQuery.minScore || 0.7,
        },
      };

    case "hybrid":
      if (!textQuery || !vectorQuery) {
        throw new Error("Hybrid search requires both text and vector queries");
      }
      return {
        bool: {
          should: [
            {
              multi_match: {
                query: textQuery.query,
                fields: textQuery.fields,
                operator: textQuery.operator || "OR",
                fuzziness: textQuery.fuzziness || "AUTO",
              },
            },
            {
              script_score: {
                query: {
                  exists: {
                    field: "embeddings",
                  },
                },
                script: {
                  source: "cosineSimilarity(params.query_vector, 'embeddings')",
                  params: {
                    query_vector: vectorQuery.vector,
                  },
                },
                min_score: vectorQuery.minScore || 0.7,
              },
            },
          ],
        },
      };

    default:
      throw new Error(`Unsupported search type: ${searchType}`);
  }
}

function buildFacetsAggregation(
  facets: NonNullable<z.infer<typeof SearchRequestSchema>["facets"]>
) {
  return facets.fields.reduce(
    (acc, field) => ({
      ...acc,
      [field]: {
        terms: {
          field: `${field}.keyword`,
          size: facets.size || 10,
        },
      },
    }),
    {}
  );
}

async function createSearchEvent(
  body: z.infer<typeof SearchRequestSchema>,
  result: any
) {
  return await prisma.searchEvent.create({
    data: {
      session: body.sessionId
        ? {
            connect: {
              id: body.sessionId,
            },
          }
        : {
            create: {
              userId: null,
              createdAt: new Date(),
              updatedAt: new Date(),
              metadata: {},
              expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // Expires in 30 days
            },
          },
      query: body.textQuery?.query || "",
      searchType: body.searchType,
      totalHits: result.hits.total.value ?? 0,
      took: result.took ?? 0,
      timestamp: new Date(),
      facetsUsed: body.facets ? JSON.stringify(body.facets) : "null",
      resultIds: JSON.stringify(
        result.hits.hits.map((hit: { _id: string }) => hit._id)
      ),
      page: body.from ? Math.floor(body.from / (body.size || 10)) + 1 : 1,
      pageSize: body.size || 10,
      filters: "null",
    },
  });
}

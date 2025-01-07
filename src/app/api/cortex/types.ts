import type { BaseDocument } from "@/lib/cortex/elasticsearch/types";
import type { estypes } from "@elastic/elasticsearch";

export interface APIResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  details?: unknown;
}

export interface CreateDocumentRequest {
  index: string;
  id?: string;
  document: Partial<BaseDocument>;
  tableName: string;
}

export interface UpdateDocumentRequest {
  index: string;
  id: string;
  document: Partial<BaseDocument>;
  tableName: string;
}

export interface SearchRequest {
  index: string;
  query: estypes.QueryDslQueryContainer;
  from?: number;
  size?: number;
  facets?: {
    fields: string[];
    size?: number;
  };
  aggregations?: Record<string, estypes.AggregationsAggregationContainer>;
}

export interface DeleteDocumentRequest {
  index: string;
  id: string;
  tableName: string;
}

export interface HealthStatus {
  elasticsearch: boolean;
  postgres: boolean;
  redis: boolean;
  sync: boolean;
  timestamp: string;
  error?: string;
}

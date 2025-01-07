export interface APIResponse<T = unknown> {
  success: boolean;
  message?: string;
  error?: string;
  details?: unknown;
  data?: T;
}

export interface CreateDocumentRequest {
  index: string;
  content: string;
  metadata?: Record<string, unknown>;
  vectorize?: boolean;
}

export interface UpdateDocumentRequest {
  index: string;
  content?: string;
  metadata?: Record<string, unknown>;
  vectorize?: boolean;
}

export interface DeleteDocumentRequest {
  index: string;
  documentId: string;
}

export interface SearchRequest {
  index: string;
  query: string;
  filters?: string[];
  limit?: number;
  offset?: number;
}

export interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  message?: string;
  details?: {
    [key: string]: unknown;
  };
} 
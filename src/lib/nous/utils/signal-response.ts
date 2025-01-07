// apps/nous/src/utils/signal-response.ts
import { NextResponse } from "next/server";

interface SignalResponseMetadata {
  timestamp: string;
  count?: number;
  page?: number;
  pageSize?: number;
  totalCount?: number;
  processingStatus?: string;
}

export function createSignalResponse<T>(
  data: T,
  metadata: SignalResponseMetadata,
  options: { success?: boolean; status?: number } = {}
): NextResponse {
  return NextResponse.json(
    {
      success: options.success ?? true,
      data,
      metadata: {
        ...metadata,
        timestamp: new Date().toISOString(),
      },
    },
    {
      status: options.status ?? 200,
    }
  );
}

import logger from "@/lib/shared/logger";
import type { Logger } from "@/lib/shared/types";
import { NextResponse } from "next/server";

const typedLogger = logger as unknown as Logger;
typedLogger.service = "cortex-error-handler";

export function handleError(error: unknown, context: string) {
  typedLogger.error(`Error in ${context}`, { error });

  if (error instanceof Error) {
    return NextResponse.json(
      {
        success: false,
        error: `${context} failed`,
        details: error.message,
        type: error.name,
      },
      { status: 500 }
    );
  }

  return NextResponse.json(
    {
      success: false,
      error: `${context} failed`,
      details: "Unknown error occurred",
    },
    { status: 500 }
  );
}

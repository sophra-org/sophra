import logger from "@/lib/shared/logger";
import dotenv from "dotenv";
import { NextResponse } from "next/server";
import OpenAI from "openai";
import { z } from "zod";
// Declare Node.js runtime
export const runtime = "nodejs";


dotenv.config();

const HealthCheckResponseSchema = z.object({
  success: z.boolean(),
  status: z.string(),
  message: z.string().optional(),
  version: z.string(),
  timestamp: z.string(),
  openai_status: z
    .object({
      connected: z.boolean(),
      error: z.string().optional(),
      available_models: z.array(z.string()).optional(),
    })
    .optional(),
});

export async function GET(): Promise<NextResponse> {
  try {
    // Test OpenAI connection
    const openaiStatus = { connected: false };

    try {
      const openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
      });

      const models = await openai.models.list();
      openaiStatus.connected = true;
      (openaiStatus as any).available_models = models.data
        .slice(0, 5)
        .map((m) => m.id);
    } catch (error) {
      (openaiStatus as any).error =
        error instanceof Error ? error.message : "OpenAI connection failed";
      logger.error("OpenAI connection error:", { error });
    }

    const response = HealthCheckResponseSchema.parse({
      success: true,
      status: "ok",
      version: process.env.npm_package_version || "0.9.0",
      timestamp: new Date().toISOString(),
      openai_status: openaiStatus,
    });

    return NextResponse.json(response);
  } catch (error) {
    logger.error("Health check failed:", { error });

    const errorResponse = HealthCheckResponseSchema.parse({
      success: false,
      status: "error",
      message: error instanceof Error ? error.message : "Health check failed",
      version: process.env.npm_package_version || "0.9.0",
      timestamp: new Date().toISOString(),
    });

    return NextResponse.json(errorResponse, { status: 500 });
  }
}

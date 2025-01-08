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
      if (!process.env.OPENAI_API_KEY) {
        throw new Error("API key not configured");
      }

      const openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
      });

      const models = await openai.models.list();
      openaiStatus.connected = true;
      (openaiStatus as any).available_models = models.data
        .slice(0, 5)
        .map((m) => m.id);
    } catch (error) {
      openaiStatus.connected = false;
      (openaiStatus as any).error =
        error instanceof Error && error.message.includes("API key")
          ? "API key not configured"
          : "API Error";
      logger.error("OpenAI connection error:", error);
    }

    const response = HealthCheckResponseSchema.parse({
      success: true,
      status: openaiStatus.connected ? "ok" : "degraded",
      version: process.env.npm_package_version || "0.0.0",
      timestamp: new Date().toISOString(),
      openai_status: openaiStatus,
    });

    return NextResponse.json(response);
  } catch (error) {
    logger.error("Unexpected error in health check:", error);
    return NextResponse.json(
      {
        success: false,
        status: "error",
        message: "Internal server error",
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

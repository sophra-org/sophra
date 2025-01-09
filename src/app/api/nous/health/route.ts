import logger from '@lib/shared/logger';
import dotenv from 'dotenv';
import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import { z } from 'zod';

export const runtime = 'nodejs';

dotenv.config();

const HealthCheckResponseSchema = z.object({
  success: z.boolean(),
  status: z.enum(['ok', 'degraded', 'error']),
  message: z.string().optional(),
  version: z.string().default('0.9.0'),
  timestamp: z.string(),
  openai_status: z.object({
    connected: z.boolean(),
    error: z.string().optional(),
    available_models: z.array(z.string()).optional(),
  }).optional(),
});

export async function GET(): Promise<NextResponse> {
  try {
    const openaiStatus = { connected: false };

    try {
      if (!process.env.OPENAI_API_KEY) {
        throw new Error('API key not configured');
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
        error instanceof Error && error.message.includes('API key')
          ? 'API key not configured'
          : 'API Error';
      logger.error('OpenAI connection error:', error);
    }

    const response = {
      success: true,
      status: openaiStatus.connected ? 'ok' : 'degraded',
      version: '0.9.0',
      timestamp: new Date().toISOString(),
      openai_status: openaiStatus,
    };

    HealthCheckResponseSchema.parse(response);
    return NextResponse.json(response);
  } catch (error) {
    logger.error('Unexpected error in health check:', error);
    
    const errorResponse = {
      success: false,
      status: 'error',
      message: error instanceof Error ? error.message : 'Internal server error',
      timestamp: new Date().toISOString(),
      version: '0.9.0',
    };

    return NextResponse.json(errorResponse, { 
      status: error instanceof z.ZodError ? 400 : 500 
    });
  }
}

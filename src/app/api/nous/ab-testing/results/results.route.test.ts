// Test setup imports
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mockPrisma } from "~/vitest.setup";

// Next.js imports
import { NextResponse, NextRequest } from 'next/server';
import { MockNextRequest } from '@/app/api/cortex/search/__mocks__/next-server';

// Route handlers
import { POST, GET } from './route';

// Mocks
vi.mock("@/lib/shared/database/client", () => ({ 
    default: mockPrisma 
}));

vi.mock('@/lib/shared/logger', () => ({
    default: {
        error: vi.fn(),
        info: vi.fn()
    }
}));

vi.mock('next/server', () => {
    return vi.importActual<typeof import('@/app/api/cortex/search/__mocks__/next-server')>('@/app/api/cortex/search/__mocks__/next-server');
});

describe('AB Testing Results API', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        (mockPrisma as any).$reset?.();
    });

    describe('POST /api/nous/ab-testing/results', () => {
        it('should reject invalid request body', async () => {
            const invalidBody = {
                testId: 123,
                metrics: "invalid"
            };

            const request = new NextRequest('http://localhost', {
                method: 'POST',
                body: JSON.stringify(invalidBody)
            });

            const response = await POST(request);
            const data = await response.json();
        });
    });
});
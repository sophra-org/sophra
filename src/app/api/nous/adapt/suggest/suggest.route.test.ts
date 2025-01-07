import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST } from './route';
import prisma from "@/lib/shared/database/client";
import logger from "@/lib/shared/logger";

vi.mock('@/lib/shared/database/client', () => ({
    default: {
        $queryRaw: vi.fn()
    }
}));

vi.mock('@/lib/shared/logger', () => ({
    default: {
        info: vi.fn(),
        error: vi.fn()
    }
}));

vi.mock('next/server', () => {
    return {
        NextRequest: vi.fn().mockImplementation((url) => {
            return {
                url,
                nextUrl: new URL(url),
                headers: new Headers(),
                json: vi.fn().mockImplementation(async () => ({}))
            };
        }),
        NextResponse: {
            json: vi.fn().mockImplementation((data, init) => ({
                status: init?.status || 200,
                ok: init?.status ? init.status >= 200 && init.status < 300 : true,
                headers: new Headers(),
                json: async () => data
            }))
        }
    };
});

describe('Adaptation Suggestion Route Handler', () => {
    const mockUUID = '123e4567-e89b-12d3-a456-426614174000';
    
    beforeEach(() => {
        vi.clearAllMocks();
        vi.spyOn(crypto, 'randomUUID').mockReturnValue(mockUUID);
    });

    it('should successfully process valid adaptation suggestion', async () => {
        const validPayload = {
            queryHash: 'hash123',
            patterns: {
                averageRelevance: 0.8,
                clickThroughRate: 0.6,
                conversionRate: 0.4,
                requiresOptimization: true,
                confidence: 0.9
            },
            confidence: 0.95
        };

        const mockSuggestion = [{
            id: mockUUID,
            queryHash: validPayload.queryHash,
            patterns: validPayload.patterns,
            confidence: validPayload.confidence,
            status: 'PENDING'
        }];

        vi.mocked(prisma.$queryRaw).mockResolvedValue(mockSuggestion);

        const request = new (vi.mocked(require('next/server').NextRequest))('http://localhost/api/nous/adapt/suggest');
        request.json = vi.fn().mockResolvedValue(validPayload);

        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.success).toBe(true);
        expect(data.data.suggestionId).toBe(mockUUID);
        expect(data.code).toBe('ADAPT000');
        expect(data.metadata.took).toBeDefined();
    });

    it('should reject invalid payload with missing required fields', async () => {
        const invalidPayload = {
            queryHash: 'hash123',
            patterns: {
                averageRelevance: 0.8,
                clickThroughRate: 0.6
            },
            confidence: 0.95
        };

        const request = new (vi.mocked(require('next/server').NextRequest))('http://localhost/api/nous/adapt/suggest');
        request.json = vi.fn().mockResolvedValue(invalidPayload);

        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(400);
        expect(data.success).toBe(false);
        expect(data.code).toBe('ADAPT001');
        expect(data.error).toBe('Invalid rule suggestion format');
    });

    it('should reject payload with invalid value ranges', async () => {
        const invalidPayload = {
            queryHash: 'hash123',
            patterns: {
                averageRelevance: 1.5,
                clickThroughRate: 0.6,
                conversionRate: 0.4,
                requiresOptimization: true,
                confidence: 0.9
            },
            confidence: 0.95
        };

        const request = new (vi.mocked(require('next/server').NextRequest))('http://localhost/api/nous/adapt/suggest');
        request.json = vi.fn().mockResolvedValue(invalidPayload);

        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(400);
        expect(data.success).toBe(false);
        expect(data.code).toBe('ADAPT001');
    });

    it('should handle database errors appropriately', async () => {
        const validPayload = {
            queryHash: 'hash123',
            patterns: {
                averageRelevance: 0.8,
                clickThroughRate: 0.6,
                conversionRate: 0.4,
                requiresOptimization: true,
                confidence: 0.9
            },
            confidence: 0.95
        };

        vi.mocked(prisma.$queryRaw).mockRejectedValue(new Error('Database connection failed'));

        const request = new (vi.mocked(require('next/server').NextRequest))('http://localhost/api/nous/adapt/suggest');
        request.json = vi.fn().mockResolvedValue(validPayload);

        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(500);
        expect(data.success).toBe(false);
        expect(data.code).toBe('ADAPT999');
        expect(data.error).toBe('Failed to process adaptation suggestion');
        expect(data.metadata.errorType).toBe('Error');
    });
});

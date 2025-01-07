import { mockPrisma } from '~/vitest.setup';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET, POST } from './route';
import { RulePriority } from '@prisma/client';

// Mock logger
vi.mock('/lib/shared/logger', () => ({
    default: {
        info: vi.fn(),
        error: vi.fn()
    }
}));

// Mock next/server
vi.mock('next/server', () => ({
    NextRequest: vi.fn().mockImplementation((url) => ({
        url,
        nextUrl: new URL(url),
        headers: new Headers(),
        json: vi.fn().mockImplementation(async () => ({}))
    })),
    NextResponse: {
        json: vi.fn().mockImplementation((data, init) => ({
            status: init?.status || 200,
            ok: init?.status ? init.status >= 200 && init.status < 300 : true,
            headers: new Headers(),
            json: async () => data
        }))
    }
}));

describe('Adaptation Rules API', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('GET', () => {
        it('should return all adaptation rules ordered by priority', async () => {
            const mockRules = [
                { id: '1', name: 'Rule 1', description: 'Description 1', type: 'Type 1', conditions: {}, actions: {}, priority: RulePriority.HIGH, enabled: true, lastTriggered: null },
                { id: '2', name: 'Rule 2', description: 'Description 2', type: 'Type 2', conditions: {}, actions: {}, priority: RulePriority.LOW, enabled: true, lastTriggered: null }
            ];
            mockPrisma.adaptationRule.findMany.mockResolvedValue(mockRules);

            const response = await GET();
            const data = await response.json();

            expect(mockPrisma.adaptationRule.findMany).toHaveBeenCalledWith({
                orderBy: { priority: 'asc' }
            });
            expect(data.rules).toEqual(mockRules);
        });

        it('should handle database errors during fetch', async () => {
            mockPrisma.adaptationRule.findMany.mockRejectedValue(new Error('DB Error'));

            const response = await GET();
            const data = await response.json();

            expect(response.status).toBe(500);
            expect(data.error).toBe('Failed to fetch adaptation rules');
        });
    });

    describe('POST', () => {
        it('should create multiple adaptation rules successfully', async () => {
            const mockRequest = new (vi.mocked(require('next/server').NextRequest))('http://localhost');
            const mockRules = [{
                name: 'Test Rule',
                description: 'Test Description',
                type: 'test',
                conditions: { condition: true },
                actions: { action: true },
                priority: RulePriority.MEDIUM,
                enabled: true
            }];

            mockRequest.json = vi.fn().mockResolvedValue({ rules: mockRules });
            mockPrisma.$transaction.mockResolvedValue([{ ...mockRules[0], id: '1' }]);

            const response = await POST(mockRequest);
            const data = await response.json();

            expect(data.success).toBe(true);
            expect(data.rules).toHaveLength(1);
            expect(mockPrisma.$transaction).toHaveBeenCalled();
        });

        it('should reject invalid rule format', async () => {
            const mockRequest = new (vi.mocked(require('next/server').NextRequest))('http://localhost');
            const invalidRules = [{
                name: 123,
                priority: 'INVALID'
            }];

            mockRequest.json = vi.fn().mockResolvedValue({ rules: invalidRules });

            const response = await POST(mockRequest);
            const data = await response.json();

            expect(response.status).toBe(400);
            expect(data.error).toBe('Invalid request format');
        });

        it('should handle empty rules array', async () => {
            const mockRequest = new (vi.mocked(require('next/server').NextRequest))('http://localhost');
            mockRequest.json = vi.fn().mockResolvedValue({ rules: [] });
            mockPrisma.$transaction.mockResolvedValue([]);

            const response = await POST(mockRequest);
            const data = await response.json();

            expect(data.success).toBe(true);
            expect(data.rules).toHaveLength(0);
        });

        it('should handle database transaction errors', async () => {
            const mockRequest = new (vi.mocked(require('next/server').NextRequest))('http://localhost');
            const mockRules = [{
                name: 'Test Rule',
                description: 'Test Description',
                type: 'test',
                conditions: {},
                actions: {},
                priority: RulePriority.LOW,
                enabled: true
            }];

            mockRequest.json = vi.fn().mockResolvedValue({ rules: mockRules });
            mockPrisma.$transaction.mockRejectedValue(new Error('Transaction failed'));

            const response = await POST(mockRequest);
            const data = await response.json();

            expect(response.status).toBe(500);
            expect(data.error).toBe('Failed to create adaptation rules');
        });
    });
});

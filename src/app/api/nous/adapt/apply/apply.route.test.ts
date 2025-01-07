import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST } from './route';
import { AdaptationEngine } from "@/lib/shared/engine/adaptation-engine";
import logger from "@/lib/shared/logger";
import { NextRequest, NextResponse } from "next/server";
import { RuleRegistry } from '@/lib/nous/adapt/rules';
import { mockPrisma } from "~/vitest.setup";

// Mock implementations
vi.mock('@/lib/shared/database/client', () => ({ 
    default: mockPrisma 
}));

vi.mock('@/lib/shared/engine/adaptation-engine', () => {
    const engineMocks = {
        updateMetrics: vi.fn(),
        updateState: vi.fn(),
        evaluateEvent: vi.fn().mockResolvedValue(undefined)
    };

    // Export the mocks so we can access them in tests
    (globalThis as any).__engineMocks = engineMocks;

    return {
        AdaptationEngine: vi.fn().mockImplementation(() => engineMocks)
    };
});

vi.mock('@/lib/shared/logger', () => ({
    default: vi.fn().mockImplementation(() => ({
        error: vi.fn(),
        warn: vi.fn(),
        info: vi.fn(),
        debug: vi.fn(),
        http: vi.fn(),
        verbose: vi.fn(),
        service: 'test'
    }))()
}));

vi.mock('@/lib/nous/adapt/rules', () => ({
    RuleRegistry: vi.fn().mockImplementation(() => ({
        register: vi.fn(),
        unregister: vi.fn(),
        getRuleCount: vi.fn().mockReturnValue(0),
        getRule: vi.fn(),
        executeTriggered: vi.fn()
    }))
}));

vi.mock('next/server', () => ({
    NextRequest: vi.fn().mockImplementation((url) => ({
        url,
        nextUrl: new URL(url),
        headers: new Headers(),
        json: vi.fn()
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

describe('Adaptation Apply Route Handler', () => {
    let engineMocks: any;

    beforeEach(() => {
        vi.clearAllMocks();
        engineMocks = (globalThis as any).__engineMocks;
        // Create a new instance to ensure the mock functions are properly initialized
        new AdaptationEngine(logger);
    });

    it('should validate request format and return 400 for invalid input', async () => {
        const request = new NextRequest('http://localhost/api/nous/adapt/apply');
        request.json = vi.fn().mockResolvedValue({ 
            ruleIds: 'not-an-array',
            context: {}
        });

        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(400);
        expect(data.error).toBe('Invalid request format');
        expect(data.details).toBeDefined();
    });

    it('should handle case when no rules are found', async () => {
        const request = new NextRequest('http://localhost/api/nous/adapt/apply');
        request.json = vi.fn().mockResolvedValue({
            ruleIds: ['rule1', 'rule2'],
            context: { test: true }
        });

        vi.mocked(mockPrisma.adaptationRule.findMany).mockResolvedValue([]);

        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(404);
        expect(data.error).toBe('No valid rules found');
    });

    it('should process valid request with metrics successfully', async () => {
        const request = new NextRequest('http://localhost/api/nous/adapt/apply');
        request.json = vi.fn().mockResolvedValue({
            ruleIds: ['rule1'],
            context: { test: true },
            metrics: { metric1: 100 }
        });

        vi.mocked(mockPrisma.adaptationRule.findMany).mockResolvedValue([
            {
                id: 'rule1',
                enabled: true,
                name: 'Test Rule',
                description: 'A test adaptation rule',
                type: 'ADAPTATION',
                conditions: { test: true },
                actions: { action: 'test_action' },
                priority: 'CRITICAL',
                lastTriggered: new Date()
            }
        ]);

        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.success).toBe(true);
        expect(data.applied_rules).toBe(1);
        expect(data.processing_time_ms).toBeDefined();
        expect(engineMocks.updateMetrics).toHaveBeenCalledWith({ metric1: 100 });
        expect(engineMocks.updateState).toHaveBeenCalledWith({ test: true });
        expect(engineMocks.evaluateEvent).toHaveBeenCalledWith({
            type: 'adaptation_request',
            rules: ['rule1'],
            context: { test: true }
        });
    });

    it('should handle database errors gracefully', async () => {
        const request = new NextRequest('http://localhost/api/nous/adapt/apply');
        request.json = vi.fn().mockResolvedValue({
            ruleIds: ['rule1'],
            context: { test: true }
        });

        vi.mocked(mockPrisma.adaptationRule.findMany).mockRejectedValue(new Error('Database error'));

        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(500);
        expect(data.error).toBe('Failed to apply adaptations');
        expect(data.details).toBe('Database error');
        expect(logger.error).toHaveBeenCalled();
    });

    it('should handle engine evaluation errors', async () => {
        const request = new NextRequest('http://localhost/api/nous/adapt/apply');
        request.json = vi.fn().mockResolvedValue({
            ruleIds: ['rule1'],
            context: { test: true }
        });

        vi.mocked(mockPrisma.adaptationRule.findMany).mockResolvedValue([
            {
                id: 'rule1',
                name: 'Test Rule',
                description: 'A test adaptation rule',
                type: 'ADAPTATION',
                conditions: { test: true },
                actions: { action: 'test_action' },
                priority: 'CRITICAL',
                enabled: true,
                lastTriggered: null
            }
        ]);

        engineMocks.evaluateEvent.mockRejectedValueOnce(new Error('Engine error'));

        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(500);
        expect(data.error).toBe('Failed to apply adaptations');
        expect(data.details).toBe('Engine error');
        expect(logger.error).toHaveBeenCalled();
    });
});

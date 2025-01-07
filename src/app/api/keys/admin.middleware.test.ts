import { describe, it, expect, vi, beforeEach } from 'vitest';
import { adminMiddleware } from './admin.middleware';
import { prisma } from "@/lib/shared/database/client";
import { NextRequest } from "next/server";

vi.mock('@/lib/shared/database/client', () => ({
    prisma: {
        adminToken: {
            findFirst: vi.fn(),
            update: vi.fn()
        }
    }
}));

vi.mock('next/server', async () => {
    const actual = await vi.importActual('next/server');
    return {
        ...actual,
        NextResponse: {
            json: vi.fn().mockImplementation((body, init) => new Response(JSON.stringify(body), init)),
            next: vi.fn().mockImplementation(() => new Response(null, { status: 200 })),
        },
    };
});

describe('Admin Middleware', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should return 401 when admin token header is missing', async () => {
        const request = new Request('http://localhost', {
            headers: new Headers()
        });

        const response = await adminMiddleware(request as NextRequest);
        const data = await response.json();

        expect(response.status).toBe(401);
        expect(data.error).toBe('Missing required header: x-admin-token');
    });

    it('should return 401 when admin token is invalid', async () => {
        vi.mocked(prisma.adminToken.findFirst).mockResolvedValue(null);

        const request = new Request('http://localhost', {
            headers: new Headers({
                'x-admin-token': 'invalid-token'
            })
        });

        const response = await adminMiddleware(request as NextRequest);
        const data = await response.json();

        expect(response.status).toBe(401);
        expect(data.error).toBe('Invalid admin token');
    });

    it('should update lastUsedAt and proceed when token is valid', async () => {
        const mockToken = {
            id: '1',
            token: 'valid-token',
            isActive: true,
            lastUsedAt: new Date(),
            name: 'Test Token',
            description: null,
            createdAt: new Date(),
            updatedAt: new Date()
        };

        vi.mocked(prisma.adminToken.findFirst).mockResolvedValue(mockToken);
        vi.mocked(prisma.adminToken.update).mockResolvedValue(mockToken);

        const request = new Request('http://localhost', {
            headers: new Headers({
                'x-admin-token': 'valid-token'
            })
        });

        const response = await adminMiddleware(request as NextRequest);

        expect(prisma.adminToken.update).toHaveBeenCalledWith({
            where: { id: mockToken.id },
            data: expect.objectContaining({
                lastUsedAt: expect.any(Date)
            })
        });
        expect(response.status).toBe(200);
        expect(response.headers.get('x-admin-token-id')).toBe(mockToken.id);
    });

    it('should return 500 when database error occurs', async () => {
        vi.mocked(prisma.adminToken.findFirst).mockRejectedValue(new Error('Database error'));

        const request = new Request('http://localhost', {
            headers: new Headers({
                'x-admin-token': 'valid-token'
            })
        });

        const response = await adminMiddleware(request as NextRequest);
        const data = await response.json();

        expect(response.status).toBe(500);
        expect(data.error).toBe('Error validating admin token');
    });

    it('should check for active tokens only', async () => {
        const request = new Request('http://localhost', {
            headers: new Headers({
                'x-admin-token': 'test-token'
            })
        });

        await adminMiddleware(request as NextRequest);

        expect(prisma.adminToken.findFirst).toHaveBeenCalledWith({
            where: {
                token: 'test-token',
                isActive: true
            }
        });
    });
});

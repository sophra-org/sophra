import { describe, it, expect, vi, beforeEach } from 'vitest';
import { adminMiddleware } from './admin.middleware';
import { prisma } from "@/lib/shared/database/client";
import { NextRequest, NextResponse } from "next/server";
import * as jwt from "jsonwebtoken";
import { hasPermission, isSuperAdmin } from "./admin/permissions";

vi.mock('@/lib/shared/database/client', () => ({
    prisma: {
        adminToken: {
            findFirst: vi.fn(),
            update: vi.fn()
        }
    }
}));

vi.mock('./admin/permissions', () => ({
    hasPermission: vi.fn(),
    isSuperAdmin: vi.fn()
}));

vi.mock('jsonwebtoken', () => ({
    decode: vi.fn()
}));

describe('Admin Middleware Additional Tests', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        process.env.JWT_SECRET = 'test-secret';
    });

    const createMockRequest = (url: string, token?: string) => {
        return new NextRequest(new URL(url), {
            headers: token ? new Headers({ 'x-admin-token': token }) : undefined
        });
    };

    // Mock NextResponse.json for proper response handling
    vi.mock('next/server', async () => {
        const actual = await vi.importActual('next/server') as { NextResponse: typeof NextResponse };
        return {
            ...actual,
            NextResponse: {
                ...(actual.NextResponse as object),
                json: vi.fn((data, options) => {
                    return new Response(JSON.stringify(data), {
                        ...options,
                        headers: {
                            'Content-Type': 'application/json',
                            ...options?.headers,
                        }
                    });
                })
            }
        };
    });

    it('should return 401 when JWT token is invalid format', async () => {
        const mockToken = {
            id: '1',
            token: 'valid-token',
            name: 'Test Token',
            description: null,
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date(),
            lastUsedAt: new Date()
        };

        vi.mocked(prisma.adminToken.findFirst).mockResolvedValue(mockToken);
        vi.mocked(jwt.decode).mockReturnValue(null);

        const request = createMockRequest('http://localhost', 'valid-token');
        const response = await adminMiddleware(request);
        const data = await response.json();

        expect(response.status).toBe(401);
        expect(data.error).toBe('Invalid token format');
    });

    it('should return 403 when user lacks permission for endpoint', async () => {
        const mockToken = {
            id: '1',
            token: 'valid-token',
            name: 'Test Token',
            description: null,
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date(),
            lastUsedAt: new Date()
        };

        const decodedToken = {
            name: 'Test Admin',
            type: 'admin',
            permissions: ['read:users']
        };

        vi.mocked(prisma.adminToken.findFirst).mockResolvedValue(mockToken);
        vi.mocked(jwt.decode).mockReturnValue(decodedToken);
        vi.mocked(isSuperAdmin).mockReturnValue(false);
        vi.mocked(hasPermission).mockReturnValue(false);

        const request = createMockRequest('http://localhost/api/admin/sensitive', 'valid-token');
        const response = await adminMiddleware(request);
        const data = await response.json();

        expect(response.status).toBe(403);
        expect(data.error).toBe('Insufficient permissions for this endpoint');
    });

    it('should allow access when user is super admin regardless of endpoint', async () => {
        const mockToken = {
            id: '1',
            token: 'valid-token',
            name: 'Super Admin Token',
            description: null,
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date(),
            lastUsedAt: new Date()
        };

        const decodedToken = {
            name: 'Super Admin',
            type: 'admin',
            permissions: ['*']
        };

        vi.mocked(prisma.adminToken.findFirst).mockResolvedValue(mockToken);
        vi.mocked(jwt.decode).mockReturnValue(decodedToken);
        vi.mocked(isSuperAdmin).mockReturnValue(true);
        vi.mocked(hasPermission).mockReturnValue(false);

        const request = createMockRequest('http://localhost/api/admin/sensitive', 'valid-token');
        const response = await adminMiddleware(request);
        
        expect(response.status).toBe(200);
        expect(response.headers.get('x-admin-token-name')).toBe('Super Admin');
        expect(response.headers.get('x-admin-token-type')).toBe('admin');
    });

    it('should handle string JWT decode result as invalid', async () => {
        const mockToken = {
            id: '1',
            token: 'valid-token',
            name: 'Test Token',
            description: null,
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date(),
            lastUsedAt: new Date()
        };

        vi.mocked(prisma.adminToken.findFirst).mockResolvedValue(mockToken);
        vi.mocked(jwt.decode).mockReturnValue('invalid-string-token');

        const request = createMockRequest('http://localhost', 'valid-token');
        const response = await adminMiddleware(request);
        const data = await response.json();

        expect(response.status).toBe(401);
        expect(data.error).toBe('Invalid token format');
    });

    it('should handle invalid tokens gracefully', async () => {
        vi.mocked(prisma.adminToken.findFirst).mockResolvedValue(null);

        const request = createMockRequest('http://localhost', 'invalid-token');
        const response = await adminMiddleware(request);
        const data = await response.json();

        expect(response.status).toBe(401);
        expect(data.error).toBe('Invalid admin token');
    });

    it('should update lastUsedAt timestamp on successful validation', async () => {
        const mockToken = {
            id: '1',
            token: 'valid-token',
            isActive: true
        };

        const decodedToken = {
            name: 'Test Admin',
            type: 'admin',
            permissions: ['read:users']
        };

        vi.mocked(prisma.adminToken.findFirst).mockResolvedValue(mockToken as any);
        vi.mocked(jwt.decode).mockReturnValue(decodedToken);
        vi.mocked(isSuperAdmin).mockReturnValue(true);
        vi.mocked(prisma.adminToken.update).mockResolvedValue(mockToken as any);

        const request = createMockRequest('http://localhost', 'valid-token');
        await adminMiddleware(request);

        expect(prisma.adminToken.update).toHaveBeenCalledWith({
            where: { id: mockToken.id },
            data: { lastUsedAt: expect.any(Date) }
        });
    });

    it('should handle missing JWT_SECRET', async () => {
        delete process.env.JWT_SECRET;
        const mockToken = {
            id: '1',
            token: 'valid-token',
            isActive: true
        };

        vi.mocked(prisma.adminToken.findFirst).mockResolvedValue(mockToken as any);

        const request = createMockRequest('http://localhost', 'valid-token');
        const response = await adminMiddleware(request);
        const data = await response.json();

        expect(response.status).toBe(500);
        expect(data.error).toBe('Error validating admin token');
        
        // Restore JWT_SECRET for other tests
        process.env.JWT_SECRET = 'test-secret';
    });
});

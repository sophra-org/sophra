vi.mock('@prisma/client', () => ({
	PrismaClient: vi.fn(() => mockPrisma),
	Prisma: {
		JsonValue: undefined,
		JsonObject: undefined,
	}
}));

vi.mock('@/lib/shared/database/client', () => ({
	default: mockPrisma,
	prisma: mockPrisma
}));

import { mockPrisma } from '@/lib/shared/test/prisma.mock';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST, GET, PUT, PATCH, DELETE } from './route';
import { prisma } from "@/lib/shared/database/client";
import * as adminMiddleware from './admin.middleware';
import { INTERNALS } from 'next/dist/server/web/spec-extension/request';
import { ResponseCookies } from 'next/dist/server/web/spec-extension/cookies';
import { NextResponse } from 'next/server';

vi.mock('./admin.middleware', () => ({
	adminMiddleware: vi.fn()
}));

vi.mock('next/server', () => ({
	NextRequest: vi.fn().mockImplementation((url, init) => ({
		url,
		body: init?.body || '',
		method: init?.method || 'GET',
		cookies: {},
		geo: {},
		ip: '127.0.0.1',
		nextUrl: new URL(url),
		headers: new Headers(),
		text: async () => init?.body || '',
		json: async () => init?.body ? JSON.parse(init.body) : {}
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

describe('API Keys Route Handlers', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		vi.mocked(adminMiddleware.adminMiddleware).mockResolvedValue({
			status: 200,
			ok: true,
			headers: new Headers(),
			json: async () => ({}),
			cookies: new ResponseCookies(new Headers()),
			redirected: false,
			statusText: '',
			type: 'default',
			url: '',
			clone: function (): Response {
				return structuredClone(this) as Response;
			},
			body: null,
			bodyUsed: false,
			arrayBuffer: async () => new ArrayBuffer(0),
			blob: async () => new Blob(),
			formData: async () => new FormData(),
			text: async () => '',
			[INTERNALS]: {
				cookies: new Map(),
				url: 'http://localhost:3000/api/keys',
				body: null
			}
		} as unknown as NextResponse)
	});

	describe('POST /api/keys', () => {
		it('should create a new API key with valid input', async () => {
			const mockApiKey = {
				id: '1',
				key: 'test-key',
				name: 'Test Key',
				clientId: 'client1',
				description: 'Test description',
				rateLimit: 100,
				allowedIps: ['127.0.0.1'],
				expiresAt: new Date(),
				isActive: true,
				createdAt: new Date(),
				updatedAt: new Date(),
				lastUsedAt: null,
				usageCount: 0
			};

			vi.mocked(prisma.apiKey.create).mockResolvedValue(mockApiKey);

			const request = new (vi.mocked(require('next/server').NextRequest))('http://localhost/api/keys', {
				method: 'POST',
				body: JSON.stringify({
					name: 'Test Key',
					clientId: 'client1',
					description: 'Test description',
					rateLimit: 100,
					allowedIps: ['127.0.0.1'],
					expiresAt: new Date().toISOString()
				})
			});

			const response = await POST(request);
			const data = await response.json();

			expect(response.status).toBe(201);
			expect(data.name).toBe(mockApiKey.name);
			expect(data.key).toBeDefined();
		});

		it('should handle database errors during creation', async () => {
			vi.mocked(prisma.apiKey.create).mockRejectedValue(new Error('Database error'));

			const request = new (vi.mocked(require('next/server').NextRequest))('http://localhost/api/keys', {
				method: 'POST',
				body: JSON.stringify({ name: 'Test Key' })
			});

			const response = await POST(request);
			const data = await response.json();

			expect(response.status).toBe(500);
			expect(data.error).toBe('Failed to create API key');
		});
	});

	describe('GET /api/keys', () => {
		it('should return list of API keys without exposing actual keys', async () => {
			const mockApiKeys = [{
				id: '1',
				name: 'Test Key',
				clientId: 'client1',
				description: 'Test description',
				isActive: true,
				expiresAt: new Date(),
				createdAt: new Date(),
				updatedAt: new Date(),
				lastUsedAt: new Date(),
				allowedIps: ['127.0.0.1'],
				rateLimit: 100,
				usageCount: 0
			}];

			const mappedApiKeys = mockApiKeys.map(key => ({
				...key,
				key: 'test-key'
			}));

			vi.mocked(prisma.apiKey.findMany).mockResolvedValue(mappedApiKeys);

			const request = new (vi.mocked(require('next/server').NextRequest))('http://localhost/api/keys');
			const response = await GET(request);
			const data = await response.json();

			expect(response.status).toBe(200);
			expect(data[0].key).toBeUndefined();
			expect(data[0].name).toBe(mockApiKeys[0].name);
		});
	});

	describe('PUT /api/keys', () => {
		it('should update API key with regenerated key', async () => {
			const mockUpdatedKey = {
				id: '1',
				key: 'new-key',
				name: 'Updated Key',
				clientId: 'client1',
				description: null,
				isActive: true,
				expiresAt: null,
				createdAt: new Date(),
				updatedAt: new Date(),
				lastUsedAt: null,
				allowedIps: [],
				rateLimit: null,
				usageCount: 0
			};

			vi.mocked(prisma.apiKey.update).mockResolvedValue(mockUpdatedKey);

			const request = new (vi.mocked(require('next/server').NextRequest))('http://localhost/api/keys', {
				method: 'PUT',
				body: JSON.stringify({
					id: '1',
					name: 'Updated Key',
					regenerateKey: true
				})
			});

			const response = await PUT(request);
			const data = await response.json();

			expect(response.status).toBe(200);
			expect(data.name).toBe('Updated Key');
			expect(data.key).toBeUndefined();
		});

		it('should reject updates without ID', async () => {
			const request = new (vi.mocked(require('next/server').NextRequest))('http://localhost/api/keys', {
				method: 'PUT',
				body: JSON.stringify({ name: 'Updated Key' })
			});

			const response = await PUT(request);
			const data = await response.json();

			expect(response.status).toBe(400);
			expect(data.error).toBe('API key ID is required');
		});
	});

	describe('DELETE /api/keys', () => {
		it('should successfully delete an API key', async () => {
			vi.mocked(prisma.apiKey.delete).mockResolvedValue({} as any);

			const request = new (vi.mocked(require('next/server').NextRequest))('http://localhost/api/keys?id=1', {
				method: 'DELETE'
			});

			const response = await DELETE(request);
			const data = await response.json();

			expect(response.status).toBe(200);
			expect(data.success).toBe(true);
		});

		it('should handle missing ID parameter', async () => {
			const request = new (vi.mocked(require('next/server').NextRequest))('http://localhost/api/keys', {
				method: 'DELETE'
			});

			const response = await DELETE(request);
			const data = await response.json();

			expect(response.status).toBe(400);
			expect(data.error).toBe('API key ID is required');
		});
	});
});

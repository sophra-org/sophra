import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET } from './route';
import { serviceManager } from "@/lib/cortex/utils/service-manager";

vi.mock('@/lib/cortex/utils/service-manager', () => ({
    serviceManager: {
        getServices: vi.fn().mockResolvedValue({
            elasticsearch: {
                ping: vi.fn()
            },
            postgres: {
                ping: vi.fn()
            },
            redis: {
                ping: vi.fn()
            }
        })
    }
}));

vi.mock('@/lib/shared/logger', () => ({
    default: {
        info: vi.fn(),
        error: vi.fn()
    }
}));

vi.mock('next/server', () => ({
    NextRequest: vi.fn().mockImplementation((url) => ({
        url,
        nextUrl: new URL(url),
        headers: new Headers(),
        json: async () => ({})
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

describe('Health Check Route Handler', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        process.env.ELASTICSEARCH_URL = 'http://elasticsearch:9200';
        process.env.POSTGRESQL_URL = 'postgres://user:pass@localhost:5432/db';
        process.env.SOPHRA_REDIS_URL = 'redis://user:pass@localhost:6379';
    });

    it('should return healthy status when all services are connected', async () => {
        const request = new (vi.mocked(require('next/server').NextRequest))('http://localhost:3000/api/health');
        const services = await serviceManager.getServices();
        vi.mocked(services.elasticsearch.ping).mockResolvedValue(true);
        vi.mocked(services.postgres.ping).mockResolvedValue(true);
        vi.mocked(services.redis.ping).mockResolvedValue(true);

        const response = await GET(request);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.success).toBe(true);
        expect(data.data.status).toBe('healthy');
        expect(data.data.services.elasticsearch.connected).toBe(true);
        expect(data.data.services.postgres.connected).toBe(true);
        expect(data.data.services.redis.connected).toBe(true);
        expect(data.meta.took).toBeDefined();
    });

    it('should return unhealthy status when any service is disconnected', async () => {
        const services = await serviceManager.getServices();
        vi.mocked(services.elasticsearch.ping).mockResolvedValue(true);
        vi.mocked(services.postgres.ping).mockResolvedValue(false);
        vi.mocked(services.redis.ping).mockResolvedValue(true);

        const request = new (vi.mocked(require('next/server').NextRequest))('http://localhost/health');
        const response = await GET(request);
        const data = await response.json();

        expect(response.status).toBe(503);
        expect(data.success).toBe(false);
        expect(data.data.status).toBe('unhealthy');
        expect(data.data.services.postgres.connected).toBe(false);
    });

    it('should handle errors during health check', async () => {
        const services = await serviceManager.getServices();
        vi.mocked(services.elasticsearch.ping).mockRejectedValue(new Error('Connection failed'));

        const request = new (vi.mocked(require('next/server').NextRequest))('http://localhost/health');
        const response = await GET(request);
        const data = await response.json();

        expect(response.status).toBe(500);
        expect(data.success).toBe(false);
        expect(data.error).toBe('Connection failed');
        expect(data.meta.took).toBeDefined();
    });

    it('should mask sensitive information in service URLs', async () => {
        const services = await serviceManager.getServices();
        vi.mocked(services.elasticsearch.ping).mockResolvedValue(true);
        vi.mocked(services.postgres.ping).mockResolvedValue(true);
        vi.mocked(services.redis.ping).mockResolvedValue(true);

        const request = new (vi.mocked(require('next/server').NextRequest))('http://localhost/health');
        const response = await GET(request);
        const data = await response.json();

        expect(data.data.services.postgres.url).toBe('localhost:5432/db');
        expect(data.data.services.redis.url).toBe('localhost:6379');
        expect(data.data.services.postgres.url).not.toContain('user:pass');
        expect(data.data.services.redis.url).not.toContain('user:pass');
    });
});
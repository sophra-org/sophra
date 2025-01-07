import { vi } from 'vitest';
import { NextRequest } from 'next/server';

class MockResponse {
    constructor(data: any, init?: ResponseInit) {
        this.data = data;
        this.init = init || {};
        this.status = init?.status || 200;
        this.headers = new Headers(init?.headers);
    }

    data: any;
    init: ResponseInit;
    status: number;
    headers: Headers;

    json() {
        return Promise.resolve(this.data);
    }

    text() {
        return Promise.resolve(JSON.stringify(this.data));
    }

    clone() {
        return new MockResponse(this.data, this.init);
    }
}

class MockRequest implements Partial<NextRequest> {
    readonly url: string;
    readonly nextUrl: URL;
    readonly headers: Headers;
    readonly cookies: Map<string, string>;
    readonly geo: { country?: string; city?: string; region?: string } | null;
    readonly ip: string | null;
    readonly body: string | null;
    readonly searchParams: URLSearchParams;

    constructor(url: string, init?: RequestInit) {
        this.url = url;
        this.nextUrl = new URL(url);
        this.headers = new Headers(init?.headers);
        this.cookies = new Map();
        this.geo = null;
        this.ip = null;
        this.body = init?.body?.toString() || null;
        this.searchParams = this.nextUrl.searchParams;
    }

    async json() {
        return this.body ? JSON.parse(this.body) : {};
    }

    async text() {
        return this.body || '';
    }
}

export { MockRequest, MockResponse }; 
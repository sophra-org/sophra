import { vi } from 'vitest';

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

class MockRequest {
    readonly url: string;
    readonly nextUrl: URL;
    readonly headers: Headers;
    readonly searchParams: URLSearchParams;
    private readonly _body: string | undefined;

    constructor(url: string, init?: RequestInit) {
        this.url = url;
        this.nextUrl = new URL(url);
        this.headers = new Headers(init?.headers);
        this.searchParams = this.nextUrl.searchParams;
        this._body = init?.body?.toString();
    }

    json() {
        return Promise.resolve(this._body ? JSON.parse(this._body) : {});
    }

    text() {
        return Promise.resolve(this._body || '');
    }
}

export const mockNextServer = () => {
    const NextResponse = {
        json: vi.fn().mockImplementation((data: any, init?: ResponseInit) => {
            const response = new MockResponse(data, init);
            response.json = () => Promise.resolve(data);
            return response;
        }),
        redirect: vi.fn().mockImplementation((url: string, init?: ResponseInit) => {
            return new MockResponse(null, { ...init, status: 302 });
        }),
        next: vi.fn().mockImplementation((init?: ResponseInit) => {
            return new MockResponse(null, init);
        }),
        rewrite: vi.fn().mockImplementation((url: string, init?: ResponseInit) => {
            return new MockResponse(null, init);
        }),
    };

    const NextRequest = vi.fn().mockImplementation((url: string, init?: RequestInit) => {
        return new MockRequest(url, init);
    });

    vi.mock('next/server', () => ({
        NextResponse,
        NextRequest,
    }));

    return { NextResponse, NextRequest };
}; 
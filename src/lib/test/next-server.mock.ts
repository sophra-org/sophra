import { vi } from 'vitest';
import { NextRequest } from 'next/server';
import { RequestCookies } from 'next/dist/server/web/spec-extension/cookies';
import { NextURL } from 'next/dist/server/web/next-url';

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
    readonly nextUrl: NextURL;
    readonly headers: Headers;
    readonly cookies: RequestCookies;
    readonly geo?: {
        city?: string;
        country?: string;
        region?: string;
        latitude?: string;
        longitude?: string;
    };
    readonly ip?: string;
    readonly body: ReadableStream<Uint8Array> | null;
    readonly searchParams: URLSearchParams;

    constructor(url: string, init?: RequestInit) {
        this.url = url;
        this.nextUrl = new NextURL(url);
        this.headers = new Headers(init?.headers);
        this.cookies = new RequestCookies(this.headers);
        this.geo = undefined;
        this.ip = undefined;
        this.body = init?.body ? new ReadableStream({
            start(controller) {
                controller.enqueue(new TextEncoder().encode(init.body?.toString() || ''));
                controller.close();
            }
        }) : null;
        this.searchParams = this.nextUrl.searchParams;
    }
    async json() {
        const text = await this.text();
        return text ? JSON.parse(text) : {};
    }

    async text() {
        if (!this.body) return '';
        const reader = this.body.getReader();
        const chunks: Uint8Array[] = [];
        
        while (true) {
            const {done, value} = await reader.read();
            if (done) break;
            chunks.push(value);
        }

        const concatenated = new Uint8Array(chunks.reduce((acc, chunk) => acc + chunk.length, 0));
        let offset = 0;
        for (const chunk of chunks) {
            concatenated.set(chunk, offset);
            offset += chunk.length;
        }

        return new TextDecoder().decode(concatenated);
    }
}

export { MockRequest, MockResponse }; 
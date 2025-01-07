export class MockNextRequest {
    url: string;
    private body: string;
    method?: string;
    
    constructor(url: string, init?: { method?: string; body?: string }) {
        this.url = url;
        this.body = init?.body || '';
        this.method = init?.method;
    }
    
    text() {
        return Promise.resolve(this.body);
    }

    json() {
        return Promise.resolve(this.body ? JSON.parse(this.body) : {});
    }
}

export class MockNextResponse {
    private data: any;
    headers: Headers;
    status: number;

    constructor(data: any, init?: ResponseInit) {
        this.data = data;
        this.headers = new Headers(init?.headers);
        this.status = init?.status || 200;
    }

    text() {
        return Promise.resolve(this.data);
    }

    json() {
        return Promise.resolve(this.data);
    }

    static json(data: any, init?: ResponseInit) {
        return new MockNextResponse(data, init);
    }
}

export { MockNextRequest as NextRequest, MockNextResponse as NextResponse }; 
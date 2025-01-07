export class MockNextRequest {
    private body: string;
    url: string;
    cookies: any;
    geo: any;
    ip: string;
    nextUrl: any;
    method: string;
    headers: Headers;

    constructor(url: string, init?: { method: string; body: string }) {
        this.url = url;
        this.body = init?.body || '';
        this.method = init?.method || 'GET';
        this.cookies = {};
        this.geo = {};
        this.ip = '127.0.0.1';
        this.nextUrl = new URL(url);
        this.headers = new Headers();
    }

    async text() {
        return this.body;
    }

    async json() {
        return JSON.parse(this.body);
    }
}

export const mockResponse = (data: any, init?: { status?: number }) => {
    const response = {
        status: init?.status || 200,
        ok: init?.status ? init.status >= 200 && init.status < 300 : true,
        headers: new Headers(),
        json: async () => data
    };
    return response;
};

export const NextResponse = {
    json: (data: any, init?: { status?: number }) => mockResponse(data, init)
};

export const NextRequest = MockNextRequest; 
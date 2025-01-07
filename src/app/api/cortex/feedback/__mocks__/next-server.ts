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
}

export const mockResponse = (data: any, init?: ResponseInit) => {
    const response = {
        status: init?.status || 200,
        headers: new Headers(init?.headers),
        ok: init?.status ? init.status >= 200 && init.status < 300 : true,
        json: async () => data
    };
    return response;
};

export const NextResponse = {
    json: (data: any, init?: ResponseInit) => mockResponse(data, init)
};

export { MockNextRequest as NextRequest }; 
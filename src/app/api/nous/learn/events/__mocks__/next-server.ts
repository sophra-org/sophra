export class MockNextRequest {
  url: string;
  nextUrl: URL;
  searchParams: URLSearchParams;
  headers: Headers;

  constructor(url: string) {
    this.url = url;
    this.nextUrl = new URL(url);
    this.searchParams = new URL(url).searchParams;
    this.headers = new Headers();
  }

  json() {
    return Promise.resolve({});
  }
}

export class MockNextResponse {
  private data: unknown;
  public status: number;
  public ok: boolean;
  public headers: Headers;

  constructor(data: unknown, init?: { status?: number }) {
    this.data = data;
    this.status = init?.status || 200;
    this.ok = init?.status ? init.status >= 200 && init.status < 300 : true;
    this.headers = new Headers({ 'content-type': 'application/json' });
  }

  json() {
    return Promise.resolve(this.data);
  }

  static json(data: unknown, init?: { status?: number }) {
    return new MockNextResponse(data, init);
  }
}

export { MockNextRequest as NextRequest, MockNextResponse as NextResponse }; 
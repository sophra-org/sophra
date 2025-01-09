import { NextURL } from "next/dist/server/web/next-url";
import { RequestCookies } from "next/dist/server/web/spec-extension/cookies";
import { NextRequest } from "next/server";

class MockResponse {
  static json(data: any, init?: ResponseInit) {
    return new MockResponse(data, init);
  }

  static redirect(url: string, init?: ResponseInit) {
    const response = new MockResponse(null, init);
    response.status = 302;
    return response;
  }

  static next(init?: ResponseInit) {
    return new MockResponse(null, init);
  }

  static rewrite(url: string, init?: ResponseInit) {
    return new MockResponse(null, init);
  }

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
  private bodyCache: string | null = null;

  constructor(url: string, init?: RequestInit) {
    try {
      this.url = url;
      this.nextUrl = new NextURL(url);
    } catch (error) {
      // If URL is invalid, try adding protocol
      const urlWithProtocol = url.startsWith("http") ? url : `https://${url}`;
      this.url = urlWithProtocol;
      this.nextUrl = new NextURL(urlWithProtocol);
    }
    this.headers = new Headers(init?.headers);
    this.cookies = new RequestCookies(this.headers);
    this.geo = undefined;
    this.ip = undefined;
    this.body = init?.body
      ? new ReadableStream({
          start(controller) {
            controller.enqueue(
              new TextEncoder().encode(init.body?.toString() || "")
            );
            controller.close();
          },
        })
      : null;
    this.searchParams = this.nextUrl.searchParams;
  }
  async json() {
    const text = await this.text();
    return text ? JSON.parse(text) : {};
  }

  async text() {
    if (this.bodyCache !== null) {
      return this.bodyCache;
    }
    if (!this.body) {
      this.bodyCache = "";
      return "";
    }
    const reader = this.body.getReader();
    const chunks: Uint8Array[] = [];

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      chunks.push(value);
    }

    const concatenated = new Uint8Array(
      chunks.reduce((acc, chunk) => acc + chunk.length, 0)
    );
    let offset = 0;
    for (const chunk of chunks) {
      concatenated.set(chunk, offset);
      offset += chunk.length;
    }

    this.bodyCache = new TextDecoder().decode(concatenated);
    return this.bodyCache;
  }
}

export { MockRequest, MockResponse };

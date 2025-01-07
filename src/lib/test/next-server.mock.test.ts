import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MockRequest, MockResponse } from './next-server.mock';

describe('NextServer Mock', () => {
  let NextResponse: any;
  let NextRequest: any;
  beforeEach(() => {
    const mocks = { NextResponse: MockResponse, NextRequest: MockRequest };
    NextResponse = mocks.NextResponse;
    NextRequest = mocks.NextRequest;
    vi.clearAllMocks();
  });

  describe('NextResponse', () => {
    describe('json', () => {
      it('should create JSON response successfully', () => {
        // Arrange
        const data = { message: 'Hello World' };
        const init = { status: 200, headers: { 'Content-Type': 'application/json' } };

        // Act
        const response = NextResponse.json(data, init);

        // Assert
        expect(response.data).toEqual(data);
        expect(response.status).toBe(200);
        expect(response.headers.get('Content-Type')).toBe('application/json');
      });

      it('should handle complex data structures', () => {
        // Arrange
        const data = {
          users: [
            { id: 1, name: 'John' },
            { id: 2, name: 'Jane' },
          ],
          metadata: {
            total: 2,
            page: 1,
          },
        };

        // Act
        const response = NextResponse.json(data);

        // Assert
        expect(response.data).toEqual(data);
        expect(response.json()).resolves.toEqual(data);
      });
    });

    describe('redirect', () => {
      it('should create redirect response', () => {
        // Arrange
        const url = 'https://example.com';
        const init = { headers: { 'X-Redirect-Reason': 'Test' } };

        // Act
        const response = NextResponse.redirect(url, init);

        // Assert
        expect(response.status).toBe(302);
        expect(response.headers.get('X-Redirect-Reason')).toBe('Test');
      });
    });

    describe('next', () => {
      it('should create next response with init options', () => {
        // Arrange
        const init = { headers: { 'X-Custom-Header': 'Test' } };

        // Act
        const response = NextResponse.next(init);

        // Assert
        expect(response.headers.get('X-Custom-Header')).toBe('Test');
      });
    });

    describe('rewrite', () => {
      it('should create rewrite response', () => {
        // Arrange
        const url = 'https://example.com/rewritten';
        const init = { headers: { 'X-Rewrite-Info': 'Test' } };

        // Act
        const response = NextResponse.rewrite(url, init);

        // Assert
        expect(response.headers.get('X-Rewrite-Info')).toBe('Test');
      });
    });
  });

  describe('NextRequest', () => {
    it('should create request with URL and searchParams', () => {
      // Arrange
      const url = 'https://example.com/api/users?page=1&limit=10';

      // Act
      const request = new NextRequest(url);

      // Assert
      expect(request.url).toBe(url);
      expect(request.nextUrl.pathname).toBe('/api/users');
      expect(request.searchParams.get('page')).toBe('1');
      expect(request.searchParams.get('limit')).toBe('10');
    });

    it('should handle request headers', () => {
      // Arrange
      const url = 'https://example.com';
      const init = {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer token',
        },
      };

      // Act
      const request = new NextRequest(url, init);

      // Assert
      expect(request.headers.get('Content-Type')).toBe('application/json');
      expect(request.headers.get('Authorization')).toBe('Bearer token');
    });

    it('should handle request body as JSON', async () => {
      // Arrange
      const url = 'https://example.com';
      const body = { message: 'Hello World' };
      const init = {
        body: JSON.stringify(body),
        headers: { 'Content-Type': 'application/json' },
      };

      // Act
      const request = new NextRequest(url, init);
      const jsonBody = await request.json();

      // Assert
      expect(jsonBody).toEqual(body);
    });

    it('should handle request body as text', async () => {
      // Arrange
      const url = 'https://example.com';
      const body = 'Hello World';
      const init = {
        body,
        headers: { 'Content-Type': 'text/plain' },
      };

      // Act
      const request = new NextRequest(url, init);
      const textBody = await request.text();

      // Assert
      expect(textBody).toBe(body);
    });

    it('should handle empty body', async () => {
      // Arrange
      const url = 'https://example.com';
      const request = new NextRequest(url);

      // Act
      const jsonBody = await request.json();
      const textBody = await request.text();

      // Assert
      expect(jsonBody).toEqual({});
      expect(textBody).toBe('');
    });
  });

  describe('Response Cloning', () => {
    it('should clone response with all properties', () => {
      // Arrange
      const data = { message: 'Hello World' };
      const init = {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      };
      const originalResponse = NextResponse.json(data, init);

      // Act
      const clonedResponse = originalResponse.clone();

      // Assert
      expect(clonedResponse.data).toEqual(originalResponse.data);
      expect(clonedResponse.status).toBe(originalResponse.status);
      expect(clonedResponse.headers.get('Content-Type')).toBe(originalResponse.headers.get('Content-Type'));
    });
  });
});
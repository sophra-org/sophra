import { describe, it, expect, beforeEach } from 'vitest';
import { MockRequest, MockResponse } from './next-server.mock';
import { NextURL } from 'next/dist/server/web/next-url';

describe('MockResponse Additional Tests', () => {
  describe('Static Methods', () => {
    it('should create JSON response', () => {
      const data = { test: 'value' };
      const response = MockResponse.json(data);

      expect(response).toBeInstanceOf(MockResponse);
      expect(response.data).toEqual(data);
      expect(response.status).toBe(200);
    });

    it('should create JSON response with custom status', () => {
      const data = { test: 'value' };
      const response = MockResponse.json(data, { status: 201 });

      expect(response.status).toBe(201);
      expect(response.data).toEqual(data);
    });

    it('should create redirect response', () => {
      const url = 'https://example.com';
      const response = MockResponse.redirect(url);

      expect(response).toBeInstanceOf(MockResponse);
      expect(response.status).toBe(302);
    });

    it('should create next response', () => {
      const response = MockResponse.next();

      expect(response).toBeInstanceOf(MockResponse);
      expect(response.status).toBe(200);
    });

    it('should create rewrite response', () => {
      const url = 'https://example.com';
      const response = MockResponse.rewrite(url);

      expect(response).toBeInstanceOf(MockResponse);
      expect(response.status).toBe(200);
    });
  });

  describe('Instance Methods', () => {
    let response: MockResponse;
    const testData = { test: 'value' };

    beforeEach(() => {
      response = new MockResponse(testData);
    });

    it('should handle json method', async () => {
      const data = await response.json();
      expect(data).toEqual(testData);
    });

    it('should handle text method', async () => {
      const text = await response.text();
      expect(text).toBe(JSON.stringify(testData));
    });

    it('should clone response', () => {
      const cloned = response.clone();

      expect(cloned).toBeInstanceOf(MockResponse);
      expect(cloned.data).toEqual(response.data);
      expect(cloned.status).toBe(response.status);
      expect(cloned.headers).toEqual(response.headers);
    });

    it('should handle custom headers', () => {
      const headers = { 'Content-Type': 'application/json' };
      const responseWithHeaders = new MockResponse(testData, { headers });

      expect(responseWithHeaders.headers.get('Content-Type')).toBe('application/json');
    });
  });
});

describe('MockRequest Additional Tests', () => {
  describe('URL Handling', () => {
    it('should parse URL correctly', () => {
      const url = 'https://example.com/path?query=value';
      const request = new MockRequest(url);

      expect(request.url).toBe(url);
      expect(request.nextUrl).toBeInstanceOf(NextURL);
      expect(request.nextUrl.pathname).toBe('/path');
      expect(request.nextUrl.searchParams.get('query')).toBe('value');
    });

    it('should handle search parameters', () => {
      const url = 'https://example.com/path?param1=value1&param2=value2';
      const request = new MockRequest(url);

      expect(request.searchParams.get('param1')).toBe('value1');
      expect(request.searchParams.get('param2')).toBe('value2');
    });
  });

  describe('Headers and Cookies', () => {
    it('should handle custom headers', () => {
      const headers = { 'Content-Type': 'application/json' };
      const request = new MockRequest('https://example.com', { headers });

      expect(request.headers.get('Content-Type')).toBe('application/json');
    });

    it('should initialize cookies from headers', () => {
      const headers = { 'Cookie': 'test=value' };
      const request = new MockRequest('https://example.com', { headers });

      expect(request.cookies.get('test')?.value).toBe('value');
    });
  });

  describe('Body Handling', () => {
    it('should handle JSON body', async () => {
      const body = { test: 'value' };
      const request = new MockRequest('https://example.com', {
        body: JSON.stringify(body),
      });

      const json = await request.json();
      expect(json).toEqual(body);
    });

    it('should handle text body', async () => {
      const body = 'test content';
      const request = new MockRequest('https://example.com', {
        body,
      });

      const text = await request.text();
      expect(text).toBe(body);
    });

    it('should handle empty body', async () => {
      const request = new MockRequest('https://example.com');

      const text = await request.text();
      expect(text).toBe('');

      const json = await request.json();
      expect(json).toEqual({});
    });

    it('should handle streaming body', async () => {
      const body = 'test content';
      const request = new MockRequest('https://example.com', { body });

      expect(request.body).toBeInstanceOf(ReadableStream);

      const reader = request.body!.getReader();
      const { value, done } = await reader.read();

      expect(done).toBe(false);
      expect(new TextDecoder().decode(value)).toBe(body);

      const { done: streamDone } = await reader.read();
      expect(streamDone).toBe(true);
    });
  });

  describe('Optional Properties', () => {
    it('should initialize with undefined geo', () => {
      const request = new MockRequest('https://example.com');
      expect(request.geo).toBeUndefined();
    });

    it('should initialize with undefined ip', () => {
      const request = new MockRequest('https://example.com');
      expect(request.ip).toBeUndefined();
    });
  });

  describe('Edge Cases', () => {
    it('should handle malformed URLs gracefully', () => {
      expect(() => new MockRequest('invalid-url')).not.toThrow();
    });

    it('should handle invalid JSON body', async () => {
      const request = new MockRequest('https://example.com', {
        body: 'invalid-json',
      });

      await expect(request.json()).rejects.toThrow();
    });

    it('should handle multiple reads from body stream', async () => {
      const body = 'test content';
      const request = new MockRequest('https://example.com', { body });

      const text1 = await request.text();
      const text2 = await request.text();

      expect(text1).toBe(body);
      expect(text2).toBe(''); // Second read should return empty as stream is consumed
    });

    it('should handle large bodies', async () => {
      const largeBody = 'x'.repeat(1024 * 1024); // 1MB of data
      const request = new MockRequest('https://example.com', {
        body: largeBody,
      });

      const text = await request.text();
      expect(text.length).toBe(largeBody.length);
    });
  });

  describe('Integration Tests', () => {
    it('should handle complete request scenario', async () => {
      const url = 'https://example.com/api/data?version=1';
      const headers = {
        'Content-Type': 'application/json',
        'Cookie': 'session=123',
        'Authorization': 'Bearer token',
      };
      const body = { data: 'test' };

      const request = new MockRequest(url, {
        headers,
        body: JSON.stringify(body),
      });

      // Verify URL components
      expect(request.nextUrl.pathname).toBe('/api/data');
      expect(request.searchParams.get('version')).toBe('1');

      // Verify headers
      expect(request.headers.get('Content-Type')).toBe('application/json');
      expect(request.headers.get('Authorization')).toBe('Bearer token');

      // Verify cookies
      expect(request.cookies.get('session')?.value).toBe('123');

      // Verify body
      const jsonBody = await request.json();
      expect(jsonBody).toEqual(body);
    });

    it('should handle request-response cycle', async () => {
      // Create request
      const request = new MockRequest('https://example.com/api/data', {
        headers: { 'Accept': 'application/json' },
        body: JSON.stringify({ input: 'test' }),
      });

      // Process request
      const requestBody = await request.json();
      expect(requestBody).toEqual({ input: 'test' });

      // Create response
      const response = MockResponse.json(
        { output: 'processed' },
        {
          status: 201,
          headers: { 'Custom-Header': 'value' },
        }
      );

      // Verify response
      expect(response.status).toBe(201);
      expect(response.headers.get('Custom-Header')).toBe('value');
      const responseBody = await response.json();
      expect(responseBody).toEqual({ output: 'processed' });
    });
  });
});

import { describe, it, expect, vi } from 'vitest';
import { validateRequest } from './validation';
import { z } from 'zod';
import type { NextResponse } from 'next/server';

vi.mock('next/server', () => {
  return {
    NextResponse: vi.fn().mockImplementation((body: string, init?: ResponseInit) => ({
      body: typeof body === 'string' ? body : JSON.stringify(body),
      ...init
    }))
  };
});

describe('Validation Utils', () => {
  describe('validateRequest', () => {
    const schema = z.object({
      name: z.string().min(2).max(50),
      age: z.number().int().min(0).max(150),
      email: z.string().email().optional(),
    });

    it('should validate valid data', async () => {
      const validData = {
        name: 'Test User',
        age: 25,
        email: 'test@example.com'
      };

      const result = await validateRequest(schema, validData);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual(validData);
      }
    });

    it('should validate data with optional fields', async () => {
      const validData = {
        name: 'Test User',
        age: 25
      };

      const result = await validateRequest(schema, validData);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual(validData);
      }
    });

    it('should reject invalid data with validation errors', async () => {
      const invalidData = {
        name: 'A', // Too short
        age: 200, // Too high
        email: 'invalid-email' // Invalid email
      };

      const result = await validateRequest(schema, invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.response).toBeDefined();
        const responseData = JSON.parse((result.response as NextResponse & { body: string }).body);
        expect(responseData.error).toBe('Validation Error');
        expect(responseData.details).toHaveLength(3);
        expect(responseData.details).toContainEqual(expect.objectContaining({
          path: 'name',
          message: expect.stringContaining('2')
        }));
        expect(responseData.details).toContainEqual(expect.objectContaining({
          path: 'age',
          message: expect.stringContaining('150')
        }));
        expect(responseData.details).toContainEqual(expect.objectContaining({
          path: 'email',
          message: expect.stringContaining('email')
        }));
      }
    });

    it('should handle malformed data gracefully', async () => {
      const malformedData = 'not an object';

      const result = await validateRequest(schema, malformedData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.response).toBeDefined();
        const responseData = JSON.parse((result.response as NextResponse & { body: string }).body);
        expect(responseData.error).toBe('Validation Error');
        expect(responseData.details).toBeDefined();
        expect(responseData.details[0].message).toContain('Expected object');
      }
    });

    it('should handle null and undefined values', async () => {
      const result1 = await validateRequest(schema, null);
      expect(result1.success).toBe(false);
      if (!result1.success) {
        const responseData = JSON.parse((result1.response as NextResponse & { body: string }).body);
        expect(responseData.error).toBe('Validation Error');
        expect(responseData.details[0].message).toContain('Expected object, received null');
      }

      const result2 = await validateRequest(schema, undefined);
      expect(result2.success).toBe(false);
      if (!result2.success) {
        const responseData = JSON.parse((result2.response as NextResponse & { body: string }).body);
        expect(responseData.error).toBe('Validation Error');
        expect(responseData.details[0].message).toContain('Required');
      }
    });

    it('should handle empty object', async () => {
      const result = await validateRequest(schema, {});
      expect(result.success).toBe(false);
      if (!result.success) {
        const responseData = JSON.parse((result.response as NextResponse & { body: string }).body);
        expect(responseData.error).toBe('Validation Error');
        expect(responseData.details).toContainEqual(expect.objectContaining({
          path: 'name',
          message: expect.stringContaining('Required')
        }));
        expect(responseData.details).toContainEqual(expect.objectContaining({
          path: 'age',
          message: expect.stringContaining('Required')
        }));
      }
    });
  });
});

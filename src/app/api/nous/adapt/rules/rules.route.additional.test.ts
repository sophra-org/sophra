import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET, POST, runtime } from './route';
import { prisma } from '@lib/shared/database/client';
import logger from '@lib/shared/logger';
import { RulePriority } from '@prisma/client';
import { NextRequest } from 'next/server';

// Mock dependencies
vi.mock('@lib/shared/database/client', () => ({
  prisma: {
    adaptationRule: {
      findMany: vi.fn(),
      create: vi.fn(),
    },
    $transaction: vi.fn(),
  },
}));

vi.mock('@lib/shared/logger', () => ({
  default: {
    error: vi.fn(),
    info: vi.fn(),
  },
}));

describe('Rules Route Additional Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Configuration', () => {
    it('should use Node.js runtime', () => {
      expect(runtime).toBe('nodejs');
    });
  });

  describe('GET Endpoint', () => {
    it('should return rules ordered by priority', async () => {
      const mockRules = [
        {
          id: '1',
          name: 'Rule 1',
          description: 'Test rule 1',
          type: 'test',
          conditions: { condition: true },
          actions: { action: 'test' },
          priority: RulePriority.HIGH,
          enabled: true,
          lastTriggered: null,
        },
        {
          id: '2',
          name: 'Rule 2',
          description: 'Test rule 2',
          type: 'test',
          conditions: { condition: false },
          actions: { action: 'test' },
          priority: RulePriority.LOW,
          enabled: true,
          lastTriggered: null,
        },
      ];

      vi.mocked(prisma.adaptationRule.findMany).mockResolvedValue(mockRules);

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual({
        success: true,
        rules: mockRules,
      });
      expect(prisma.adaptationRule.findMany).toHaveBeenCalledWith({
        orderBy: { priority: 'asc' },
      });
    });

    it('should handle empty rules list', async () => {
      vi.mocked(prisma.adaptationRule.findMany).mockResolvedValue([]);

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual({
        success: true,
        rules: [],
      });
    });

    it('should handle database errors', async () => {
      vi.mocked(prisma.adaptationRule.findMany).mockRejectedValue(
        new Error('Database error')
      );

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data).toEqual({
        success: false,
        error: 'Failed to fetch adaptation rules',
        details: 'Database error',
      });
      expect(logger.error).toHaveBeenCalledWith(
        'Failed to fetch adaptation rules:',
        expect.any(Object)
      );
    });
  });

  describe('POST Endpoint', () => {
    const validRule = {
      name: 'Test Rule',
      description: 'Test description',
      type: 'test',
      conditions: { field: 'value' },
      actions: { action: 'test' },
      priority: RulePriority.MEDIUM,
      enabled: true,
    };

    it('should create rules successfully', async () => {
      const mockCreatedRule = { ...validRule, id: '1', lastTriggered: null };
      vi.mocked(prisma.$transaction).mockResolvedValue([mockCreatedRule]);

      const request = new NextRequest('http://localhost/api/rules', {
        method: 'POST',
        body: JSON.stringify({ rules: [validRule] }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual({
        success: true,
        rules: [mockCreatedRule],
      });
      expect(logger.info).toHaveBeenCalledWith(
        'Created adaptation rules:',
        expect.any(Object)
      );
    });

    it('should validate request schema', async () => {
      const invalidRule = {
        name: 'Test Rule',
        // Missing required fields
      };

      const request = new NextRequest('http://localhost/api/rules', {
        method: 'POST',
        body: JSON.stringify({ rules: [invalidRule] }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data).toEqual({
        success: false,
        error: 'Invalid request format',
        details: expect.any(Object),
      });
    });

    it('should handle empty rules array', async () => {
      const request = new NextRequest('http://localhost/api/rules', {
        method: 'POST',
        body: JSON.stringify({ rules: [] }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual({
        success: true,
        rules: [],
      });
      expect(prisma.$transaction).not.toHaveBeenCalled();
    });

    it('should handle transaction errors', async () => {
      vi.mocked(prisma.$transaction).mockRejectedValue(
        new Error('Transaction failed')
      );

      const request = new NextRequest('http://localhost/api/rules', {
        method: 'POST',
        body: JSON.stringify({ rules: [validRule] }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data).toEqual({
        success: false,
        error: 'Failed to create adaptation rules',
        details: 'Transaction failed',
      });
      expect(logger.error).toHaveBeenCalledWith(
        'Failed to create adaptation rules:',
        expect.any(Object)
      );
    });

    it('should handle invalid JSON in request body', async () => {
      const request = new NextRequest('http://localhost/api/rules', {
        method: 'POST',
        body: 'invalid-json',
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Failed to create adaptation rules');
    });

    it('should validate rule priority enum', async () => {
      const invalidRule = {
        ...validRule,
        priority: 'INVALID_PRIORITY',
      };

      const request = new NextRequest('http://localhost/api/rules', {
        method: 'POST',
        body: JSON.stringify({ rules: [invalidRule] }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Invalid request format');
    });

    it('should handle multiple rules creation', async () => {
      const rules = [
        { ...validRule, name: 'Rule 1' },
        { ...validRule, name: 'Rule 2' },
        { ...validRule, name: 'Rule 3' },
      ];

      const mockCreatedRules = rules.map((rule, index) => ({
        ...rule,
        id: String(index + 1),
        lastTriggered: null,
      }));

      vi.mocked(prisma.$transaction).mockResolvedValue(mockCreatedRules);

      const request = new NextRequest('http://localhost/api/rules', {
        method: 'POST',
        body: JSON.stringify({ rules }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.rules).toHaveLength(3);
      expect(data.rules).toEqual(mockCreatedRules);
    });

    it('should handle optional enabled field with default value', async () => {
      const ruleWithoutEnabled = {
        name: 'Test Rule',
        description: 'Test description',
        type: 'test',
        conditions: { field: 'value' },
        actions: { action: 'test' },
        priority: RulePriority.MEDIUM,
      };

      const mockCreatedRule = {
        ...ruleWithoutEnabled,
        id: '1',
        enabled: true,
        lastTriggered: null,
      };
      vi.mocked(prisma.$transaction).mockResolvedValue([mockCreatedRule]);

      const request = new NextRequest('http://localhost/api/rules', {
        method: 'POST',
        body: JSON.stringify({ rules: [ruleWithoutEnabled] }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.rules[0].enabled).toBe(true);
    });
  });
});

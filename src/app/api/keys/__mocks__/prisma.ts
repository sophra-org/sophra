import { vi } from 'vitest';

export const mockPrisma = {
  apiKey: {
    create: vi.fn(),
    findMany: vi.fn(),
    update: vi.fn(),
    delete: vi.fn()
  }
};

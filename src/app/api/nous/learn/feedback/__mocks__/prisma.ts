// Mock the enums
export const SignalType = {
  SEARCH: 'SEARCH',
  CLICK: 'CLICK',
  HOVER: 'HOVER',
  SCROLL: 'SCROLL',
  COPY: 'COPY',
  FEEDBACK: 'FEEDBACK',
  CUSTOM: 'CUSTOM'
} as const;

export const EngagementType = {
  CLICK: 'CLICK',
  HOVER: 'HOVER',
  SCROLL: 'SCROLL',
  COPY: 'COPY',
  FEEDBACK: 'FEEDBACK',
  CUSTOM: 'CUSTOM'
} as const;

// Mock the Prisma client
export const mockPrisma = {
  feedbackRequest: {
    findMany: vi.fn(),
    create: vi.fn(),
  },
}; 
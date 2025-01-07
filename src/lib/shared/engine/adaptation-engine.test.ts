import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AdaptationEngine } from './adaptation-engine';
import { Logger } from '../types';
import { RuleRegistry } from '../../nous/adapt/rules';
import { NotifyAction } from '../../nous/adapt/actions';

// Mock external modules
vi.mock('../../nous/adapt/actions', () => ({
  NotifyAction: vi.fn().mockImplementation(() => ({
    execute: vi.fn()
  }))
}));

// Mock Prisma client
vi.mock('@prisma/client', async () => {
  const mockEnums = {
    LearningEventType: {
      SYSTEM_STATE: 'SYSTEM_STATE',
      METRIC_THRESHOLD: 'METRIC_THRESHOLD'
    },
    LearningEventStatus: {
      PENDING: 'PENDING',
      COMPLETED: 'COMPLETED'
    },
    LearningEventPriority: {
      LOW: 'LOW',
      MEDIUM: 'MEDIUM',
      HIGH: 'HIGH'
    },
    EngineOperationType: {
      RULE_EVALUATION: 'RULE_EVALUATION',
      PATTERN_DETECTION: 'PATTERN_DETECTION',
      ADAPTATION: 'ADAPTATION'
    },
    EngineOperationStatus: {
      PENDING: 'PENDING',
      COMPLETED: 'COMPLETED'
    }
  };

  return {
    PrismaClient: vi.fn(),
    ...mockEnums,
    Prisma: {
      JsonValue: undefined,
      JsonObject: undefined,
    }
  };
});

describe('AdaptationEngine', () => {
  let adaptationEngine: AdaptationEngine;
  let mockLogger: Logger;
  let mockRuleRegistry: RuleRegistry;
  let mockNotifyAction: NotifyAction;

  beforeEach(() => {
    // Clear all mocks
    vi.clearAllMocks();

    mockLogger = {
      info: vi.fn(),
      debug: vi.fn(),
      error: vi.fn()
    } as unknown as Logger;

    mockRuleRegistry = {
      register: vi.fn(),
      unregister: vi.fn(),
      getRules: vi.fn(),
      executeTriggered: vi.fn()
    } as unknown as RuleRegistry;

    mockNotifyAction = {
      execute: vi.fn(),
      config: {
        title: '',
        message: '',
        severity: 'error'
      },
      logger: mockLogger
    } as unknown as NotifyAction;

    vi.mocked(NotifyAction).mockReturnValue(mockNotifyAction);

    adaptationEngine = new AdaptationEngine(mockLogger, mockRuleRegistry);
  });

  describe('Rule Management', () => {
    it('should add a rule successfully', async () => {
      const { EngineOperationType, EngineOperationStatus } = await import('@prisma/client');
      
      // Arrange
      const operation = {
        id: 'test-operation',
        type: EngineOperationType.RULE_EVALUATION,
        status: EngineOperationStatus.PENDING,
        metadata: { rule: 'test-rule' },
        error: null,
        startTime: new Date(),
        endTime: null,
        metrics: {},
        createdAt: new Date(),
        updatedAt: new Date()
      };

      // Act
      await adaptationEngine.executeOperation(operation);

      // Assert
      expect(mockRuleRegistry.register).toHaveBeenCalled();
      expect(mockLogger.debug).toHaveBeenCalledWith('Adding rule:', 'test-rule');
    });

    it('should detect patterns from events', async () => {
      const { LearningEventType, LearningEventStatus, LearningEventPriority } = await import('@prisma/client');
      
      // Arrange
      const events = [{
        id: 'test-event',
        type: LearningEventType.SYSTEM_STATE,
        status: LearningEventStatus.PENDING,
        priority: LearningEventPriority.MEDIUM,
        timestamp: new Date(),
        metadata: { state: 'critical' },
        error: null,
        processedAt: null,
        correlationId: 'test-correlation',
        sessionId: 'test-session',
        userId: 'test-user',
        clientId: 'test-client',
        environment: 'test',
        version: '1.0.0',
        tags: [],
        retryCount: 0,
        createdAt: new Date(),
        updatedAt: new Date()
      }];

      // Act
      const result = await adaptationEngine.detectPatterns(events);

      // Assert
      expect(result).toBeDefined();
      expect(result.patterns).toBeDefined();
      expect(result.patterns).toHaveLength(1);
      expect(result.patterns[0]).toHaveProperty('type');
      expect(result.patterns[0]).toHaveProperty('features');
    });
  });

  describe('Operation Execution', () => {
    it('should execute operation successfully', async () => {
      const { EngineOperationType, EngineOperationStatus } = await import('@prisma/client');
      
      // Arrange
      const operation = {
        id: 'test-operation',
        type: EngineOperationType.ADAPTATION,
        status: EngineOperationStatus.PENDING,
        metadata: { message: 'test message' },
        error: null,
        startTime: new Date(),
        endTime: null,
        metrics: {},
        createdAt: new Date(),
        updatedAt: new Date()
      };

      // Act
      await adaptationEngine.executeOperation(operation);

      // Assert
      expect(mockRuleRegistry.executeTriggered).toHaveBeenCalled();
      expect(NotifyAction).toHaveBeenCalled();
      expect(mockNotifyAction.execute).toHaveBeenCalled();
    });

    it('should handle operation execution errors', async () => {
      const { EngineOperationType, EngineOperationStatus } = await import('@prisma/client');
      
      // Arrange
      const operation = {
        id: 'test-operation',
        type: EngineOperationType.PATTERN_DETECTION,
        status: EngineOperationStatus.PENDING,
        metadata: {},
        error: null,
        startTime: new Date(),
        endTime: null,
        metrics: {},
        createdAt: new Date(),
        updatedAt: new Date()
      };

      // Act & Assert
      await expect(adaptationEngine.executeOperation(operation)).rejects.toThrow('Unsupported operation type');
    });
  });
});

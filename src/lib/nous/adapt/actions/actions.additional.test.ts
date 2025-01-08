import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  NotifyAction,
  UpdateStateAction,
  CompositeAction,
  ThresholdAdjustmentAction,
  type NotifyActionConfig,
} from './index';
import type { RuleContext } from '../types';
import type { Logger } from '@lib/shared/types';

describe('Actions Additional Tests', () => {
  describe('NotifyAction', () => {
    const mockLogger = {
      info: vi.fn(),
      error: vi.fn(),
      debug: vi.fn(),
      warn: vi.fn(),
      child: vi.fn(),
      service: 'test',
      silent: false,
      format: {},
      levels: {},
    } as unknown as Logger;

    const defaultConfig: NotifyActionConfig = {
      title: 'Test Notification',
      message: 'Test Message',
      severity: 'info',
      channels: ['email', 'slack'],
    };

    const mockContext: RuleContext = {
      timestamp: new Date(),
      eventData: { type: 'test' },
      metrics: { value: 100 },
      systemState: {},
    };

    beforeEach(() => {
      vi.clearAllMocks();
    });

    it('should log notification with context data', () => {
      const action = new NotifyAction(defaultConfig, mockLogger);
      action.execute(mockContext);

      expect(mockLogger.info).toHaveBeenCalledWith(
        'Would send notification:',
        expect.objectContaining({
          ...defaultConfig,
          timestamp: mockContext.timestamp,
          eventData: mockContext.eventData,
          metrics: mockContext.metrics,
        })
      );
    });

    it('should handle different severity levels', () => {
      const configs: NotifyActionConfig[] = [
        { ...defaultConfig, severity: 'info' },
        { ...defaultConfig, severity: 'warning' },
        { ...defaultConfig, severity: 'error' },
      ];

      configs.forEach((config) => {
        const action = new NotifyAction(config, mockLogger);
        action.execute(mockContext);

        expect(mockLogger.info).toHaveBeenCalledWith(
          'Would send notification:',
          expect.objectContaining({
            severity: config.severity,
          })
        );
      });
    });

    it('should handle missing optional channels', () => {
      const configWithoutChannels: NotifyActionConfig = {
        title: 'Test',
        message: 'Test',
        severity: 'info',
      };

      const action = new NotifyAction(configWithoutChannels, mockLogger);
      action.execute(mockContext);

      expect(mockLogger.info).toHaveBeenCalledWith(
        'Would send notification:',
        expect.objectContaining({
          channels: undefined,
        })
      );
    });
  });

  describe('UpdateStateAction', () => {
    it('should update system state with provided updates', () => {
      const updates = {
        status: 'active',
        count: 5,
        nested: { value: true },
      };

      const context: RuleContext = {
        timestamp: new Date(),
        eventData: {},
        metrics: {},
        systemState: {
          existing: 'value',
          count: 0,
        },
      };

      const action = new UpdateStateAction(updates);
      action.execute(context);

      expect(context.systemState).toEqual({
        existing: 'value',
        status: 'active',
        count: 5,
        nested: { value: true },
      });
    });

    it('should handle empty updates', () => {
      const context: RuleContext = {
        timestamp: new Date(),
        eventData: {},
        metrics: {},
        systemState: {
          existing: 'value',
        },
      };

      const action = new UpdateStateAction({});
      action.execute(context);

      expect(context.systemState).toEqual({
        existing: 'value',
      });
    });

    it('should handle nested state updates', () => {
      const updates = {
        nested: {
          deep: {
            value: true,
          },
        },
      };

      const context: RuleContext = {
        timestamp: new Date(),
        eventData: {},
        metrics: {},
        systemState: {
          nested: {
            existing: true,
          },
        },
      };

      const action = new UpdateStateAction(updates);
      action.execute(context);

      expect(context.systemState.nested).toEqual({
        existing: true,
        deep: {
          value: true,
        },
      });
    });
  });

  describe('CompositeAction', () => {
    const mockLogger = {
      info: vi.fn(),
      error: vi.fn(),
      debug: vi.fn(),
      warn: vi.fn(),
      child: vi.fn(),
      service: 'test',
      silent: false,
      format: {},
      levels: {},
    } as unknown as Logger;

    const mockContext: RuleContext = {
      timestamp: new Date(),
      eventData: {},
      metrics: {},
      systemState: {},
    };

    beforeEach(() => {
      vi.clearAllMocks();
    });

    it('should execute all actions in sequence', () => {
      const action1 = { execute: vi.fn() };
      const action2 = { execute: vi.fn() };
      const action3 = { execute: vi.fn() };

      const composite = new CompositeAction([action1, action2, action3], mockLogger);
      composite.execute(mockContext);

      expect(action1.execute).toHaveBeenCalledWith(mockContext);
      expect(action2.execute).toHaveBeenCalledWith(mockContext);
      expect(action3.execute).toHaveBeenCalledWith(mockContext);

      // Verify execution order
      const action1Calls = vi.mocked(action1.execute).mock.invocationCallOrder;
      const action2Calls = vi.mocked(action2.execute).mock.invocationCallOrder;
      const action3Calls = vi.mocked(action3.execute).mock.invocationCallOrder;
      expect(action1Calls[0]).toBeLessThan(action2Calls[0]);
      expect(action2Calls[0]).toBeLessThan(action3Calls[0]);
    });

    it('should continue execution after action failure', () => {
      const action1 = { execute: vi.fn() };
      const failingAction = {
        execute: vi.fn().mockImplementation(() => {
          throw new Error('Action failed');
        }),
      };
      const action3 = { execute: vi.fn() };

      const composite = new CompositeAction([action1, failingAction, action3], mockLogger);
      composite.execute(mockContext);

      expect(action1.execute).toHaveBeenCalled();
      expect(failingAction.execute).toHaveBeenCalled();
      expect(action3.execute).toHaveBeenCalled();
      expect(mockLogger.error).toHaveBeenCalledWith(
        'Action failed:',
        expect.objectContaining({
          error: expect.any(Error),
        })
      );
    });

    it('should handle empty action list', () => {
      const composite = new CompositeAction([], mockLogger);
      expect(() => composite.execute(mockContext)).not.toThrow();
    });
  });

  describe('ThresholdAdjustmentAction', () => {
    const mockLogger = {
      info: vi.fn(),
      error: vi.fn(),
      debug: vi.fn(),
      warn: vi.fn(),
      child: vi.fn(),
      service: 'test',
      silent: false,
      format: {},
      levels: {},
    } as unknown as Logger;

    const mockContext: RuleContext = {
      timestamp: new Date(),
      eventData: {},
      metrics: { testMetric: 100 },
      systemState: {},
    };

    beforeEach(() => {
      vi.clearAllMocks();
    });

    it('should adjust metric value within bounds', () => {
      const action = new ThresholdAdjustmentAction(
        {
          metricName: 'testMetric',
          adjustment: 50,
          minValue: 0,
          maxValue: 200,
        },
        mockLogger
      );

      action.execute(mockContext);

      expect(mockContext.metrics.testMetric).toBe(150);
      expect(mockLogger.info).toHaveBeenCalledWith(
        'Adjusted testMetric',
        expect.objectContaining({
          from: 100,
          to: 150,
        })
      );
    });

    it('should respect minimum value', () => {
      const action = new ThresholdAdjustmentAction(
        {
          metricName: 'testMetric',
          adjustment: -150,
          minValue: 0,
        },
        mockLogger
      );

      action.execute(mockContext);

      expect(mockContext.metrics.testMetric).toBe(0);
    });

    it('should respect maximum value', () => {
      const action = new ThresholdAdjustmentAction(
        {
          metricName: 'testMetric',
          adjustment: 150,
          maxValue: 200,
        },
        mockLogger
      );

      action.execute(mockContext);

      expect(mockContext.metrics.testMetric).toBe(200);
    });

    it('should handle non-existent metrics', () => {
      const action = new ThresholdAdjustmentAction(
        {
          metricName: 'nonExistentMetric',
          adjustment: 50,
        },
        mockLogger
      );

      action.execute(mockContext);

      expect(mockContext.metrics.nonExistentMetric).toBe(50);
    });

    it('should handle negative adjustments', () => {
      const action = new ThresholdAdjustmentAction(
        {
          metricName: 'testMetric',
          adjustment: -25,
        },
        mockLogger
      );

      action.execute(mockContext);

      expect(mockContext.metrics.testMetric).toBe(75);
    });

    it('should handle zero adjustments', () => {
      const action = new ThresholdAdjustmentAction(
        {
          metricName: 'testMetric',
          adjustment: 0,
        },
        mockLogger
      );

      action.execute(mockContext);

      expect(mockContext.metrics.testMetric).toBe(100);
      expect(mockLogger.info).toHaveBeenCalledWith(
        'Adjusted testMetric',
        expect.objectContaining({
          from: 100,
          to: 100,
        })
      );
    });
  });
});

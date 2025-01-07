import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BaseEngine } from './base-engine';
import { BaseProcessor } from './processors';
import { Logger } from '../types';

describe('BaseEngine', () => {
  let baseEngine: BaseEngine;
  let mockLogger: Logger;
  let mockProcessor1: BaseProcessor;
  let mockProcessor2: BaseProcessor;
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    consoleErrorSpy = vi.spyOn(console, 'error');

    mockLogger = {
      info: vi.fn(),
      debug: vi.fn(),
      error: vi.fn()
    } as unknown as Logger;

    mockProcessor1 = {
      process: vi.fn()
    } as unknown as BaseProcessor;

    mockProcessor2 = {
      process: vi.fn()
    } as unknown as BaseProcessor;

    baseEngine = new BaseEngine(mockLogger);
  });

  describe('Processor Management', () => {
    it('should register a processor successfully', () => {
      // Act
      baseEngine.registerProcessor(mockProcessor1);

      // Assert
      expect((baseEngine as any).processors).toContain(mockProcessor1);
    });

    it('should register multiple processors', () => {
      // Act
      baseEngine.registerProcessor(mockProcessor1);
      baseEngine.registerProcessor(mockProcessor2);

      // Assert
      expect((baseEngine as any).processors).toHaveLength(2);
      expect((baseEngine as any).processors).toContain(mockProcessor1);
      expect((baseEngine as any).processors).toContain(mockProcessor2);
    });

    it('should unregister a processor successfully', () => {
      // Arrange
      baseEngine.registerProcessor(mockProcessor1);
      baseEngine.registerProcessor(mockProcessor2);

      // Act
      baseEngine.unregisterProcessor(mockProcessor1);

      // Assert
      expect((baseEngine as any).processors).not.toContain(mockProcessor1);
      expect((baseEngine as any).processors).toContain(mockProcessor2);
    });

    it('should handle unregistering a non-existent processor', () => {
      // Arrange
      baseEngine.registerProcessor(mockProcessor1);

      // Act
      baseEngine.unregisterProcessor(mockProcessor2);

      // Assert
      expect((baseEngine as any).processors).toHaveLength(1);
      expect((baseEngine as any).processors).toContain(mockProcessor1);
    });
  });

  describe('Engine Run', () => {
    it('should run all processors successfully', async () => {
      // Arrange
      baseEngine.registerProcessor(mockProcessor1);
      baseEngine.registerProcessor(mockProcessor2);

      // Act
      await baseEngine.run();

      // Assert
      expect(mockProcessor1.process).toHaveBeenCalledTimes(1);
      expect(mockProcessor2.process).toHaveBeenCalledTimes(1);
    });

    it('should continue processing even if one processor fails', async () => {
      // Arrange
      const error = new Error('Process failed');
      vi.mocked(mockProcessor1.process).mockRejectedValueOnce(error);
      baseEngine.registerProcessor(mockProcessor1);
      baseEngine.registerProcessor(mockProcessor2);

      // Act
      await baseEngine.run();

      // Assert
      expect(mockProcessor1.process).toHaveBeenCalledTimes(1);
      expect(mockProcessor2.process).toHaveBeenCalledTimes(1);
      expect(consoleErrorSpy).toHaveBeenCalledWith('Error running processor:', error);
    });

    it('should run successfully with no processors', async () => {
      // Act
      await baseEngine.run();

      // Assert
      expect((baseEngine as any).processors).toHaveLength(0);
    });

    it('should run processors in registration order', async () => {
      // Arrange
      const executionOrder: number[] = [];
      vi.mocked(mockProcessor1.process).mockImplementation(async () => {
        executionOrder.push(1);
      });
      vi.mocked(mockProcessor2.process).mockImplementation(async () => {
        executionOrder.push(2);
      });

      baseEngine.registerProcessor(mockProcessor1);
      baseEngine.registerProcessor(mockProcessor2);

      // Act
      await baseEngine.run();

      // Assert
      expect(executionOrder).toEqual([1, 2]);
    });
  });
});

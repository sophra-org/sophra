import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest';
import { EventEmitter, type DocumentEvent, type DocumentEventType } from './emitter';
import type { BaseDocument } from '@/lib/cortex/elasticsearch/types';

interface TestDocument extends BaseDocument {
  title: string;
  content: string;
}

describe('EventEmitter', () => {
  let emitter: EventEmitter;
  let mockHandler: Mock;
  let testEvent: DocumentEvent<TestDocument>;

  beforeEach(() => {
    emitter = new EventEmitter();
    mockHandler = vi.fn();
    testEvent = {
      type: 'document.created',
      index: 'test-index',
      id: 'test-id',
      document: {
        id: 'test-id',
        title: 'Test Document',
        content: 'Test content',
        abstract: '',
        authors: [],
        source: '',
        tags: [],
        metadata: {},
        processing_status: 'pending',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
        embeddings: [],
        evaluationScore: {
          actionability: 0,
          aggregate: 0,
          clarity: 0,
          credibility: 0,
          relevance: 0,
        },
        evaluation_score: {
          actionability: 0,
          aggregate: 0,
          clarity: 0,
          credibility: 0,
          relevance: 0,
        },
        type: 'test'
      },
      timestamp: new Date('2024-01-01T00:00:00Z'),
    };
  });

  describe('emit', () => {
    it('should emit events to registered listeners', () => {
      emitter.on('document.created', mockHandler);
      const result = emitter.emit(testEvent);

      expect(result).toBe(true);
      expect(mockHandler).toHaveBeenCalledWith(testEvent);
      expect(mockHandler).toHaveBeenCalledTimes(1);
    });

    it('should return false when no listeners are registered', () => {
      const result = emitter.emit(testEvent);
      expect(result).toBe(false);
      expect(mockHandler).not.toHaveBeenCalled();
    });

    it('should handle multiple event types', () => {
      const createHandler = vi.fn();
      const updateHandler = vi.fn();
      const deleteHandler = vi.fn();

      emitter.on('document.created', createHandler);
      emitter.on('document.updated', updateHandler);
      emitter.on('document.deleted', deleteHandler);

      const events: Array<DocumentEventType> = [
        'document.created',
        'document.updated',
        'document.deleted'
      ];

      events.forEach(type => {
        const event = { ...testEvent, type };
        emitter.emit(event);
      });

      expect(createHandler).toHaveBeenCalledTimes(1);
      expect(updateHandler).toHaveBeenCalledTimes(1);
      expect(deleteHandler).toHaveBeenCalledTimes(1);
    });

    it('should handle events without document data', () => {
      const eventWithoutDoc = {
        type: 'document.deleted' as DocumentEventType,
        index: 'test-index',
        id: 'test-id',
        timestamp: new Date('2024-01-01T00:00:00Z'),
      };

      emitter.on('document.deleted', mockHandler);
      const result = emitter.emit(eventWithoutDoc);

      expect(result).toBe(true);
      expect(mockHandler).toHaveBeenCalledWith(eventWithoutDoc);
    });
  });

  describe('on', () => {
    it('should register event listeners', () => {
      const listener = emitter.on('document.created', mockHandler);
      expect(listener).toBeDefined();
      
      emitter.emit(testEvent);
      expect(mockHandler).toHaveBeenCalledWith(testEvent);
    });

    it('should handle multiple listeners for the same event', () => {
      const handler1 = vi.fn();
      const handler2 = vi.fn();

      emitter.on('document.created', handler1);
      emitter.on('document.created', handler2);

      emitter.emit(testEvent);

      expect(handler1).toHaveBeenCalledWith(testEvent);
      expect(handler2).toHaveBeenCalledWith(testEvent);
    });

    it('should maintain separate listeners for different event types', () => {
      const createHandler = vi.fn();
      const updateHandler = vi.fn();

      emitter.on('document.created', createHandler);
      emitter.on('document.updated', updateHandler);

      const createEvent = testEvent;
      const updateEvent = { ...testEvent, type: 'document.updated' as DocumentEventType };

      emitter.emit(createEvent);
      emitter.emit(updateEvent);

      expect(createHandler).toHaveBeenCalledWith(createEvent);
      expect(createHandler).not.toHaveBeenCalledWith(updateEvent);
      expect(updateHandler).toHaveBeenCalledWith(updateEvent);
      expect(updateHandler).not.toHaveBeenCalledWith(createEvent);
    });

    it('should handle schema update events', () => {
      const schemaHandler = vi.fn();
      emitter.on('schema.updated', schemaHandler);

      const schemaEvent: DocumentEvent<TestDocument> = {
        type: 'schema.updated',
        index: 'test-index',
        id: 'schema-version-1',
        metadata: {
          id: 'schema-version-1',
          version: 1,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z'
        },
        timestamp: new Date('2024-01-01T00:00:00Z'),
      };

      emitter.emit(schemaEvent);
      expect(schemaHandler).toHaveBeenCalledWith(schemaEvent);
    });
  });
}); 
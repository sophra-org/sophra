import { describe, it, expectTypeOf } from 'vitest';
import type { Session, Conversation, Message } from './session';

describe('Session Types', () => {
  describe('Session', () => {
    it('should validate Session structure', () => {
      expectTypeOf<Session>().toMatchTypeOf<{
        id: string;
        userId: string | null;
        startedAt: Date;
        lastActiveAt: Date;
        createdAt: Date;
        updatedAt: Date;
        metadata: Record<string, unknown>;
      }>();
    });

    it('should allow metadata with any value type', () => {
      const session: Session = {
        id: '123',
        userId: 'user123',
        startedAt: new Date(),
        lastActiveAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
        metadata: {
          stringValue: 'test',
          numberValue: 123,
          booleanValue: true,
          objectValue: { key: 'value' },
          arrayValue: [1, 2, 3],
        },
      };

      expectTypeOf(session).toMatchTypeOf<Session>();
    });
  });

  describe('Conversation', () => {
    it('should validate Conversation structure', () => {
      expectTypeOf<Conversation>().toMatchTypeOf<{
        id: string;
        sessionId: string;
        title?: string;
        messages: Message[];
        context?: {
          relevantDocuments?: string[];
          searchQueries?: string[];
          metadata?: Record<string, unknown>;
        };
        createdAt: Date;
        updatedAt: Date;
      }>();
    });

    it('should allow optional fields to be undefined', () => {
      const conversation: Conversation = {
        id: '123',
        sessionId: 'session123',
        messages: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      expectTypeOf(conversation).toMatchTypeOf<Conversation>();
    });

    it('should validate conversation with all fields', () => {
      const conversation: Conversation = {
        id: '123',
        sessionId: 'session123',
        title: 'Test Conversation',
        messages: [
          {
            id: 'msg1',
            conversationId: '123',
            role: 'user',
            content: 'Hello',
            timestamp: new Date(),
          },
        ],
        context: {
          relevantDocuments: ['doc1', 'doc2'],
          searchQueries: ['query1'],
          metadata: {
            source: 'web',
            priority: 'high',
          },
        },
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      expectTypeOf(conversation).toMatchTypeOf<Conversation>();
    });
  });

  describe('Message', () => {
    it('should validate Message structure', () => {
      expectTypeOf<Message>().toMatchTypeOf<{
        id: string;
        conversationId: string;
        role: "user" | "assistant" | "system";
        content: string;
        timestamp: Date;
        metadata?: {
          citations?: string[];
          searchQuery?: string;
          relevanceScore?: number;
        };
      }>();
    });

    it('should validate message role values', () => {
      const userMessage: Message = {
        id: '1',
        conversationId: '123',
        role: 'user',
        content: 'Hello',
        timestamp: new Date(),
      };

      const assistantMessage: Message = {
        id: '2',
        conversationId: '123',
        role: 'assistant',
        content: 'Hi there!',
        timestamp: new Date(),
      };

      const systemMessage: Message = {
        id: '3',
        conversationId: '123',
        role: 'system',
        content: 'Session started',
        timestamp: new Date(),
      };

      expectTypeOf(userMessage).toMatchTypeOf<Message>();
      expectTypeOf(assistantMessage).toMatchTypeOf<Message>();
      expectTypeOf(systemMessage).toMatchTypeOf<Message>();
    });

    it('should validate message with metadata', () => {
      const message: Message = {
        id: '1',
        conversationId: '123',
        role: 'assistant',
        content: 'Based on the documentation...',
        timestamp: new Date(),
        metadata: {
          citations: ['doc1', 'doc2'],
          searchQuery: 'documentation about X',
          relevanceScore: 0.95,
        },
      };

      expectTypeOf(message).toMatchTypeOf<Message>();
    });
  });
}); 
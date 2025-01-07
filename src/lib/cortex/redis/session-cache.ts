import type { BaseServiceConfig } from "@/lib/cortex/core/services";
import { BaseService } from "@/lib/cortex/core/services";
import type {
  Conversation,
  Message,
  Session,
} from "@/lib/cortex/types/session";
import type { RedisClient } from "./client";

interface SessionCacheConfig extends BaseServiceConfig {
  client: RedisClient;
}

/**
 * 🎭 Session Cache Service: Your Conversation Memory Keeper!
 *
 * This service helps remember user sessions and conversations.
 * Like a friendly elephant 🐘 that never forgets your chats!
 *
 * Features:
 * - 🗣️ Conversation tracking
 * - 👤 Session management
 * - 💌 Message storage
 * - ⏰ Activity tracking
 * - 🔐 Secure data handling
 *
 * @class SessionCacheService
 * @extends {BaseService}
 */

export class SessionCacheService extends BaseService {
  protected readonly client: RedisClient;
  private readonly sessionPrefix = "session:";
  private readonly conversationPrefix = "conversation:";
  private readonly sessionTTL = 24 * 60 * 60; // 24 hours

  constructor(config: SessionCacheConfig) {
    super(config);
    this.client = config.client;
  }

  /**
   * 🔍 Find a Session
   *
   * Looks up a user's session by ID.
   * Like finding your saved game progress! 🎮
   *
   * @param {string} sessionId - The session to find
   * @returns {Promise<Session | null>} The session if found
   */
  async getSession(sessionId: string): Promise<Session | null> {
    return this.get<Session>(`${this.sessionPrefix}${sessionId}`);
  }

  /**
   * 💾 Save a Session
   *
   * Stores a user's session for later.
   * Like taking a snapshot of your game progress! 📸
   *
   * @param {Session} session - The session to save
   * @throws {Error} If session data is invalid
   */
  async setSession(session: Session): Promise<void> {
    if (!session || !session.id) {
      throw new Error("Invalid session data");
    }

    try {
      await this.set(
        `${this.sessionPrefix}${session.id}`,
        {
          ...session,
          lastActiveAt: new Date(),
          metadata: session.metadata || {},
        },
        this.sessionTTL
      );
    } catch (error) {
      this.logger.error("Failed to set session in cache", {
        error,
        sessionId: session.id,
      });
      throw error;
    }
  }

  /**
   * 📜 Get a Conversation
   *
   * Retrieves a stored conversation history.
   * Like opening up an old chat log! 💭
   *
   * @param {string} conversationId - Which conversation to find
   * @returns {Promise<Conversation | null>} The conversation if found
   */
  async getConversation(conversationId: string): Promise<Conversation | null> {
    return this.get<Conversation>(
      `${this.conversationPrefix}${conversationId}`
    );
  }

  /**
   * 💌 Add a New Message
   *
   * Adds a message to an existing conversation.
   * Like adding a new page to your diary! 📖
   *
   * @param {string} conversationId - Which conversation to update
   * @param {Message} message - The new message to add
   */
  async addMessage(conversationId: string, message: Message): Promise<void> {
    const conversation = await this.getConversation(conversationId);
    if (conversation) {
      conversation.messages.push(message);
      conversation.updatedAt = new Date();
      await this.setConversation(conversation);
    }
  }

  /**
   * ⏰ Update Session Activity
   *
   * Marks when a user was last active.
   * Like updating your "last seen" status! 👀
   *
   * @param {string} sessionId - Which session to update
   */
  async updateSessionActivity(sessionId: string): Promise<void> {
    const session = await this.getSession(sessionId);
    if (session) {
      session.lastActiveAt = new Date();
      await this.setSession(session);
    }
  }

  /**
   * 🏥 Check Service Health
   *
   * Makes sure the service is working properly.
   * Like a quick health checkup! 🩺
   *
   * @returns {Promise<boolean>} true if healthy
   */
  async healthCheck(): Promise<boolean> {
    return this.client.ping();
  }

  /**
   * 👋 Disconnect Service
   *
   * Safely closes all connections.
   * Like saying goodbye after a chat! 💫
   */
  async disconnect(): Promise<void> {
    await this.client.disconnect();
  }

  protected async set<T>(key: string, value: T, ttl?: number): Promise<void> {
    if (!key || !value) {
      throw new Error("Key and value are required");
    }

    try {
      const serialized = JSON.stringify(value);
      const client = this.client.getClient();

      if (!client) {
        throw new Error("Redis client not initialized");
      }

      if (ttl) {
        await client.set(key, serialized, "EX", ttl);
      } else {
        await client.set(key, serialized);
      }
    } catch (error) {
      this.logger.error("Failed to set cache", {
        key,
        error,
        errorType: error instanceof Error ? error.name : typeof error,
        message: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  protected async get<T>(key: string): Promise<T | null> {
    if (!key) {
      throw new Error("Key is required");
    }

    try {
      const client = this.client.getClient();

      if (!client) {
        throw new Error("Redis client not initialized");
      }

      const value = await client.get(key);
      if (!value) {
        return null;
      }

      try {
        return JSON.parse(value);
      } catch (parseError) {
        this.logger.error("Failed to parse cached value", {
          key,
          error: parseError,
          value,
        });
        return null;
      }
    } catch (error) {
      this.logger.error("Failed to get cache", {
        key,
        error,
        errorType: error instanceof Error ? error.name : typeof error,
        message: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  async setConversation(conversation: Conversation): Promise<void> {
    await this.set(
      `${this.conversationPrefix}${conversation.id}`,
      conversation,
      this.sessionTTL
    );
  }
}

import { nanoid } from 'nanoid';
import type { RedisClient } from '@/lib/cortex/redis/client';
import type { Logger } from '@/lib/shared/types';

export interface SessionConfig {
  userId: string;
  metadata?: Record<string, any>;
}

export interface Session {
  id: string;
  userId: string;
  createdAt: string;
  expiresAt: string;
  metadata?: Record<string, any>;
}

export class SessionService {
  private readonly redis: RedisClient;
  private readonly logger: Logger;
  private readonly environment: string;
  private readonly defaultTTL = 3600; // 1 hour

  constructor(config: {
    redis: RedisClient;
    logger: Logger;
    environment: string;
  }) {
    this.redis = config.redis;
    this.logger = config.logger;
    this.environment = config.environment;
  }

  async createSession(config: SessionConfig): Promise<Session> {
    try {
      const session: Session = {
        id: nanoid(),
        userId: config.userId,
        createdAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + this.defaultTTL * 1000).toISOString(),
        metadata: config.metadata || {},
      };

      await this.redis.setEx(
        `session:${session.id}`,
        this.defaultTTL,
        JSON.stringify(session)
      );

      this.logger.debug('Created new session', { sessionId: session.id });
      return session;
    } catch (error) {
      this.logger.error('Failed to create session', { error });
      throw error;
    }
  }

  async getSession(sessionId: string): Promise<Session | null> {
    try {
      const data = await this.redis.get(`session:${sessionId}`);
      if (!data) {
        return null;
      }

      const session = JSON.parse(data) as Session;
      return session;
    } catch (error) {
      this.logger.error('Failed to get session', { error, sessionId });
      return null;
    }
  }

  async validateSession(sessionId: string): Promise<boolean> {
    try {
      const session = await this.getSession(sessionId);
      if (!session) {
        return false;
      }

      const now = new Date();
      const expiresAt = new Date(session.expiresAt);

      if (now > expiresAt) {
        await this.redis.del(`session:${sessionId}`);
        return false;
      }

      return true;
    } catch (error) {
      this.logger.error('Failed to validate session', { error, sessionId });
      return false;
    }
  }

  async extendSession(sessionId: string, duration: number): Promise<boolean> {
    try {
      const session = await this.getSession(sessionId);
      if (!session) {
        throw new Error('Session not found');
      }

      session.expiresAt = new Date(Date.now() + duration * 1000).toISOString();
      
      await this.redis.setEx(
        `session:${sessionId}`,
        duration,
        JSON.stringify(session)
      );

      return true;
    } catch (error) {
      this.logger.error('Failed to extend session', { error, sessionId });
      throw error;
    }
  }
}

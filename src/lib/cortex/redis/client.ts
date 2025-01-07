import type { Logger } from "@/lib/shared/types";
import type { Redis } from "ioredis";

/**
 * ⚡ Redis Client: Your Speed-Boosting Helper!
 *
 * This client helps you work with Redis, our super-fast cache.
 * Like having a helper who can instantly remember and fetch things! 🏃‍♂️
 *
 * Features:
 * - 🚀 Lightning-fast storage
 * - ⏰ Automatic expiration
 * - 🏥 Health monitoring
 * - 🔌 Connection management
 *
 * @class RedisClient
 */
export class RedisClient {
  protected readonly logger: Logger;
  protected readonly client: Redis;
  protected readonly defaultTTL: number = 3600; // 1 hour default TTL

  /**
   * 🎒 Sets Up Your Speed Booster
   *
   * Gets Redis ready to help make your app faster.
   * Like hiring a super-fast assistant! 🚀
   *
   * @param {Redis} client - The Redis connection
   * @param {Logger} logger - Our note-taker
   */
  constructor(client: Redis, logger: Logger) {
    this.client = client;
    this.logger = logger;
  }

  /**
   * ⏰ Stores Data with Expiration
   *
   * Saves something in Redis that will disappear after some time.
   * Like writing a message that fades away! ✨
   *
   * @param {string} key - Where to store it
   * @param {number} ttl - How long to keep it (seconds)
   * @param {string} value - What to store
   * @throws {Error} If something goes wrong
   */
  async setEx(key: string, ttl: number, value: string): Promise<void> {
    try {
      // Ensure TTL is a positive integer
      const validTTL = Math.max(1, Math.floor(ttl || this.defaultTTL));
      await this.client.setex(key, validTTL, value);
    } catch (error) {
      this.logger.error("Redis setEx failed", { key, ttl, error });
      throw error;
    }
  }

  /**
   * 🔍 Gets Data with Expiration Check
   *
   * Retrieves something from Redis if it hasn't expired.
   * Like checking if a message is still visible! 👀
   *
   * @param {string} key - What to look for
   * @returns {Promise<string | null>} The value if found
   * @throws {Error} If something goes wrong
   */
  async getEx(key: string): Promise<string | null> {
    try {
      return await this.client.get(key);
    } catch (error) {
      this.logger.error("Redis getEx failed", { key, error });
      throw error;
    }
  }

  /**
   * 🔌 Gets Raw Redis Client
   *
   * Provides direct access to Redis for advanced operations.
   * Like getting the master key to everything! 🔑
   *
   * @returns {Redis} The Redis client
   */
  getClient(): Redis {
    return this.client;
  }

  /**
   * 🏥 Checks Redis Health
   *
   * Makes sure Redis is responding properly.
   * Like checking if your assistant is awake! 👋
   *
   * @returns {Promise<boolean>} true if healthy
   */
  async ping(): Promise<boolean> {
    try {
      const result = await this.client.ping();
      return result === "PONG";
    } catch (error) {
      this.logger.error("Redis ping failed", { error });
      return false;
    }
  }

  /**
   * 👋 Says Goodbye to Redis
   *
   * Safely closes the Redis connection.
   * Like letting your assistant go home! 🏃‍♂️
   *
   * @returns {Promise<void>} When disconnection is complete
   * @throws {Error} If disconnection fails
   */
  async disconnect(): Promise<void> {
    try {
      await this.client.quit();
    } catch (error) {
      this.logger.error("Redis disconnect failed", { error });
      throw error;
    }
  }

  /**
   * 🗑️ Removes Data
   *
   * Deletes something from Redis.
   * Like erasing a message from a whiteboard! 🧹
   *
   * @param {string} key - What to remove
   * @throws {Error} If deletion fails
   */
  async del(key: string): Promise<void> {
    try {
      await this.client.del(key);
    } catch (error) {
      this.logger.error("Redis del failed", { key, error });
      throw error;
    }
  }

  /**
   * 🔍 Checks if Data Exists
   *
   * Sees if something is stored in Redis.
   * Like checking if a message is on the board! 👀
   *
   * @param {string} key - What to look for
   * @returns {Promise<boolean>} true if found
   * @throws {Error} If check fails
   */
  async exists(key: string): Promise<boolean> {
    try {
      const result = await this.client.exists(key);
      return result === 1;
    } catch (error) {
      this.logger.error("Redis exists failed", { key, error });
      throw error;
    }
  }
}

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { createElasticsearchConfig } from './core';

describe('Elasticsearch Core', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = {
      ...originalEnv,
      ELASTICSEARCH_URL: 'http://localhost:9200',
    };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('createElasticsearchConfig', () => {
    it('should create config with URL only when no API key provided', () => {
      const config = createElasticsearchConfig();

      expect(config).toEqual({
        node: 'http://localhost:9200',
      });
      expect(config.auth).toBeUndefined();
    });

    it('should create config with base64 encoded API key when key contains colon', () => {
      process.env.SOPHRA_ES_API_KEY = 'user:pass';

      const config = createElasticsearchConfig();

      expect(config).toEqual({
        node: 'http://localhost:9200',
        auth: {
          apiKey: Buffer.from('user:pass').toString('base64'),
        },
      });
    });

    it('should create config with raw API key when key does not contain colon', () => {
      process.env.SOPHRA_ES_API_KEY = 'api-key-123';

      const config = createElasticsearchConfig();

      expect(config).toEqual({
        node: 'http://localhost:9200',
        auth: {
          apiKey: 'api-key-123',
        },
      });
    });

    it('should throw error when ELASTICSEARCH_URL is missing', () => {
      delete process.env.ELASTICSEARCH_URL;

      expect(() => createElasticsearchConfig()).toThrow(
        'ELASTICSEARCH_URL environment variable is required'
      );
    });
  });
}); 
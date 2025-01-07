import { describe, it, expect } from 'vitest';
import { buildTextQuery } from './query-builders';

describe('Elasticsearch Query Builders', () => {
  describe('buildTextQuery', () => {
    it('should build basic text query with defaults', () => {
      const textQuery = {
        query: 'test search',
        fields: ['title^2', 'content', 'abstract']
      };

      const query = buildTextQuery(textQuery);
      expect(query).toEqual({
        multi_match: {
          query: 'test search',
          fields: ['title^2', 'content', 'abstract'],
          fuzziness: 'AUTO',
          operator: 'OR'
        }
      });
    });

    it('should build text query with custom fields and settings', () => {
      const textQuery = {
        query: 'test search',
        fields: ['title^3', 'description'],
        fuzziness: '2' as '2',
        operator: 'AND' as 'AND'
      };

      const query = buildTextQuery(textQuery);
      expect(query).toEqual({
        multi_match: {
          query: 'test search',
          fields: ['title^3', 'description'],
          fuzziness: '2',
          operator: 'AND'
        }
      });
    });
  });
}); 
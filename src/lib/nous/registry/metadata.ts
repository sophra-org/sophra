import { z } from 'zod';

export interface MetadataSchema {
  requiredFields: string[];
  optionalFields: string[];
  fieldTypes: Record<string, z.ZodType>;
  validators: Record<string, ((value: unknown) => boolean)[]>;
}

export class MetadataManager {
  private schemas: Map<string, MetadataSchema> = new Map();
  private metadataStore: Map<string, Record<string, unknown>> = new Map();

  registerSchema(schemaName: string, schema: MetadataSchema): void {
    this.schemas.set(schemaName, schema);
  }

  validateMetadata(schemaName: string, metadata: Record<string, unknown>): boolean {
    const schema = this.schemas.get(schemaName);
    if (!schema) {
      throw new Error(`Schema ${schemaName} not found`);
    }

    // Check required fields
    for (const field of schema.requiredFields) {
      if (!(field in metadata)) {
        return false;
      }
    }

    // Validate field types
    for (const [field, value] of Object.entries(metadata)) {
      const fieldType = schema.fieldTypes[field];
      if (fieldType) {
        try {
          fieldType.parse(value);
        } catch {
          return false;
        }
      }
    }

    // Run custom validators
    for (const [field, validators] of Object.entries(schema.validators)) {
      if (field in metadata) {
        if (!validators.every(validator => validator(metadata[field]))) {
          return false;
        }
      }
    }

    return true;
  }

  storeMetadata(
    entryId: string,
    metadata: Record<string, unknown>,
    schemaName?: string
  ): void {
    if (schemaName && !this.validateMetadata(schemaName, metadata)) {
      throw new Error('Metadata validation failed');
    }

    this.metadataStore.set(entryId, {
      ...metadata,
      lastUpdated: new Date().toISOString()
    });
  }

  getMetadata(entryId: string): Record<string, unknown> | undefined {
    return this.metadataStore.get(entryId);
  }

  updateMetadata(
    entryId: string,
    updates: Record<string, unknown>,
    schemaName?: string
  ): boolean {
    const current = this.metadataStore.get(entryId);
    if (!current) return false;

    const updated = {
      ...current,
      ...updates,
      lastUpdated: new Date().toISOString()
    };

    if (schemaName && !this.validateMetadata(schemaName, updated)) {
      return false;
    }

    this.metadataStore.set(entryId, updated);
    return true;
  }

  deleteMetadata(entryId: string): boolean {
    return this.metadataStore.delete(entryId);
  }

  listMetadata(filterFn?: (metadata: Record<string, unknown>) => boolean): Record<string, Record<string, unknown>> {
    const entries = Array.from(this.metadataStore.entries());
    if (filterFn) {
      return Object.fromEntries(
        entries.filter(([_, metadata]) => filterFn(metadata))
      );
    }
    return Object.fromEntries(entries);
  }
}
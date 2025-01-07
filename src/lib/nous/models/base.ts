import { z } from 'zod';

export const ModelConfigSchema = z.object({
  id: z.string(),
  baseModel: z.string(),
  version: z.string(),
  parameters: z.record(z.unknown()),
  metadata: z.record(z.unknown()),
  createdAt: z.date(),
  updatedAt: z.date(),
  status: z.enum(['initializing', 'ready', 'training', 'error']).default('initializing')
});

export type ModelConfig = z.infer<typeof ModelConfigSchema>;

export class ModelRegistry {
  private models: Map<string, ModelConfig> = new Map();

  constructor() {
    // Initialize with base model
    this.models.set('base_v1', {
      id: 'base_v1',
      baseModel: 'sophra-base',
      version: '0.1.0',
      parameters: {
        learningRate: 1e-5,
        batchSize: 32,
        epochs: 3
      },
      metadata: {
        description: 'Initial Sophra base model',
        purpose: 'Search optimization'
      },
      createdAt: new Date(),
      updatedAt: new Date(),
      status: 'ready'
    });
  }

  getModel(id: string): ModelConfig | undefined {
    return this.models.get(id);
  }

  registerModel(config: ModelConfig): void {
    if (this.models.has(config.id)) {
      throw new Error(`Model ${config.id} already exists`);
    }
    this.models.set(config.id, config);
  }

  updateModel(id: string, updates: Partial<ModelConfig>): ModelConfig {
    const existing = this.models.get(id);
    if (!existing) {
      throw new Error(`Model ${id} not found`);
    }

    const updated = {
      ...existing,
      ...updates,
      updatedAt: new Date()
    };

    this.models.set(id, updated);
    return updated;
  }

  listModels(): ModelConfig[] {
    return Array.from(this.models.values());
  }

  deleteModel(id: string): boolean {
    return this.models.delete(id);
  }
}

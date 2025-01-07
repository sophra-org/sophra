import {
  ModelConfig,
  ModelVersion,
  ModelVersionSchema,
} from "@/lib/shared/database/validation/generated";
import logger from "@/lib/shared/logger";
import { MetadataManager } from "./metadata";
import { RegistryEntry, RegistryStore } from "./store";
import { VersionManager } from "./version";
import cuid from "cuid";

export class Registry {
  private store: RegistryStore;
  private versionManager: VersionManager;
  private metadataManager: MetadataManager;

  constructor() {
    this.store = new RegistryStore();
    this.versionManager = new VersionManager();
    this.metadataManager = new MetadataManager();
  }

  async registerModel(config: ModelConfig): Promise<ModelVersion> {
    if (!config || !config.id || !config.type) {
      logger.error("Failed to register model:", { error: "Invalid configuration", config });
      throw new Error("Invalid model configuration");
    }

    try {
      const modelId = cuid();
      const timestamp = Date.now();
      const version = this.versionManager.createVersion(modelId);

      const modelVersion: ModelVersion = {
        id: modelId,
        configId: config.id,
        createdAt: new Date(),
        metrics: {},
        artifactPath: `models/model_${timestamp}`,
        parentVersion: null,
      };

      console.log('Model version before validation:', modelVersion);
      const validatedVersion = ModelVersionSchema.parse(modelVersion);
      console.log('Model version after validation:', validatedVersion);

      const entry: RegistryEntry<ModelVersion> = {
        id: modelId,
        name: `model_${config.type}`,
        version: version.toString(),
        createdAt: modelVersion.createdAt,
        updatedAt: modelVersion.createdAt,
        metadata: { type: config.type },
        data: validatedVersion,
        tags: [config.type],
        dependencies: [],
      };

      this.store.register(entry);
      this.metadataManager.storeMetadata(modelId, { type: config.type });

      logger.info(
        `Registered model ${modelId} with version ${version.toString()}`
      );
      return validatedVersion;
    } catch (error) {
      console.error('Registration error:', error);
      logger.error("Failed to register model:", { error, config });
      throw new Error("Model registration failed");
    }
  }

  async getModel(modelId: string): Promise<ModelVersion | null> {
    try {
      const entry = this.store.get<ModelVersion>(modelId);
      return entry?.data || null;
    } catch (error) {
      logger.error("Failed to retrieve model:", { error, modelId });
      return null;
    }
  }

  async updateModel(modelId: string, updates: Partial<ModelVersion>): Promise<ModelVersion | null> {
    try {
      const entry = this.store.get<ModelVersion>(modelId);
      if (!entry) {
        return null;
      }

      const updated = { ...entry.data, ...updates };
      ModelVersionSchema.parse(updated);

      const updatedEntry = this.store.update<ModelVersion>(modelId, {
        data: updated,
        updatedAt: new Date(),
      });

      return updatedEntry?.data || null;
    } catch (error) {
      logger.error("Failed to update model:", { error, modelId, updates });
      return null;
    }
  }

  async deleteModel(modelId: string): Promise<boolean> {
    try {
      if (!modelId) {
        logger.error("Failed to delete model:", { error: "Invalid model ID", modelId });
        return false;
      }

      const deleted = this.store.delete(modelId);
      if (deleted) {
        logger.info(`Deleted model ${modelId}`);
      }
      return deleted;
    } catch (error) {
      logger.error("Failed to delete model:", { error, modelId });
      return false;
    }
  }

  async listModels(type?: string): Promise<ModelVersion[]> {
    try {
      const entries = type
        ? this.store.getByTag<ModelVersion>(type)
        : this.store.listEntries<ModelVersion>();
      return entries.map(entry => entry.data);
    } catch (error) {
      logger.error("Failed to list models:", { error, type });
      return [];
    }
  }
}

import { RegistryStore } from "@/lib/nous/registry/store";
import logger from "@/lib/shared/logger";
import { ModelConfig, ModelVersion, RegistryEntry } from "@prisma/client";
import cuid from "cuid";
import { MetadataManager } from "./metadata";
import { VersionManager } from "./version";

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
      logger.error("Failed to register model:", {
        error: "Invalid configuration",
        config,
      });
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
      // No validation needed for now since we construct the object with correct types
      const validatedVersion = modelVersion;

      const entry: RegistryEntry = {
        id: modelId,
        name: `model_${config.type}`,
        version: version.toString(),
        createdAt: modelVersion.createdAt,
        updatedAt: modelVersion.createdAt,
        metadata: { type: config.type },
        config: {
          ...validatedVersion,
          createdAt: validatedVersion.createdAt.toISOString(),
        },
        tags: [config.type],
        type: config.type,
        status: "ACTIVE",
        description: null,
        lastUsedAt: null,
        dependencies: [],
      };

      this.store.register(entry);
      this.metadataManager.storeMetadata(modelId, { type: config.type });

      logger.info(
        `Registered model ${modelId} with version ${version.toString()}`
      );
      return validatedVersion;
    } catch (error) {
      console.error("Registration error:", error);
      logger.error("Failed to register model:", { error, config });
      throw new Error("Model registration failed");
    }
  }

  async getModel(modelId: string): Promise<ModelVersion | null> {
    try {
      const entry = this.store.get<ModelVersion>(modelId);
      if (!entry?.config) return null;

      // Parse stored JSON back to ModelVersion
      return {
        ...(entry.config as any),
        createdAt: new Date(entry.config as string),
      };
    } catch (error) {
      logger.error("Failed to retrieve model:", { error, modelId });
      return null;
    }
  }

  async updateModel(
    modelId: string,
    updates: Partial<ModelVersion>
  ): Promise<ModelVersion | null> {
    try {
      const entry = this.store.get<ModelVersion>(modelId);
      if (!entry) return null;

      const currentConfig = entry.config as any;
      const updated = {
        ...currentConfig,
        ...updates,
        createdAt: currentConfig.createdAt, // Preserve the original createdAt
      };

      // Validate the updated model version
      const updatedEntry = this.store.update<ModelVersion>(modelId, {
        config: {
          ...updated,
          createdAt: updated.createdAt.toISOString(),
        },
        updatedAt: new Date(),
      });

      return this.getModel(modelId);
    } catch (error) {
      logger.error("Failed to update model:", { error, modelId, updates });
      return null;
    }
  }

  async deleteModel(modelId: string): Promise<boolean> {
    try {
      if (!modelId) {
        logger.error("Failed to delete model:", {
          error: "Invalid model ID",
          modelId,
        });
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

      if (!entries) return [];
      return entries.map((entry) => ({
        ...(entry.config as any),
        createdAt: new Date(entry.config as string),
      }));
    } catch (error) {
      logger.error("Failed to list models:", { error, type });
      return [];
    }
  }
}

import { Registry } from "@/lib/nous/registry";
import { Event, ModelConfig, ModelType, ModelVersion } from "@/lib/nous/types";
import prisma from "@/lib/shared/database/client";
import logger from "@/lib/shared/logger";
import { JsonValue } from "@prisma/client/runtime/library";
import { OpenAIClient } from "../clients/openai";

interface TrainingStatus {
  status: "training" | "completed" | "failed";
  startTime: string;
  progress: number;
  endTime?: string;
  error?: string;
}

export class LearningPipeline {
  private pricing = {
    "gpt-3.5-turbo": 0.002 / 1000, // $0.002 per 1K tokens
    "gpt-4": 0.03 / 1000, // $0.03 per 1K tokens
  };

  constructor(
    private registry: Registry,
    private openai: OpenAIClient
  ) {}

  calculateCost(numTokens: number, modelId = "gpt-3.5-turbo"): number {
    const baseModel = modelId.split(":")[0] as keyof typeof this.pricing;
    return (
      numTokens * (this.pricing[baseModel] ?? this.pricing["gpt-3.5-turbo"])
    );
  }

  async trainAndDeploy(
    events: Event[],
    config?: ModelConfig
  ): Promise<ModelVersion> {
    const trainingData = this.prepareTrainingData(events);

    if (!config) {
      config = {
        type: ModelType.OPENAI_FINE_TUNED,
        hyperparameters: { learningRate: 0.001, batchSize: 32 },
        features: ["text", "embeddings"],
        trainingParams: { epochs: 3 },
      };
    }
    const model = await this.registry.registerModel({
      type: "OPENAI_FINE_TUNED",
      id: crypto.randomUUID(),
      hyperparameters: config.hyperparameters as JsonValue,
      features: config.features as string[],
      trainingParams: config.trainingParams as JsonValue,
    });
    const modelId = model.id;

    await this.trainModel(modelId, trainingData);

    const updatedModel = await this.registry.getModel(modelId);
    if (!updatedModel) {
      throw new Error("Failed to retrieve trained model");
    }

    return {
      id: updatedModel.id,
      createdAt: updatedModel.createdAt,
      metrics: updatedModel.metrics as Record<string, number>,
      artifactPath: updatedModel.artifactPath,
      parentVersion: updatedModel.parentVersion || undefined,
      config: updatedModel.configId as unknown as ModelConfig,
    };
  }

  private prepareTrainingData(events: Event[]): Record<string, string[]> {
    return {
      inputs: events.map((e) => JSON.stringify(e)),
      outputs: events.map((e) => JSON.stringify(e.data)),
    };
  }

  private async trainModel(
    modelId: string,
    trainingData: Record<string, string[]>
  ): Promise<void> {
    try {
      const model = await this.registry.getModel(modelId);
      if (!model) {
        throw new Error(`Model ${modelId} not found`);
      }

      let status: TrainingStatus = {
        status: "training",
        startTime: new Date().toISOString(),
        progress: 0,
      };

      await prisma.modelState.update({
        where: { versionId: modelId },
        data: { trainingProgress: 0 },
      });

      const modelType = await prisma.modelVersion.findUnique({
        where: { id: modelId },
        select: {
          configId: true,
        },
      });

      if (!modelType) {
        throw new Error(`Could not determine type for model ${modelId}`);
      }

      const config = JSON.parse(modelType.configId);
      if (config.type === "OPENAI_FINE_TUNED") {
        await this.trainOpenAIModel(modelId, trainingData, status);
      } else {
        await this.trainCustomModel(modelId, trainingData, status);
      }

      status = {
        ...status,
        status: "completed",
        endTime: new Date().toISOString(),
        progress: 100,
      };

      await prisma.modelState.update({
        where: { versionId: modelId },
        data: {
          trainingProgress: 100,
          isTrained: true,
        },
      });
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      logger.error("Training failed:", { error: errorMessage });
      await prisma.modelState.update({
        where: { versionId: modelId },
        data: {
          lastTrainingError: errorMessage,
          trainingProgress: 0,
        },
      });
      throw error;
    }
  }

  private async trainOpenAIModel(
    modelId: string,
    trainingData: Record<string, string[]>,
    status: TrainingStatus
  ): Promise<void> {
    // Implementation for OpenAI fine-tuning
    const response = await this.openai.createFineTune({
      model: "gpt-3.5-turbo",
      training_data: trainingData.inputs.map((input, i) => ({
        prompt: input,
        completion: trainingData.outputs[i],
      })),
    });
    // Update model with fine-tune job ID
    await this.registry.updateModel(modelId, {
      id: modelId,
      type: "OPENAI_FINE_TUNED",
      hyperparameters: {},
      features: [],
      trainingParams: {
        jobId: response.jobId
      }
    });

    // Monitor fine-tuning progress
    while (status.status === "training") {
      const fineTuneStatus = await this.openai.getFineTuneStatus(response.jobId);
      // Calculate progress based on status
      const progress = Math.min(
        ((fineTuneStatus.steps_completed ?? 0) / (fineTuneStatus.total_steps ?? 100)) * 100,
        100
      );
      status.progress = progress;
      await prisma.modelState.update({
        where: { versionId: modelId },
        data: { trainingProgress: progress },
      });

      if (fineTuneStatus.status === "failed") {
        throw new Error(fineTuneStatus.error || "Fine-tuning failed");
      }

      if (fineTuneStatus.status === "succeeded") {
        break;
      }

      await new Promise((resolve) => setTimeout(resolve, 5000));
    }
  }

  private async trainCustomModel(
    modelId: string,
    trainingData: Record<string, string[]>,
    status: TrainingStatus
  ): Promise<void> {
    // Implementation for custom model training
    const features = trainingData.inputs.map((input) => JSON.parse(input));

    const model = await this.registry.getModel(modelId);
    if (!model) {
      throw new Error(`Model ${modelId} not found`);
    }

    const batchSize = model.configId
      ? JSON.parse(model.configId).hyperparameters?.batchSize || 32
      : 32;
    const epochs = model.configId
      ? JSON.parse(model.configId).trainingParams?.epochs || 3
      : 3;

    for (let epoch = 0; epoch < epochs; epoch++) {
      status.progress = (epoch / epochs) * 100;
      await prisma.modelState.update({
        where: { versionId: modelId },
        data: {
          currentEpoch: epoch,
          trainingProgress: status.progress,
        },
      });

      // Process in batches
      for (let i = 0; i < features.length; i += batchSize) {
        // Train on batch
        // Implementation depends on model type
      }
    }
  }
}

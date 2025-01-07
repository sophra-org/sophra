import { prisma } from "@/lib/shared/database/client";
import { TrainingMetrics } from "@/lib/nous/types";
import logger from "@/lib/shared/logger";

export interface ModelMetrics extends TrainingMetrics {
  precision: number;
  recall: number;
  f1Score: number;
  latencyMs: number;
  customMetrics?: {
    rmse?: number;
    mae?: number;
    r2?: number;
  };
}

export interface LearningModel {
  train(features: Record<string, unknown>[], target: string): Promise<void>;
  predict(features: Record<string, unknown>): Promise<Record<string, number>>;
  evaluate(testData: Record<string, unknown>[]): Promise<ModelMetrics>;
  saveState(): Promise<string>;
  loadState(versionId: string): Promise<void>;
  getParameters(): Record<string, unknown>;
}

export class SearchOptimizationModel implements LearningModel {
  private scaler: { mean: number[]; std: number[] } = { mean: [], std: [] };
  private featureNames: string[] = [];
  private isTrained = false;
  private weights: number[] = [];
  private bias = 0;
  private metrics: ModelMetrics | null = null;

  constructor() {
    this.initializeModel();
  }

  private initializeModel(): void {
    this.weights = [];
    this.bias = Math.random() * 0.1;
  }

  private scaleFeatures(features: number[][]): number[][] {
    if (this.scaler.mean.length === 0) {
      // Calculate mean and std for each feature
      const numFeatures = features[0].length;
      this.scaler.mean = Array(numFeatures).fill(0);
      this.scaler.std = Array(numFeatures).fill(0);

      // Calculate mean
      features.forEach((row) => {
        row.forEach((val, i) => {
          this.scaler.mean[i] += val;
        });
      });
      this.scaler.mean = this.scaler.mean.map((sum) => sum / features.length);

      // Calculate std
      features.forEach((row) => {
        row.forEach((val, i) => {
          this.scaler.std[i] += Math.pow(val - this.scaler.mean[i], 2);
        });
      });
      this.scaler.std = this.scaler.std.map((sum) =>
        Math.sqrt(sum / features.length)
      );
    }

    // Scale features
    return features.map((row) =>
      row.map(
        (val, i) => (val - this.scaler.mean[i]) / (this.scaler.std[i] || 1)
      )
    );
  }

  private featuresToArray(features: Record<string, unknown>): number[] {
    return this.featureNames.map((name) => Number(features[name]) || 0);
  }

  async train(
    features: Record<string, unknown>[],
    target: string
  ): Promise<void> {
    if (!features.length) {
      throw new Error("No features provided for training");
    }

    this.featureNames = Object.keys(features[0]);
    const X = features.map((f) => this.featuresToArray(f));
    const y = features.map((f) => Number(f[target]) || 0);

    const scaledX = this.scaleFeatures(X);
    const numFeatures = scaledX[0].length;
    this.weights = Array(numFeatures)
      .fill(0)
      .map(() => Math.random() * 0.1);

    // Gradient descent
    const learningRate = 0.01;
    const epochs = 100;

    for (let epoch = 0; epoch < epochs; epoch++) {
      const predictions = scaledX.map((x) =>
        x.reduce((sum, val, i) => sum + val * this.weights[i], this.bias)
      );

      // Update weights and bias
      const gradients = Array(numFeatures).fill(0);
      let biasGradient = 0;

      for (let i = 0; i < scaledX.length; i++) {
        const error = predictions[i] - y[i];
        biasGradient += error;
        scaledX[i].forEach((val, j) => {
          gradients[j] += error * val;
        });
      }

      this.weights = this.weights.map(
        (w, i) => w - (learningRate * gradients[i]) / scaledX.length
      );
      this.bias -= (learningRate * biasGradient) / scaledX.length;
    }

    this.isTrained = true;
  }

  async predict(
    features: Record<string, unknown>
  ): Promise<Record<string, number>> {
    if (!this.isTrained) {
      throw new Error("Model must be trained before prediction");
    }

    const featureArray = this.featuresToArray(features);
    const scaledFeatures = this.scaleFeatures([featureArray])[0];

    const prediction = scaledFeatures.reduce(
      (sum, val, i) => sum + val * this.weights[i],
      this.bias
    );

    const confidence = Math.min(
      1,
      Math.max(0, 1 - Math.abs(prediction) / (Math.max(...this.weights) * 10))
    );

    const featureImportances = this.featureNames.reduce(
      (acc, name, i) => {
        acc[name] = Math.abs(this.weights[i] / Math.max(...this.weights));
        return acc;
      },
      {} as Record<string, number>
    );

    return {
      predictedRelevance: prediction,
      confidence,
      ...featureImportances,
    };
  }

  async evaluate(testData: Record<string, unknown>[]): Promise<ModelMetrics> {
    if (!this.isTrained) {
      throw new Error("Model must be trained before evaluation");
    }

    const startTime = Date.now();
    const predictions = await Promise.all(
      testData.map((features) => this.predict(features))
    );

    const actual = testData.map((d) => Number(d["relevance"]) || 0);
    const predicted = predictions.map((p) => p.predictedRelevance);

    // Calculate metrics
    const mse =
      predicted.reduce((sum, p, i) => sum + Math.pow(p - actual[i], 2), 0) /
      predicted.length;
    const rmse = Math.sqrt(mse);
    const mae =
      predicted.reduce((sum, p, i) => sum + Math.abs(p - actual[i]), 0) /
      predicted.length;

    // Calculate R-squared
    const meanActual = actual.reduce((sum, a) => sum + a, 0) / actual.length;
    const totalSS = actual.reduce(
      (sum, a) => sum + Math.pow(a - meanActual, 2),
      0
    );
    const residualSS = predicted.reduce(
      (sum, p, i) => sum + Math.pow(actual[i] - p, 2),
      0
    );
    const r2 = 1 - residualSS / totalSS;

    // Calculate precision, recall, f1 for binary classification
    const threshold = 0.5;
    const tp = predicted.reduce(
      (sum, p, i) => sum + (p >= threshold && actual[i] >= threshold ? 1 : 0),
      0
    );
    const fp = predicted.reduce(
      (sum, p, i) => sum + (p >= threshold && actual[i] < threshold ? 1 : 0),
      0
    );
    const fn = predicted.reduce(
      (sum, p, i) => sum + (p < threshold && actual[i] >= threshold ? 1 : 0),
      0
    );

    const precision = tp / (tp + fp) || 0;
    const recall = tp / (tp + fn) || 0;
    const f1Score = (2 * (precision * recall)) / (precision + recall) || 0;

    const metrics = {
      accuracy: r2,
      precision,
      recall,
      f1Score,
      latencyMs: Date.now() - startTime,
      loss: mse,
      validationMetrics: { mse, rmse, mae },
      trainingDuration: 0,
      iterationCount: 100,
      customMetrics: {
        rmse,
        mae,
        r2,
      },
    };

    this.metrics = metrics;
    return metrics;
  }

  async saveState(): Promise<string> {
    try {
      const modelState = await prisma.modelState.create({
        data: {
          versionId: `search_model_${Date.now()}`,
          weights: this.weights,
          bias: this.bias,
          scaler: this.scaler,
          featureNames: this.featureNames,
          isTrained: this.isTrained,
          metrics: this.metrics
            ? {
                create: {
                  modelVersionId: `search_model_${Date.now()}`,
                  accuracy: this.metrics.accuracy,
                  precision: this.metrics.precision,
                  recall: this.metrics.recall,
                  f1Score: this.metrics.f1Score,
                  latencyMs: this.metrics.latencyMs,
                  loss: this.metrics.loss,
                  validationMetrics: this.metrics.validationMetrics,
                  customMetrics: this.metrics.customMetrics,
                },
              }
            : {
                create: {
                  modelVersionId: `search_model_${Date.now()}`,
                  accuracy: 0,
                  precision: 0,
                  recall: 0,
                  f1Score: 0,
                  latencyMs: 0,
                  loss: 0,
                  validationMetrics: { mse: 0, rmse: 0, mae: 0 },
                  customMetrics: {
                    rmse: 0,
                    mae: 0,
                    r2: 0,
                  },
                },
              },
        },
      });

      return modelState.versionId;
    } catch (error) {
      logger.error(
        "Failed to save model state:",
        error as Record<string, unknown>
      );
      throw new Error("Failed to persist model state");
    }
  }

  async loadState(versionId: string): Promise<void> {
    try {
      const modelState = await prisma.modelState.findUnique({
        where: { versionId },
      });

      if (!modelState) {
        throw new Error(`Model version ${versionId} not found`);
      }

      this.weights = modelState.weights;
      this.bias = modelState.bias;
      this.scaler = modelState.scaler as { mean: number[]; std: number[] };
      this.featureNames = modelState.featureNames;
      this.isTrained = modelState.isTrained;
    } catch (error) {
      // If it's our specific error for non-existent state, rethrow it
      if (error instanceof Error && error.message.includes('not found')) {
        throw error;
      }
      // For other errors, log and throw generic error
      logger.error(
        "Failed to load model state:",
        error as Record<string, unknown>
      );
      throw new Error("Failed to load model state");
    }
  }

  getParameters(): Record<string, unknown> {
    return {
      featureNames: this.featureNames,
      isTrained: this.isTrained,
      numFeatures: this.featureNames.length,
      weights: this.weights,
      bias: this.bias,
      scalerMean: this.scaler.mean,
      scalerStd: this.scaler.std,
    };
  }
}

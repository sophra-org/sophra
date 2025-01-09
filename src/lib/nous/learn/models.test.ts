import { ModelType } from "@prisma/client";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { mockPrisma } from "~/vitest.setup";
import { SearchOptimizationModel } from "./models";

describe("SearchOptimizationModel", () => {
  let model: SearchOptimizationModel;
  const mockFeatures = [
    { feature1: 1, feature2: 2, relevance: 1 },
    { feature1: 2, feature2: 3, relevance: 0 },
    { feature1: 3, feature2: 4, relevance: 1 },
    { feature1: 4, feature2: 5, relevance: 0 },
  ];

  beforeEach(() => {
    model = new SearchOptimizationModel();
    vi.clearAllMocks();
  });

  describe("train", () => {
    it("should train the model successfully", async () => {
      await expect(
        model.train(mockFeatures, "relevance")
      ).resolves.not.toThrow();
      const params = model.getParameters();
      expect(params).toHaveProperty("weights");
      expect(params).toHaveProperty("bias");
      expect(params).toHaveProperty("featureNames");
    });

    it("should throw error when no features provided", async () => {
      await expect(model.train([], "relevance")).rejects.toThrow(
        "No features provided for training"
      );
    });
  });

  describe("predict", () => {
    it("should throw error when model is not trained", async () => {
      await expect(model.predict({ feature1: 1, feature2: 2 })).rejects.toThrow(
        "Model must be trained before prediction"
      );
    });

    it("should make predictions after training", async () => {
      await model.train(mockFeatures, "relevance");
      const prediction = await model.predict({ feature1: 1, feature2: 2 });
      expect(prediction).toHaveProperty("predictedRelevance");
      expect(prediction).toHaveProperty("confidence");
      expect(prediction).toHaveProperty("feature1");
      expect(prediction).toHaveProperty("feature2");
    });
  });

  describe("evaluate", () => {
    it("should throw error when model is not trained", async () => {
      await expect(model.evaluate(mockFeatures)).rejects.toThrow(
        "Model must be trained before evaluation"
      );
    });

    it("should calculate metrics after training", async () => {
      await model.train(mockFeatures, "relevance");
      const metrics = await model.evaluate(mockFeatures);
      expect(metrics).toHaveProperty("accuracy");
      expect(metrics).toHaveProperty("precision");
      expect(metrics).toHaveProperty("recall");
      expect(metrics).toHaveProperty("f1Score");
      expect(metrics).toHaveProperty("latencyMs");
      expect(metrics).toHaveProperty("loss");
      expect(metrics.customMetrics).toHaveProperty("rmse");
      expect(metrics.customMetrics).toHaveProperty("mae");
      expect(metrics.customMetrics).toHaveProperty("r2");
    });
  });

  describe("saveState", () => {
    const mockModelState = {
      id: "1",
      versionId: "test_version",
      weights: [1, 2, 3],
      bias: 0.5,
      scaler: { mean: [0], std: [1] },
      featureNames: ["feature1", "feature2"],
      isTrained: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      modelType: ModelType.SEARCH_RANKER,
      hyperparameters: {},
      currentEpoch: 0,
      trainingProgress: 1,
      lastTrainingError: null,
    };

    beforeEach(() => {
      vi.spyOn(mockPrisma.modelState, "create").mockResolvedValue(
        mockModelState
      );
    });

    it("should save model state successfully", async () => {
      await model.train(mockFeatures, "relevance");
      const versionId = await model.saveState();
      expect(versionId).toBeDefined();
      expect(mockPrisma.modelState.create).toHaveBeenCalled();
    });
  });

  describe("loadState", () => {
    const mockModelState = {
      id: "1",
      versionId: "test_version",
      weights: [1, 2, 3],
      bias: 0.5,
      scaler: { mean: [0], std: [1] },
      featureNames: ["feature1", "feature2"],
      isTrained: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      modelType: ModelType.SEARCH_RANKER,
      hyperparameters: {},
      currentEpoch: 0,
      trainingProgress: 1,
      lastTrainingError: null,
    };

    beforeEach(() => {
      vi.spyOn(mockPrisma.modelState, "findUnique").mockResolvedValue(
        mockModelState
      );
    });

    it("should load model state successfully", async () => {
      await model.loadState("test_version");
      const params = model.getParameters();
      expect(params.weights).toEqual(mockModelState.weights);
      expect(params.bias).toBe(mockModelState.bias);
      expect(params.featureNames).toEqual(mockModelState.featureNames);
    });

    it("should throw error when version not found", async () => {
      vi.spyOn(mockPrisma.modelState, "findUnique").mockResolvedValue(null);
      await expect(model.loadState("nonexistent")).rejects.toThrow(
        "Model version nonexistent not found"
      );
    });
  });
});

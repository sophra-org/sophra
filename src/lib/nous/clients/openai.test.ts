import { describe, it, expect, vi, beforeEach } from "vitest";
import { OpenAIClient } from "./openai";
import { Logger } from "@/lib/shared/types";

describe("OpenAIClient", () => {
  let client: OpenAIClient;
  let mockLogger: Logger;
  let mockOpenAI: any;

  beforeEach(() => {
    mockLogger = {
      debug: vi.fn(),
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
      child: vi.fn().mockReturnThis(),
    } as unknown as Logger;

    mockOpenAI = {
      files: {
        create: vi.fn(),
      },
      fineTuning: {
        jobs: {
          create: vi.fn(),
          retrieve: vi.fn(),
        },
      },
    };

    client = new OpenAIClient({
      apiKey: "test-key",
      logger: mockLogger,
      openai: mockOpenAI,
    });
  });

  describe("createFineTune", () => {
    it("should create a fine-tuning job successfully", async () => {
      const fileData = Buffer.from("test data");
      const fileResponse = { id: "file-123" };
      const jobResponse = { id: "job-123", status: "created" };

      mockOpenAI.files.create.mockResolvedValue(fileResponse);
      mockOpenAI.fineTuning.jobs.create.mockResolvedValue(jobResponse);

      const result = await client.createFineTune({
        trainingData: fileData,
        model: "gpt-3.5-turbo",
      });

      expect(result).toEqual({
        jobId: "job-123",
        status: "created",
      });

      expect(mockLogger.info).toHaveBeenCalledWith(
        "Created fine-tuning job",
        expect.any(Object)
      );
    });

    it("should handle file creation errors", async () => {
      const fileData = Buffer.from("test data");
      mockOpenAI.files.create.mockRejectedValue(new Error("File creation failed"));

      await expect(
        client.createFineTune({
          trainingData: fileData,
          model: "gpt-3.5-turbo",
        })
      ).rejects.toThrow("File creation failed");

      expect(mockLogger.error).toHaveBeenCalledWith(
        "Failed to create file for fine-tuning",
        expect.any(Object)
      );
    });

    it("should handle fine-tuning job creation errors", async () => {
      const fileData = Buffer.from("test data");
      const fileResponse = { id: "file-123" };

      mockOpenAI.files.create.mockResolvedValue(fileResponse);
      mockOpenAI.fineTuning.jobs.create.mockRejectedValue(
        new Error("Job creation failed")
      );

      await expect(
        client.createFineTune({
          trainingData: fileData,
          model: "gpt-3.5-turbo",
        })
      ).rejects.toThrow("Job creation failed");

      expect(mockLogger.error).toHaveBeenCalledWith(
        "Failed to create fine-tuning job",
        expect.any(Object)
      );
    });
  });

  describe("getFineTuneStatus", () => {
    it("should retrieve fine-tuning job status successfully", async () => {
      const jobResponse = {
        id: "job-123",
        status: "succeeded",
        fine_tuned_model: "model-123",
      };

      mockOpenAI.fineTuning.jobs.retrieve.mockResolvedValue(jobResponse);

      const status = await client.getFineTuneStatus("job-123");

      expect(status.status).toBe("succeeded");
      expect(status.fineTunedModel).toBe("model-123");
      expect(mockLogger.info).toHaveBeenCalledWith(
        "Retrieved fine-tuning job status",
        expect.any(Object)
      );
    });

    it("should handle status retrieval errors", async () => {
      mockOpenAI.fineTuning.jobs.retrieve.mockRejectedValue(
        new Error("Status retrieval failed")
      );

      await expect(client.getFineTuneStatus("job-123")).rejects.toThrow(
        "Status retrieval failed"
      );

      expect(mockLogger.error).toHaveBeenCalledWith(
        "Failed to retrieve fine-tuning job status",
        expect.any(Object)
      );
    });

    it("should handle job status with error", async () => {
      const jobResponse = {
        id: "job-123",
        status: "failed",
        error: {
          message: "Training failed",
        },
      };

      mockOpenAI.fineTuning.jobs.retrieve.mockResolvedValue(jobResponse);

      const status = await client.getFineTuneStatus("job-123");

      expect(status.status).toBe("failed");
      expect(status.error).toBe("Training failed");
      expect(mockLogger.warn).toHaveBeenCalledWith(
        "Fine-tuning job failed",
        expect.any(Object)
      );
    });
  });
});
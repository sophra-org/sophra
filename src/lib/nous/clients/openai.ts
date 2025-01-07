import OpenAI from "openai";
import { Logger } from "@/lib/shared/types";

export interface OpenAIClientConfig {
  apiKey: string;
  logger: Logger;
  openai?: OpenAI;
}

export class OpenAIClient {
  private openai: OpenAI;
  private logger: Logger;

  constructor(config: OpenAIClientConfig) {
    this.logger = config.logger;
    this.openai = config.openai || new OpenAI({ apiKey: config.apiKey });
  }

  async createFineTune(params: { trainingData: Buffer; model: string }) {
    try {
      const file = await this.openai.files.create({
        file: {
          name: "training.jsonl",
          lastModified: Date.now(),
          type: "application/json",
          size: params.trainingData.length,
          text: async () => params.trainingData.toString(),
          slice: (start?: number, end?: number) => {
            const slicedData = params.trainingData.slice(start, end);
            return new Blob([slicedData], { type: "application/json" });
          },
        },
        purpose: "fine-tune",
      });

      try {
        const job = await this.openai.fineTuning.jobs.create({
          training_file: file.id,
          model: params.model,
        });

        this.logger.info("Created fine-tuning job", {
          jobId: job.id,
          status: job.status,
        });

        return {
          jobId: job.id,
          status: job.status,
        };
      } catch (jobError) {
        this.logger.error("Failed to create fine-tuning job", {
          error: jobError instanceof Error ? jobError.message : String(jobError),
        });
        throw jobError;
      }
    } catch (error) {
      if (error instanceof Error) {
        this.logger.error("Failed to create file for fine-tuning", {
          error: error.message,
        });
      }
      throw error;
    }
  }

  async getFineTuneStatus(jobId: string) {
    try {
      const job = await this.openai.fineTuning.jobs.retrieve(jobId);

      this.logger.info("Retrieved fine-tuning job status", {
        jobId,
        status: job.status,
      });

      const status = {
        status: job.status,
        fineTunedModel: job.fine_tuned_model,
        error: job.error?.message,
      };

      if (status.error) {
        this.logger.warn("Fine-tuning job failed", {
          jobId,
          error: status.error,
        });
      }

      return status;
    } catch (error) {
      this.logger.error("Failed to retrieve fine-tuning job status", {
        jobId,
        error: error instanceof Error ? error.message : error,
      });
      throw error;
    }
  }
}

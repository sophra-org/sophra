import { ChatCompletionMessage } from "openai/resources/chat";
import { jest, describe, it, expect, beforeEach, afterEach } from "@jest/globals";

export interface FineTuneResponse {
  id: string;
  progress: number;
  status: string;
}

export class OpenAIClient {
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async chat(messages: ChatCompletionMessage[]): Promise<string> {
    return "mocked response";
  }

  async embed(text: string): Promise<number[]> {
    return Array(1536).fill(0);
  }

  async createFineTune(trainingData: any): Promise<FineTuneResponse> {
    return {
      id: "ft-mock",
      progress: 100,
      status: "succeeded"
    };
  }

  async getFineTuneStatus(fineTuneId: string): Promise<FineTuneResponse> {
    return {
      id: fineTuneId,
      progress: 100,
      status: "succeeded"
    };
  }
}

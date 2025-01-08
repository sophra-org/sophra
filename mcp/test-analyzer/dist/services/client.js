"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DeepSeekClient = void 0;
const openai_1 = __importDefault(require("openai"));
class DeepSeekClient {
    constructor() {
        if (!process.env.DEEPSEEK_API_KEY) {
            throw new Error("DEEPSEEK_API_KEY environment variable is missing");
        }
        this.client = new openai_1.default({
            baseURL: "https://api.deepseek.com/v1",
            apiKey: process.env.DEEPSEEK_API_KEY,
        });
    }
    static getInstance() {
        if (!DeepSeekClient.instance) {
            DeepSeekClient.instance = new DeepSeekClient();
        }
        return DeepSeekClient.instance;
    }
    /**
     * Analyze test structure, patterns, and generate improvement suggestions
     */
    async analyzeTestStructure(testContent, context) {
        const response = await this.client.chat.completions.create({
            model: "deepseek-chat",
            messages: [
                {
                    role: "system",
                    content: `You are an expert test analyzer specializing in ${context.framework} tests. 
          Analyze the test code for patterns, anti-patterns, and provide specific improvement suggestions.
          Focus on test structure, assertion patterns, setup/teardown usage, and test isolation.
          Consider the test type (${context.testType}) and available dependencies: ${context.dependencies.join(", ")}.
          
          Provide your analysis in the following JSON format:
          {
            "patterns": [
              { "type": string, "description": string, "impact": string }
            ],
            "antiPatterns": [
              { "type": string, "description": string, "risk": string, "suggestion": string }
            ],
            "suggestions": [
              { "type": string, "description": string, "priority": number, "effort": number }
            ]
          }`,
                },
                {
                    role: "user",
                    content: `Analyze this test code:\n\n${testContent}`,
                },
            ],
            temperature: 0.3,
            response_format: { type: "json_object" },
        });
        try {
            return JSON.parse(response.choices[0].message.content || "{}");
        }
        catch (error) {
            console.error("Failed to parse analysis:", error);
            throw error;
        }
    }
    /**
     * Generate test improvements and fixes
     */
    async generateTestImprovements(testContent, sourceContent, improvements) {
        const response = await this.client.chat.completions.create({
            model: "deepseek-chat",
            messages: [
                {
                    role: "system",
                    content: `You are an expert test generator and improver. 
          Generate or modify test code based on the provided source code and improvement requirements.
          Focus on maintaining test quality, readability, and following best practices.
          Ensure generated tests are properly isolated and maintainable.
          
          Provide your response in the following JSON format:
          {
            "code": string (the complete improved test code),
            "explanation": string (explanation of changes made),
            "changes": [
              { "type": string, "description": string }
            ]
          }`,
                },
                {
                    role: "user",
                    content: `Original test code:\n\`\`\`typescript\n${testContent}\n\`\`\`\n\n` +
                        `Source code:\n\`\`\`typescript\n${sourceContent}\n\`\`\`\n\n` +
                        `Required improvements:\n${improvements
                            .map((imp) => `- ${imp.type}: ${imp.description}`)
                            .join("\n")}`,
                },
            ],
            temperature: 0.2,
            response_format: { type: "json_object" },
        });
        try {
            return JSON.parse(response.choices[0].message.content || "{}");
        }
        catch (error) {
            console.error("Failed to parse improvements:", error);
            throw error;
        }
    }
    /**
     * Analyze coverage gaps and generate test suggestions
     */
    async analyzeCoverageGaps(sourceContent, coverageData, existingTests) {
        const response = await this.client.chat.completions.create({
            model: "deepseek-chat",
            messages: [
                {
                    role: "system",
                    content: `You are an expert in test coverage analysis.
          Analyze the source code and existing test coverage to identify gaps in testing.
          Consider edge cases, error conditions, and complex logic paths.
          For each gap, provide specific test case suggestions with code.
          
          Provide your analysis in the following JSON format:
          {
            "gaps": [
              {
                "area": string,
                "description": string,
                "priority": number,
                "suggestedTests": [
                  {
                    "description": string,
                    "code": string
                  }
                ]
              }
            ]
          }`,
                },
                {
                    role: "user",
                    content: `Source code:\n\`\`\`typescript\n${sourceContent}\n\`\`\`\n\n` +
                        `Coverage data:\n${JSON.stringify(coverageData, null, 2)}\n\n` +
                        `Existing test cases:\n${existingTests.join("\n")}`,
                },
            ],
            temperature: 0.3,
            response_format: { type: "json_object" },
        });
        try {
            return JSON.parse(response.choices[0].message.content || "{}");
        }
        catch (error) {
            console.error("Failed to parse coverage analysis:", error);
            throw error;
        }
    }
    /**
     * Analyze test reliability and flakiness
     */
    async analyzeTestReliability(testContent, executionHistory) {
        const response = await this.client.chat.completions.create({
            model: "deepseek-chat",
            messages: [
                {
                    role: "system",
                    content: `You are an expert in test reliability analysis.
          Analyze the test code and execution history to identify potential flakiness and reliability issues.
          Consider timing issues, race conditions, external dependencies, and state management.
          For each issue, provide specific evidence and code fixes.
          
          Provide your analysis in the following JSON format:
          {
            "isFlaky": boolean,
            "confidence": number,
            "issues": [
              {
                "type": string,
                "description": string,
                "evidence": string[],
                "suggestedFix": {
                  "description": string,
                  "code": string
                }
              }
            ]
          }`,
                },
                {
                    role: "user",
                    content: `Test code:\n\`\`\`typescript\n${testContent}\n\`\`\`\n\n` +
                        `Execution history:\n${JSON.stringify(executionHistory, null, 2)}`,
                },
            ],
            temperature: 0.3,
            response_format: { type: "json_object" },
        });
        try {
            return JSON.parse(response.choices[0].message.content || "{}");
        }
        catch (error) {
            console.error("Failed to parse reliability analysis:", error);
            throw error;
        }
    }
}
exports.DeepSeekClient = DeepSeekClient;

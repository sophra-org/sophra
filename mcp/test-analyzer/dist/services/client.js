"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DeepSeekClient = void 0;
const json5_1 = __importDefault(require("json5"));
const openai_1 = __importDefault(require("openai"));
const MAX_RETRIES = 5;
const INITIAL_RETRY_DELAY = 1000; // 1 second
const MAX_RETRY_DELAY = 32000; // 32 seconds
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
    async withRetry(operation) {
        let retryCount = 0;
        let delay = INITIAL_RETRY_DELAY;
        while (true) {
            try {
                return await operation();
            }
            catch (error) {
                retryCount++;
                if (retryCount >= MAX_RETRIES) {
                    console.error(`Failed after ${MAX_RETRIES} retries:`, error);
                    throw error;
                }
                // Check if it's a connection error or rate limit
                const shouldRetry = error instanceof Error &&
                    (error.message.includes("ECONNRESET") ||
                        error.message.includes("rate limit") ||
                        error.message.includes("Connection error"));
                if (!shouldRetry) {
                    throw error;
                }
                console.warn(`Retry ${retryCount}/${MAX_RETRIES} after ${delay}ms delay...`);
                await new Promise((resolve) => setTimeout(resolve, delay));
                // Exponential backoff with jitter
                delay = Math.min(delay * 2 * (0.5 + Math.random()), MAX_RETRY_DELAY);
            }
        }
    }
    async makeAPICall(operation) {
        return this.withRetry(async () => {
            const result = await operation();
            return result;
        });
    }
    async safeJSONParse(content) {
        try {
            // First try standard JSON parse
            return JSON.parse(content);
        }
        catch (error) {
            try {
                // If that fails, try JSON5 which is more lenient
                return json5_1.default.parse(content);
            }
            catch (error) {
                console.error("Failed to parse response:", error);
                console.error("Raw content:", content);
                throw new Error("Failed to parse response from DeepSeek API");
            }
        }
    }
    formatSystemPrompt(basePrompt) {
        return `${basePrompt}

    IMPORTANT: Your response must be valid JSON/JSON5. Follow these rules:
    1. All string values must be properly quoted
    2. Use double quotes for property names
    3. Arrays and objects must be properly terminated
    4. No trailing commas in arrays or objects
    5. No comments in the JSON output
    6. All values must be valid JSON types (string, number, boolean, null, object, array)
    7. Ensure all required fields are present
    8. Format the response as a single JSON object`;
    }
    async analyzeTestStructure(testContent, context) {
        return this.makeAPICall(async () => {
            const response = await this.client.chat.completions.create({
                model: "deepseek-chat",
                messages: [
                    {
                        role: "system",
                        content: this
                            .formatSystemPrompt(`You are an expert test analyzer specializing in ${context.framework} tests. 
            Analyze the test code for patterns, anti-patterns, and provide specific improvement suggestions.
            Focus on test structure, assertion patterns, setup/teardown usage, and test isolation.
            Consider the test type (${context.testType}) and available dependencies: ${context.dependencies.join(", ")}.
            
            Provide your analysis in the following JSON format:
            {
              "patterns": [
                { "type": "string", "description": "string", "impact": "string" }
              ],
              "antiPatterns": [
                { "type": "string", "description": "string", "risk": "string", "suggestion": "string" }
              ],
              "suggestions": [
                { "type": "string", "description": "string", "priority": number, "effort": number }
              ]
            }`),
                    },
                    {
                        role: "user",
                        content: `Analyze this test code:\n\n${testContent}`,
                    },
                ],
                temperature: 0.3,
                response_format: { type: "json_object" },
            });
            return this.safeJSONParse(response.choices[0].message.content || "{}");
        });
    }
    async generateTestImprovements(testContent, sourceContent, improvements) {
        return this.makeAPICall(async () => {
            const response = await this.client.chat.completions.create({
                model: "deepseek-chat",
                messages: [
                    {
                        role: "system",
                        content: this
                            .formatSystemPrompt(`You are an expert test generator and improver. 
            Generate or modify test code based on the provided source code and improvement requirements.
            Focus on maintaining test quality, readability, and following best practices.
            Ensure generated tests are properly isolated and maintainable.
            
            Provide your response in the following JSON format:
            {
              "code": "string (the complete improved test code)",
              "explanation": "string (explanation of changes made)",
              "changes": [
                { "type": "string", "description": "string" }
              ]
            }`),
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
            return this.safeJSONParse(response.choices[0].message.content || "{}");
        });
    }
    async analyzeCoverageGaps(sourceContent, coverageData, existingTests) {
        return this.makeAPICall(async () => {
            const response = await this.client.chat.completions.create({
                model: "deepseek-chat",
                messages: [
                    {
                        role: "system",
                        content: this
                            .formatSystemPrompt(`You are an expert in test coverage analysis.
            Analyze the source code and existing test coverage to identify gaps in testing.
            Consider edge cases, error conditions, and complex logic paths.
            For each gap, provide specific test case suggestions with code.
            
            Provide your analysis in the following JSON format:
            {
              "gaps": [
                {
                  "area": "string",
                  "description": "string",
                  "priority": number,
                  "suggestedTests": [
                    {
                      "description": "string",
                      "code": "string"
                    }
                  ]
                }
              ]
            }`),
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
            return this.safeJSONParse(response.choices[0].message.content || "{}");
        });
    }
    async analyzeTestReliability(testContent, executionHistory) {
        return this.makeAPICall(async () => {
            const response = await this.client.chat.completions.create({
                model: "deepseek-chat",
                messages: [
                    {
                        role: "system",
                        content: this
                            .formatSystemPrompt(`You are an expert in test reliability analysis.
            Analyze the test code and execution history to identify potential flakiness and reliability issues.
            Consider timing issues, race conditions, external dependencies, and state management.
            For each issue, provide specific evidence and code fixes.
            
            Provide your analysis in the following JSON format:
            {
              "isFlaky": boolean,
              "confidence": number,
              "issues": [
                {
                  "type": "string",
                  "description": "string",
                  "evidence": ["string"],
                  "suggestedFix": {
                    "description": "string",
                    "code": "string"
                  }
                }
              ]
            }`),
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
            return this.safeJSONParse(response.choices[0].message.content || "{}");
        });
    }
}
exports.DeepSeekClient = DeepSeekClient;

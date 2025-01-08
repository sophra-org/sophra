"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fastify_1 = __importDefault(require("fastify"));
const zod_1 = require("zod");
const test_analyzer_client_1 = require("../../../prisma/test-analyzer-client");
const analyzer_1 = require("./services/analyzer");
const fixer_1 = require("./services/fixer");
const generator_1 = require("./services/generator");
const prisma = new test_analyzer_client_1.PrismaClient();
const server = (0, fastify_1.default)();
// MCP Protocol Implementation
server.post("/analyze", async (request, reply) => {
    const schema = zod_1.z.object({
        testPath: zod_1.z.string(),
        sessionId: zod_1.z.string().optional(),
    });
    const { testPath, sessionId } = schema.parse(request.body);
    const result = await (0, analyzer_1.analyzeTest)(testPath, sessionId);
    return result;
});
server.post("/fix", async (request, reply) => {
    const schema = zod_1.z.object({
        testPath: zod_1.z.string(),
        problem: zod_1.z.string(),
        sessionId: zod_1.z.string().optional(),
    });
    const { testPath, problem, sessionId } = schema.parse(request.body);
    const result = await (0, fixer_1.fixTest)(testPath, problem, sessionId);
    return result;
});
server.post("/generate", async (request, reply) => {
    const schema = zod_1.z.object({
        testPath: zod_1.z.string(),
        coverage: zod_1.z.number(),
        sessionId: zod_1.z.string().optional(),
    });
    const { testPath, coverage, sessionId } = schema.parse(request.body);
    const result = await (0, generator_1.generateTests)(testPath, coverage, sessionId);
    return result;
});
const start = async () => {
    try {
        await server.listen({ port: 3001, host: "0.0.0.0" });
        console.log("Server running at http://localhost:3001/");
    }
    catch (err) {
        server.log.error(err);
        process.exit(1);
    }
};
start();

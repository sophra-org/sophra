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
const session_1 = require("./services/session");
const prisma = new test_analyzer_client_1.PrismaClient();
const server = (0, fastify_1.default)({ logger: true });
// Initialize services
const analyzer = analyzer_1.TestAnalyzer.getInstance();
const fixer = fixer_1.TestFixer.getInstance();
const generator = generator_1.TestGenerator.getInstance();
const sessionManager = session_1.SessionManager.getInstance();
async function convertPrismaTestFileToType(prismaTestFile) {
    return {
        id: prismaTestFile.id,
        filePath: prismaTestFile.filePath,
        fileName: prismaTestFile.fileName,
        firstSeen: prismaTestFile.firstSeen,
        lastUpdated: prismaTestFile.lastUpdated,
        totalRuns: prismaTestFile.totalRuns,
        avgPassRate: prismaTestFile.avgPassRate,
        currentPassRate: prismaTestFile.currentPassRate,
        avgDuration: prismaTestFile.avgDuration,
        currentCoverage: prismaTestFile.currentCoverage,
        avgCoverage: prismaTestFile.avgCoverage,
        totalFixes: prismaTestFile.totalFixes,
        flakyTests: prismaTestFile.flakyTests,
        metadata: prismaTestFile.metadata || {},
        healthScore: prismaTestFile.healthScore,
        totalTests: prismaTestFile.totalTests,
        criticalTests: prismaTestFile.criticalTests,
        lastFailureReason: prismaTestFile.lastFailureReason || undefined,
    };
}
// Schema validation
const analyzeRequestSchema = zod_1.z.object({
    testFile: zod_1.z.string(),
    context: zod_1.z
        .object({
        testPattern: zod_1.z.string().optional(),
        coverage: zod_1.z
            .object({
            current: zod_1.z.number(),
            target: zod_1.z.number(),
        })
            .optional(),
        performance: zod_1.z
            .object({
            avgDuration: zod_1.z.number(),
            maxDuration: zod_1.z.number(),
        })
            .optional(),
        metadata: zod_1.z.record(zod_1.z.any()).optional(),
    })
        .optional(),
});
const fixRequestSchema = zod_1.z.object({
    sessionId: zod_1.z.string(),
    testFile: zod_1.z.string(),
    issues: zod_1.z.array(zod_1.z.object({
        type: zod_1.z.string(),
        description: zod_1.z.string(),
        area: zod_1.z.string().optional(),
    })),
});
const generateRequestSchema = zod_1.z.object({
    sessionId: zod_1.z.string(),
    testFile: zod_1.z.string(),
    options: zod_1.z.object({
        type: zod_1.z.enum(["coverage", "enhancement", "regression", "edge"]),
        targetArea: zod_1.z.string().optional(),
    }),
});
// Routes
server.post("/analyze", async (request, reply) => {
    try {
        const { testFile: testPath, context } = analyzeRequestSchema.parse(request.body);
        // Get or create test file record
        const prismaTestFile = await prisma.testFile.upsert({
            where: { filePath: testPath },
            create: {
                filePath: testPath,
                fileName: testPath.split("/").pop() || "",
            },
            update: {},
        });
        const testFile = await convertPrismaTestFileToType(prismaTestFile);
        // Start analysis session
        const sessionId = await analyzer.startAnalysis(testFile, context);
        // Run analysis
        const result = await analyzer.analyzeTest(sessionId, testFile);
        return reply.send({
            sessionId,
            result,
        });
    }
    catch (error) {
        request.log.error(error);
        return reply.status(500).send({ error: error.message });
    }
});
server.post("/fix", async (request, reply) => {
    try {
        const { sessionId, testFile: testPath, issues, } = fixRequestSchema.parse(request.body);
        // Get test file record
        const prismaTestFile = await prisma.testFile.findUnique({
            where: { filePath: testPath },
        });
        if (!prismaTestFile) {
            return reply.status(404).send({ error: "Test file not found" });
        }
        const testFile = await convertPrismaTestFileToType(prismaTestFile);
        // Apply fixes
        const result = await fixer.fixTest(sessionId, testFile, issues);
        return reply.send(result);
    }
    catch (error) {
        request.log.error(error);
        return reply.status(500).send({ error: error.message });
    }
});
server.post("/generate", async (request, reply) => {
    try {
        const { sessionId, testFile: testPath, options, } = generateRequestSchema.parse(request.body);
        // Get test file record
        const prismaTestFile = await prisma.testFile.findUnique({
            where: { filePath: testPath },
        });
        if (!prismaTestFile) {
            return reply.status(404).send({ error: "Test file not found" });
        }
        const testFile = await convertPrismaTestFileToType(prismaTestFile);
        // Generate tests
        const result = await generator.generateTests(sessionId, testFile, options);
        return reply.send(result);
    }
    catch (error) {
        request.log.error(error);
        return reply.status(500).send({ error: error.message });
    }
});
server.get("/session/:id", async (request, reply) => {
    try {
        const session = await sessionManager.getSession(request.params.id);
        if (!session) {
            return reply.status(404).send({ error: "Session not found" });
        }
        const operations = await sessionManager.getSessionOperations(session.id);
        const decisions = await sessionManager.getSessionDecisions(session.id);
        return reply.send({
            ...session,
            operations,
            decisions,
        });
    }
    catch (error) {
        request.log.error(error);
        return reply.status(500).send({ error: error.message });
    }
});
server.post("/session/:id/pause", async (request, reply) => {
    try {
        await sessionManager.pauseSession(request.params.id);
        return reply.send({ status: "paused" });
    }
    catch (error) {
        request.log.error(error);
        return reply.status(500).send({ error: error.message });
    }
});
server.post("/session/:id/resume", async (request, reply) => {
    try {
        await sessionManager.resumeSession(request.params.id);
        return reply.send({ status: "resumed" });
    }
    catch (error) {
        request.log.error(error);
        return reply.status(500).send({ error: error.message });
    }
});
server.post("/session/:id/complete", async (request, reply) => {
    try {
        await sessionManager.completeSession(request.params.id);
        return reply.send({ status: "completed" });
    }
    catch (error) {
        request.log.error(error);
        return reply.status(500).send({ error: error.message });
    }
});
// Start server
const start = async () => {
    try {
        await server.listen({ port: 3001, host: "0.0.0.0" });
        server.log.info("Server listening on port 3001");
        // Start cleanup job for stale sessions
        setInterval(() => {
            sessionManager.cleanupStaleSessions().catch((error) => {
                server.log.error("Failed to cleanup stale sessions:", error);
            });
        }, 60 * 60 * 1000); // Run every hour
    }
    catch (err) {
        server.log.error(err);
        process.exit(1);
    }
};
start();

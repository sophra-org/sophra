import fastify, { FastifyReply, FastifyRequest } from "fastify";
import { z } from "zod";
import { PrismaClient } from "../../../prisma/test-analyzer-client";
import { TestAnalyzer } from "./services/analyzer";
import { TestFixer } from "./services/fixer";
import { TestGenerator } from "./services/generator";
import { SessionManager } from "./services/session";
import { TestFile } from "./types";

const prisma = new PrismaClient();
const server = fastify({ logger: true });

// Initialize services
const analyzer = TestAnalyzer.getInstance();
const fixer = TestFixer.getInstance();
const generator = TestGenerator.getInstance();
const sessionManager = SessionManager.getInstance();

async function convertPrismaTestFileToType(
  prismaTestFile: any
): Promise<TestFile> {
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
const analyzeRequestSchema = z.object({
  testFile: z.string(),
  context: z
    .object({
      testPattern: z.string().optional(),
      coverage: z
        .object({
          current: z.number(),
          target: z.number(),
        })
        .optional(),
      performance: z
        .object({
          avgDuration: z.number(),
          maxDuration: z.number(),
        })
        .optional(),
      metadata: z.record(z.any()).optional(),
    })
    .optional(),
});

const fixRequestSchema = z.object({
  sessionId: z.string(),
  testFile: z.string(),
  issues: z.array(
    z.object({
      type: z.string(),
      description: z.string(),
      area: z.string().optional(),
    })
  ),
});

const generateRequestSchema = z.object({
  sessionId: z.string(),
  testFile: z.string(),
  options: z.object({
    type: z.enum(["coverage", "enhancement", "regression", "edge"]),
    targetArea: z.string().optional(),
  }),
});

// Routes
server.post(
  "/analyze",
  async (
    request: FastifyRequest<{
      Body: z.infer<typeof analyzeRequestSchema>;
    }>,
    reply: FastifyReply
  ) => {
    try {
      const { testFile: testPath, context } = analyzeRequestSchema.parse(
        request.body
      );

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
      const analysisResults = await analyzer.analyzeTests([testFile]);
      const result = analysisResults.get(testFile.filePath)!;

      return reply.send({
        sessionId,
        result,
      });
    } catch (error) {
      request.log.error(error);
      return reply.status(500).send({ error: (error as Error).message });
    }
  }
);

server.post(
  "/fix",
  async (
    request: FastifyRequest<{
      Body: z.infer<typeof fixRequestSchema>;
    }>,
    reply: FastifyReply
  ) => {
    try {
      const {
        sessionId,
        testFile: testPath,
        issues,
      } = fixRequestSchema.parse(request.body);

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
    } catch (error) {
      request.log.error(error);
      return reply.status(500).send({ error: (error as Error).message });
    }
  }
);

server.post(
  "/generate",
  async (
    request: FastifyRequest<{
      Body: z.infer<typeof generateRequestSchema>;
    }>,
    reply: FastifyReply
  ) => {
    try {
      const {
        sessionId,
        testFile: testPath,
        options,
      } = generateRequestSchema.parse(request.body);

      // Get test file record
      const prismaTestFile = await prisma.testFile.findUnique({
        where: { filePath: testPath },
      });

      if (!prismaTestFile) {
        return reply.status(404).send({ error: "Test file not found" });
      }

      const testFile = await convertPrismaTestFileToType(prismaTestFile);

      // Generate tests
      const result = await generator.generateTests(
        sessionId,
        testFile,
        options
      );

      return reply.send(result);
    } catch (error) {
      request.log.error(error);
      return reply.status(500).send({ error: (error as Error).message });
    }
  }
);

server.get(
  "/session/:id",
  async (
    request: FastifyRequest<{ Params: { id: string } }>,
    reply: FastifyReply
  ) => {
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
    } catch (error) {
      request.log.error(error);
      return reply.status(500).send({ error: (error as Error).message });
    }
  }
);

server.post(
  "/session/:id/pause",
  async (
    request: FastifyRequest<{ Params: { id: string } }>,
    reply: FastifyReply
  ) => {
    try {
      await sessionManager.pauseSession(request.params.id);
      return reply.send({ status: "paused" });
    } catch (error) {
      request.log.error(error);
      return reply.status(500).send({ error: (error as Error).message });
    }
  }
);

server.post(
  "/session/:id/resume",
  async (
    request: FastifyRequest<{ Params: { id: string } }>,
    reply: FastifyReply
  ) => {
    try {
      await sessionManager.resumeSession(request.params.id);
      return reply.send({ status: "resumed" });
    } catch (error) {
      request.log.error(error);
      return reply.status(500).send({ error: (error as Error).message });
    }
  }
);

server.post(
  "/session/:id/complete",
  async (
    request: FastifyRequest<{ Params: { id: string } }>,
    reply: FastifyReply
  ) => {
    try {
      await sessionManager.completeSession(request.params.id);
      return reply.send({ status: "completed" });
    } catch (error) {
      request.log.error(error);
      return reply.status(500).send({ error: (error as Error).message });
    }
  }
);

// Start server
const start = async () => {
  try {
    await server.listen({ port: 3001, host: "0.0.0.0" });
    server.log.info("Server listening on port 3001");

    // Start cleanup job for stale sessions
    setInterval(
      () => {
        sessionManager.cleanupStaleSessions().catch((error) => {
          server.log.error("Failed to cleanup stale sessions:", error);
        });
      },
      60 * 60 * 1000
    ); // Run every hour
  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }
};

start();

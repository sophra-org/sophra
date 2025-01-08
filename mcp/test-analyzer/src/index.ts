import { PrismaClient } from "@prisma/client";
import fastify from "fastify";
import { z } from "zod";
import { analyzeTest } from "./services/analyzer";
import { fixTest } from "./services/fixer";
import { generateTests } from "./services/generator";

const prisma = new PrismaClient();
const server = fastify();

// MCP Protocol Implementation
server.post("/analyze", async (request, reply) => {
  const schema = z.object({
    testPath: z.string(),
    sessionId: z.string().optional(),
  });

  const { testPath, sessionId } = schema.parse(request.body);
  const result = await analyzeTest(testPath, sessionId);
  return result;
});

server.post("/fix", async (request, reply) => {
  const schema = z.object({
    testPath: z.string(),
    problem: z.string(),
    sessionId: z.string().optional(),
  });

  const { testPath, problem, sessionId } = schema.parse(request.body);
  const result = await fixTest(testPath, problem, sessionId);
  return result;
});

server.post("/generate", async (request, reply) => {
  const schema = z.object({
    testPath: z.string(),
    coverage: z.number(),
    sessionId: z.string().optional(),
  });

  const { testPath, coverage, sessionId } = schema.parse(request.body);
  const result = await generateTests(testPath, coverage, sessionId);
  return result;
});

const start = async () => {
  try {
    await server.listen({ port: 3001, host: "0.0.0.0" });
    console.log("Server running at http://localhost:3001/");
  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }
};

start();

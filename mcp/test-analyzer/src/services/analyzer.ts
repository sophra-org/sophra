import { PrismaClient } from "@prisma/client";
import { readFileSync } from "fs";
import { resolve } from "path";
import { TestFile } from "../types";

const prisma = new PrismaClient();

export async function analyzeTest(
  testPath: string,
  sessionId?: string
): Promise<TestFile> {
  // Read the test file
  const absolutePath = resolve(process.cwd(), testPath);
  const content = readFileSync(absolutePath, "utf-8");

  // Get or create test file record
  let testFile = await prisma.testFile.findUnique({
    where: { filePath: testPath },
  });

  if (!testFile) {
    testFile = await prisma.testFile.create({
      data: {
        filePath: testPath,
        fileName: testPath.split("/").pop() || "",
      },
    });
  }

  // Run the test and collect metrics
  try {
    const { execSync } = require("child_process");
    const result = execSync(`npx vitest run ${testPath} --coverage`, {
      encoding: "utf-8",
    });

    // Parse test results and coverage
    const passed = !result.includes("FAIL");
    const coverage = extractCoverage(result);

    // Update test file metrics
    await prisma.testFile.update({
      where: { id: testFile.id },
      data: {
        totalRuns: { increment: 1 },
        currentPassRate: passed ? 1 : 0,
        avgPassRate: {
          set:
            (testFile.avgPassRate * testFile.totalRuns + (passed ? 1 : 0)) /
            (testFile.totalRuns + 1),
        },
        currentCoverage: coverage,
        avgCoverage: {
          set:
            (testFile.avgCoverage * testFile.totalRuns + coverage) /
            (testFile.totalRuns + 1),
        },
      },
    });

    // Record execution
    await prisma.testExecution.create({
      data: {
        testFileId: testFile.id,
        passed,
        duration: extractDuration(result),
        testResults: result,
        environment: process.env.NODE_ENV || "development",
      },
    });

    // Record coverage
    await prisma.testCoverage.create({
      data: {
        testFileId: testFile.id,
        coveragePercent: coverage,
        linesCovered: extractLinesCovered(result),
        linesUncovered: extractLinesUncovered(result),
        coverageType: "unit",
      },
    });

    return testFile;
  } catch (error) {
    console.error("Error analyzing test:", error);
    throw error;
  }
}

function extractCoverage(result: string): number {
  // Extract coverage percentage from vitest output
  const match = result.match(/Coverage: (\d+\.\d+)%/);
  return match ? parseFloat(match[1]) : 0;
}

function extractDuration(result: string): number {
  // Extract test duration from vitest output
  const match = result.match(/Time: (\d+\.\d+)s/);
  return match ? parseFloat(match[1]) : 0;
}

function extractLinesCovered(result: string): any {
  // Extract covered lines from vitest coverage output
  return {}; // TODO: Implement actual coverage parsing
}

function extractLinesUncovered(result: string): any {
  // Extract uncovered lines from vitest coverage output
  return {}; // TODO: Implement actual coverage parsing
}

import * as fs from "fs/promises";
import { glob } from "glob";
import inquirer from "inquirer";
import ora from "ora";
import * as path from "path";
import {
  PrismaClient,
  TestHealthScore,
} from "../../../prisma/test-analyzer-client";
import { analyzeTest } from "./services/analyzer";
import { TestFile } from "./types";

const prisma = new PrismaClient();

interface TestScanResult {
  filePath: string;
  fileName: string;
  totalTests: number;
  isNew: boolean;
}

async function findTestFiles(
  pattern: string = "**/*.test.ts"
): Promise<string[]> {
  try {
    return await glob(pattern, {
      ignore: ["**/node_modules/**", "**/dist/**"],
      absolute: true,
    });
  } catch (error) {
    console.error("Error finding test files:", error);
    return [];
  }
}

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

async function scanTestFiles(): Promise<TestScanResult[]> {
  const spinner = ora("Scanning for test files...").start();
  try {
    const files = await findTestFiles();
    const results: TestScanResult[] = [];

    for (const filePath of files) {
      const content = await fs.readFile(filePath, "utf-8");
      const fileName = path.basename(filePath);
      const testCount = (content.match(/\b(it|test)\s*\(/g) || []).length;

      const existingFile = await prisma.testFile.findUnique({
        where: { filePath },
      });

      results.push({
        filePath,
        fileName,
        totalTests: testCount,
        isNew: !existingFile,
      });
    }

    spinner.succeed(`Found ${results.length} test files`);
    return results;
  } catch (error) {
    spinner.fail("Error scanning test files");
    throw error;
  }
}

async function analyzeTestFile(filePath: string) {
  const spinner = ora(`Analyzing ${path.basename(filePath)}...`).start();
  try {
    const testFile = await prisma.testFile.upsert({
      where: { filePath },
      create: {
        filePath,
        fileName: path.basename(filePath),
        firstSeen: new Date(),
        lastUpdated: new Date(),
        totalRuns: 0,
        avgPassRate: 0,
        currentPassRate: 0,
        avgDuration: 0,
        currentCoverage: 0,
        avgCoverage: 0,
        totalFixes: 0,
        flakyTests: 0,
        totalTests: 0,
        criticalTests: 0,
        healthScore: TestHealthScore.POOR,
      },
      update: {
        lastUpdated: new Date(),
      },
    });

    const typedTestFile = await convertPrismaTestFileToType(testFile);
    const result = await analyzeTest(typedTestFile);

    spinner.succeed(`Analysis complete for ${path.basename(filePath)}`);
    return result;
  } catch (error) {
    spinner.fail(`Error analyzing ${path.basename(filePath)}`);
    throw error;
  }
}

async function main() {
  try {
    const testFiles = await scanTestFiles();

    if (testFiles.length === 0) {
      console.log("No test files found");
      return;
    }

    const { selectedFiles } = await inquirer.prompt([
      {
        type: "checkbox",
        name: "selectedFiles",
        message: "Select test files to analyze:",
        choices: testFiles.map((file) => ({
          name: `${file.fileName} (${file.totalTests} tests)${
            file.isNew ? " [NEW]" : ""
          }`,
          value: file.filePath,
        })),
      },
    ]);

    for (const filePath of selectedFiles) {
      await analyzeTestFile(filePath);
    }

    console.log("Analysis complete!");
  } catch (error) {
    console.error("Error:", error);
    process.exit(1);
  }
}

main();

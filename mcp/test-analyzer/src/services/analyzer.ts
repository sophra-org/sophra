import { execSync } from "child_process";
import * as fs from "fs/promises";
import * as os from "os";
import * as path from "path";
import { TestHealthScore } from "../../../../prisma/test-analyzer-client";
import { TestFile } from "../types";
import { ThreadPool } from "../utils";
import { prisma } from "../utils/prisma";
import { DeepSeekClient } from "./client";
import { PatternContext } from "./patterns";
import { SessionContext, SessionManager } from "./session";

// Calculate optimal number of concurrent analyses based on system resources
const cpuCount = os.cpus().length;
const systemMemoryGB = os.totalmem() / 1024 / 1024 / 1024;
const MAX_CONCURRENT_ANALYSES = Math.max(
  // Use 75% of available CPU cores, minimum of 4, maximum of 16
  Math.min(Math.floor(cpuCount * 0.75), 16),
  // Or scale based on available memory (1 worker per 2GB, max 16)
  Math.min(Math.floor(systemMemoryGB / 2), 16),
  // But never less than 4
  4
);

export interface AnalysisContext extends SessionContext {
  testFile: TestFile;
  coverage?: {
    current: number;
    target: number;
  };
  performance?: {
    avgDuration: number;
    maxDuration: number;
  };
}

export interface AnalysisResult {
  patterns: {
    type: string;
    description: string;
    impact: string;
  }[];
  antiPatterns: {
    type: string;
    description: string;
    risk: string;
    suggestion: string;
  }[];
  suggestions: {
    type: string;
    description: string;
    priority: number;
    effort: number;
  }[];
  metrics: {
    healthScore: TestHealthScore;
    coverage: number;
    passRate: number;
    avgDuration: number;
  };
}

export class TestAnalyzer {
  private static instance: TestAnalyzer;
  private sessionManager: SessionManager;
  private deepseek: DeepSeekClient;
  private threadPool: ThreadPool;
  private currentSessionId: string = "";

  private constructor() {
    this.sessionManager = SessionManager.getInstance();
    this.deepseek = DeepSeekClient.getInstance();
    this.threadPool = new ThreadPool(MAX_CONCURRENT_ANALYSES);
  }

  public static getInstance(): TestAnalyzer {
    if (!TestAnalyzer.instance) {
      TestAnalyzer.instance = new TestAnalyzer();
    }
    return TestAnalyzer.instance;
  }

  async startAnalysis(
    testFile: TestFile,
    context: Partial<AnalysisContext> = {}
  ): Promise<string> {
    // Create a new session
    const session = await prisma.analysisSession.create({
      data: {
        status: "ACTIVE",
        context: context as any,
        testFiles: {
          connect: { id: testFile.id },
        },
      },
    });

    this.currentSessionId = session.id;
    return session.id;
  }

  async analyzeTests(
    testFiles: TestFile[]
  ): Promise<Map<string, AnalysisResult>> {
    console.log(`Starting analysis of ${testFiles.length} test files...`);
    const results = new Map<string, AnalysisResult>();

    return new Promise((resolve, reject) => {
      let completedTasks = 0;
      let hasError = false;

      this.threadPool.on("taskComplete", ({ taskId, result }) => {
        console.log(`\n✓ Task ${taskId} completed successfully`);
        results.set(taskId, result);
        completedTasks++;

        if (completedTasks === testFiles.length && !hasError) {
          console.log(`\n✓ All ${testFiles.length} analyses completed`);
          resolve(results);
        }
      });

      this.threadPool.on("taskError", ({ taskId, error }) => {
        console.error(`\n✗ Task ${taskId} failed:`, error);
        hasError = true;
        reject(error);
      });

      // Create tasks with immediate logging
      const tasks = testFiles.map((testFile) => ({
        id: testFile.filePath,
        task: async () => {
          try {
            const result = await this.analyzeTestFile(testFile);
            console.log(`✓ Completed analysis of ${testFile.fileName}`);
            return result;
          } catch (error) {
            console.error(`✗ Failed analysis of ${testFile.fileName}:`, error);
            throw error;
          }
        },
      }));

      // Start processing tasks
      this.threadPool.runTasks(tasks).catch(reject);
    });
  }

  private async analyzeTestFile(testFile: TestFile): Promise<AnalysisResult> {
    console.log(`Analyzing ${testFile.fileName}...`);
    try {
      // Read test file and related source files
      const { testContent, sourceFiles } =
        await this.gatherTestContext(testFile);
      console.log(`- Gathered context for ${testFile.fileName}`);

      // Extract test framework and dependencies
      const context = await this.extractContext(testFile);
      console.log(`- Extracted framework context for ${testFile.fileName}`);

      // Run test and collect metrics
      const metrics = await this.collectMetrics(testFile);
      console.log(`- Collected metrics for ${testFile.fileName}`);

      // Analyze patterns and anti-patterns using DeepSeek
      console.log(`- Starting DeepSeek analysis for ${testFile.fileName}`);
      const analysis = await this.deepseek.analyzeTestStructure(
        testContent,
        context
      );
      console.log(`- Completed DeepSeek analysis for ${testFile.fileName}`);

      // Analyze coverage gaps
      const coverageAnalysis = await this.analyzeCoverage(
        testFile,
        sourceFiles,
        metrics
      );
      console.log(`- Analyzed coverage for ${testFile.fileName}`);

      // Check for reliability issues
      const reliabilityAnalysis = await this.analyzeReliability(
        testFile,
        testContent
      );
      console.log(`- Analyzed reliability for ${testFile.fileName}`);

      // Generate comprehensive suggestions
      const suggestions = await this.generateSuggestions(
        analysis,
        coverageAnalysis,
        reliabilityAnalysis,
        metrics
      );

      const result: AnalysisResult = {
        patterns: analysis.patterns,
        antiPatterns: analysis.antiPatterns,
        suggestions,
        metrics,
      };

      // Immediately record the results
      await this.upsertAnalysisResult(testFile, result, context);
      console.log(`✓ Recorded analysis results for ${testFile.fileName}`);

      return result;
    } catch (error) {
      console.error(`✗ Error analyzing ${testFile.fileName}:`, error);
      // Still record the failure in the database
      await this.recordAnalysisFailure(testFile, error);
      throw error;
    }
  }

  private async recordAnalysisFailure(
    testFile: TestFile,
    error: any
  ): Promise<void> {
    console.log(`\nRecording analysis failure for ${testFile.fileName}...`);
    try {
      await prisma.$transaction(async (tx) => {
        const execution = await tx.testExecution.create({
          data: {
            testFile: { connect: { id: testFile.id } },
            passed: false,
            duration: 0,
            errorMessage: error.message || String(error),
            testResults: { error: error.message || String(error) } as any,
            environment: process.env.NODE_ENV || "development",
            executedAt: new Date(),
          },
        });
        console.log(`✓ Created failure record: ${execution.id}`);

        await tx.testFile.update({
          where: { id: testFile.id },
          data: {
            lastFailureReason: error.message || String(error),
            lastUpdated: new Date(),
            totalRuns: { increment: 1 },
          },
        });
        console.log(`✓ Updated test file with failure info`);
      });
      console.log(`✓ Failure recording completed for ${testFile.fileName}`);
    } catch (dbError) {
      console.error(
        `✗ Failed to record analysis failure for ${testFile.fileName}:`,
        dbError
      );
      console.error("Detailed error:", {
        error: dbError,
        testFile: {
          id: testFile.id,
          fileName: testFile.fileName,
        },
        originalError: error,
      });
    }
  }

  private async upsertAnalysisResult(
    testFile: TestFile,
    result: AnalysisResult,
    context: PatternContext
  ): Promise<void> {
    const timestamp = new Date();
    console.log(`\nStarting database operations for ${testFile.fileName}...`);

    try {
      // Use a transaction to ensure all related records are created atomically
      await prisma.$transaction(async (tx) => {
        console.log(`- Creating analysis record for ${testFile.fileName}`);
        const analysis = await tx.testAnalysis.create({
          data: {
            session: { connect: { id: this.currentSessionId } },
            testFile: { connect: { id: testFile.id } },
            patterns: result.patterns as any,
            antiPatterns: result.antiPatterns as any,
            suggestions: result.suggestions as any,
            context: context as any,
            timestamp,
          },
        });
        console.log(`✓ Created analysis record: ${analysis.id}`);

        console.log(`- Updating metrics for ${testFile.fileName}`);
        const updatedFile = await tx.testFile.update({
          where: { id: testFile.id },
          data: {
            currentCoverage: result.metrics.coverage,
            avgCoverage: (testFile.avgCoverage + result.metrics.coverage) / 2,
            currentPassRate: result.metrics.passRate,
            avgPassRate: (testFile.avgPassRate + result.metrics.passRate) / 2,
            avgDuration: result.metrics.avgDuration,
            healthScore: result.metrics.healthScore,
            lastUpdated: timestamp,
            totalRuns: { increment: 1 },
          },
        });
        console.log(`✓ Updated test file metrics: ${updatedFile.id}`);

        console.log(`- Recording execution for ${testFile.fileName}`);
        const execution = await tx.testExecution.create({
          data: {
            testFile: { connect: { id: testFile.id } },
            passed: result.metrics.passRate === 100,
            duration: result.metrics.avgDuration,
            testResults: result.patterns as any,
            environment: process.env.NODE_ENV || "development",
            executedAt: timestamp,
          },
        });
        console.log(`✓ Created execution record: ${execution.id}`);

        console.log(`- Recording coverage for ${testFile.fileName}`);
        const coverage = await tx.testCoverage.create({
          data: {
            testFile: { connect: { id: testFile.id } },
            coveragePercent: result.metrics.coverage,
            linesCovered: [], // Would need actual coverage data
            linesUncovered: [], // Would need actual coverage data
            coverageType: "static",
            measuredAt: timestamp,
          },
        });
        console.log(`✓ Created coverage record: ${coverage.id}`);
      });

      console.log(
        `✓ All database operations completed for ${testFile.fileName}`
      );
    } catch (error) {
      console.error(`✗ Database error for ${testFile.fileName}:`, error);
      // Log the full error details for debugging
      console.error("Detailed error:", {
        error: error,
        testFile: {
          id: testFile.id,
          fileName: testFile.fileName,
        },
        sessionId: this.currentSessionId,
        timestamp: timestamp,
      });
      throw error;
    }
  }

  private async gatherTestContext(testFile: TestFile): Promise<{
    testContent: string;
    sourceFiles: Map<string, string>;
  }> {
    const testContent = await fs.readFile(testFile.filePath, "utf-8");
    const sourceFiles = new Map<string, string>();

    // Find potential source files by removing .test from the path
    const potentialSourcePath = testFile.filePath.replace(".test.", ".");
    if (await this.fileExists(potentialSourcePath)) {
      sourceFiles.set(
        potentialSourcePath,
        await fs.readFile(potentialSourcePath, "utf-8")
      );
    }

    // Find imported files
    const importMatches = testContent.matchAll(
      /import\s+.*?from\s+['"](.+?)['"]/g
    );
    for (const match of importMatches) {
      const importPath = match[1];
      const resolvedPath = await this.resolveImportPath(
        importPath,
        path.dirname(testFile.filePath)
      );
      if (resolvedPath && (await this.fileExists(resolvedPath))) {
        sourceFiles.set(resolvedPath, await fs.readFile(resolvedPath, "utf-8"));
      }
    }

    return { testContent, sourceFiles };
  }

  private async resolveImportPath(
    importPath: string,
    basePath: string
  ): Promise<string | null> {
    const extensions = [".ts", ".tsx", ".js", ".jsx"];
    for (const ext of extensions) {
      const fullPath = path.resolve(basePath, importPath + ext);
      if (await this.fileExists(fullPath)) {
        return fullPath;
      }
    }
    return null;
  }

  private async fileExists(filePath: string): Promise<boolean> {
    try {
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }

  private async extractContext(testFile: TestFile): Promise<PatternContext> {
    const packageJsonPath = path.join(
      path.dirname(testFile.filePath),
      "package.json"
    );
    let dependencies: string[] = [];
    let framework = "unknown";

    try {
      const packageJson = JSON.parse(
        await fs.readFile(packageJsonPath, "utf-8")
      );
      dependencies = [
        ...Object.keys(packageJson.dependencies || {}),
        ...Object.keys(packageJson.devDependencies || {}),
      ];

      // Detect framework
      if (dependencies.includes("vitest")) {
        framework = "vitest";
      } else if (dependencies.includes("jest")) {
        framework = "jest";
      }
    } catch (error) {
      // Package.json not found or invalid
    }

    return {
      fileType: path.extname(testFile.filePath),
      testType: this.detectTestType(testFile.fileName),
      framework,
      dependencies,
      metadata: {},
    };
  }

  private async collectMetrics(
    testFile: TestFile
  ): Promise<AnalysisResult["metrics"]> {
    try {
      // Run test in isolation with coverage
      const result = execSync(
        `npx vitest run ${testFile.filePath} --coverage`,
        {
          stdio: "pipe",
          encoding: "utf-8",
        }
      );

      // Parse coverage report
      const coverage = this.parseCoverageReport(result);
      const passRate =
        result.includes("Test Files") && !result.includes("FAIL") ? 100 : 0;
      const duration = this.parseTestDuration(result);

      return {
        healthScore: this.calculateHealthScore(coverage, passRate),
        coverage,
        passRate,
        avgDuration: duration,
      };
    } catch (error) {
      console.error("Error collecting metrics:", error);
      return {
        healthScore: "POOR",
        coverage: 0,
        passRate: 0,
        avgDuration: 0,
      };
    }
  }

  private async analyzeCoverage(
    testFile: TestFile,
    sourceFiles: Map<string, string>,
    metrics: AnalysisResult["metrics"]
  ) {
    const existingTests = await this.getExistingTests(testFile);
    const coverageData = await this.getCoverageData(testFile);

    // Get source content for the main file being tested
    const sourceContent = Array.from(sourceFiles.values())[0] || "";

    return this.deepseek.analyzeCoverageGaps(
      sourceContent,
      coverageData,
      existingTests
    );
  }

  private async analyzeReliability(testFile: TestFile, testContent: string) {
    const executionHistory = await prisma.testExecution.findMany({
      where: { testFileId: testFile.id },
      orderBy: { executedAt: "desc" },
      take: 20, // Look at last 20 executions
    });

    return this.deepseek.analyzeTestReliability(
      testContent,
      executionHistory.map((exec) => ({
        timestamp: exec.executedAt,
        passed: exec.passed,
        duration: exec.duration,
        ...(exec.errorMessage ? { error: exec.errorMessage } : {}),
      }))
    );
  }

  private async generateSuggestions(
    analysis: any,
    coverageAnalysis: any,
    reliabilityAnalysis: any,
    metrics: AnalysisResult["metrics"]
  ): Promise<AnalysisResult["suggestions"]> {
    const suggestions: AnalysisResult["suggestions"] = [];

    // Add suggestions from pattern analysis
    suggestions.push(...analysis.suggestions);

    // Add suggestions from coverage gaps
    coverageAnalysis.gaps.forEach((gap: any) => {
      suggestions.push({
        type: "COVERAGE",
        description: `Add tests for: ${gap.description}`,
        priority: gap.priority,
        effort: 2,
      });
    });

    // Add suggestions from reliability analysis
    if (reliabilityAnalysis.isFlaky) {
      reliabilityAnalysis.issues.forEach((issue: any) => {
        suggestions.push({
          type: "RELIABILITY",
          description: `Fix flaky test: ${issue.description}`,
          priority: 1, // High priority for flaky tests
          effort: 3,
        });
      });
    }

    return suggestions;
  }

  private async updateTestFileMetrics(
    testFile: TestFile,
    metrics: AnalysisResult["metrics"]
  ): Promise<void> {
    await prisma.testFile.update({
      where: { id: testFile.id },
      data: {
        currentCoverage: metrics.coverage,
        avgCoverage: (testFile.avgCoverage + metrics.coverage) / 2,
        currentPassRate: metrics.passRate,
        avgPassRate: (testFile.avgPassRate + metrics.passRate) / 2,
        avgDuration: metrics.avgDuration,
        healthScore: metrics.healthScore,
        lastUpdated: new Date(),
      },
    });
  }

  private calculateHealthScore(
    coverage: number,
    passRate: number
  ): TestHealthScore {
    if (coverage > 90 && passRate === 100) {
      return "EXCELLENT";
    } else if (coverage > 80 && passRate > 90) {
      return "GOOD";
    } else if (coverage > 60 && passRate > 80) {
      return "FAIR";
    } else if (coverage > 40 && passRate > 60) {
      return "POOR";
    } else {
      return "CRITICAL";
    }
  }

  private parseCoverageReport(output: string): number {
    const match = output.match(/(?:Coverage|All files)[^\d]*?([\d.]+)%/i);
    return match ? parseFloat(match[1]) : 0;
  }

  private parseTestDuration(output: string): number {
    const match = output.match(/Time:[\s\n]*([\d.]+)s/i);
    return match ? parseFloat(match[1]) : 0;
  }

  private async getExistingTests(testFile: TestFile): Promise<string[]> {
    const content = await fs.readFile(testFile.filePath, "utf-8");
    const testBlocks = content.match(/(?:it|test)\s*\(\s*['"](.+?)['"]/g) || [];
    return testBlocks.map((block) => block.match(/['"](.+?)['"]/)?.[1] || "");
  }

  private async getCoverageData(testFile: TestFile) {
    const latestCoverage = await prisma.testCoverage.findFirst({
      where: { testFileId: testFile.id },
      orderBy: { measuredAt: "desc" },
    });

    return {
      overall: latestCoverage?.coveragePercent || 0,
      lines: {
        covered: latestCoverage?.linesCovered || [],
        uncovered: latestCoverage?.linesUncovered || [],
      },
      branches: latestCoverage?.branchCoverage || {},
      functions: latestCoverage?.functionCoverage || {},
    };
  }

  private detectTestType(fileName: string): string {
    if (fileName.includes(".unit.")) return "unit";
    if (fileName.includes(".integration.")) return "integration";
    if (fileName.includes(".e2e.")) return "e2e";
    return "unknown";
  }
}

export async function analyzeTest(
  testFile: TestFile,
  context: Partial<AnalysisContext> = {}
): Promise<AnalysisResult> {
  const analyzer = TestAnalyzer.getInstance();
  const sessionId = await analyzer.startAnalysis(testFile, context);
  const results = await analyzer.analyzeTests([testFile]);
  return results.get(testFile.filePath)!;
}

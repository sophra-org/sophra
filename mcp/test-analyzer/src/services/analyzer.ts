import { execSync } from "child_process";
import * as fs from "fs/promises";
import * as path from "path";
import {
  PrismaClient,
  TestHealthScore,
} from "../../../../prisma/test-analyzer-client";
import { TestFile } from "../types";
import { DeepSeekClient } from "./client";
import { PatternContext } from "./patterns";
import { SessionContext, SessionManager, SessionOperation } from "./session";

const prisma = new PrismaClient();

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

  private constructor() {
    this.sessionManager = SessionManager.getInstance();
    this.deepseek = DeepSeekClient.getInstance();
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
    const session = await this.sessionManager.createSession({
      ...context,
      testPattern: testFile.fileName,
    });

    await this.sessionManager.addTestFile(session.id, testFile);

    const operation: SessionOperation = {
      type: "START_ANALYSIS",
      target: testFile.filePath,
      params: context,
      result: { sessionId: session.id },
      timestamp: new Date(),
    };

    await this.sessionManager.recordOperation(session.id, operation);
    return session.id;
  }

  async analyzeTest(
    sessionId: string,
    testFile: TestFile
  ): Promise<AnalysisResult> {
    const session = await this.sessionManager.getSession(sessionId);
    if (!session) throw new Error(`Session not found: ${sessionId}`);

    // Read test file and related source files
    const { testContent, sourceFiles } = await this.gatherTestContext(testFile);

    // Extract test framework and dependencies
    const context = await this.extractContext(testFile);

    // Run test and collect metrics
    const metrics = await this.collectMetrics(testFile);

    // Analyze patterns and anti-patterns using DeepSeek
    const analysis = await this.deepseek.analyzeTestStructure(
      testContent,
      context
    );

    // Analyze coverage gaps
    const coverageAnalysis = await this.analyzeCoverage(
      testFile,
      sourceFiles,
      metrics
    );

    // Check for reliability issues
    const reliabilityAnalysis = await this.analyzeReliability(
      testFile,
      testContent
    );

    // Generate comprehensive suggestions
    const suggestions = await this.generateSuggestions(
      analysis,
      coverageAnalysis,
      reliabilityAnalysis,
      metrics
    );

    // Record analysis
    const testAnalysis = await prisma.testAnalysis.create({
      data: {
        session: { connect: { id: sessionId } },
        testFile: { connect: { id: testFile.id } },
        patterns: analysis.patterns as any,
        antiPatterns: analysis.antiPatterns as any,
        suggestions: suggestions as any,
        context: context as any,
      },
    });

    // Update test file metrics
    await this.updateTestFileMetrics(testFile, metrics);

    const result: AnalysisResult = {
      patterns: analysis.patterns,
      antiPatterns: analysis.antiPatterns,
      suggestions,
      metrics,
    };

    // Record operation
    const operation: SessionOperation = {
      type: "COMPLETE_ANALYSIS",
      target: testFile.filePath,
      params: { context },
      result,
      timestamp: new Date(),
    };

    await this.sessionManager.recordOperation(sessionId, operation);
    return result;
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
  return analyzer.analyzeTest(sessionId, testFile);
}

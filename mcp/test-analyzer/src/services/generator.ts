import * as fs from "fs/promises";
import * as path from "path";
import {
  GenerationType,
  PrismaClient,
} from "../../../../prisma/test-analyzer-client";
import { TestFile } from "../types";
import { TestAnalyzer } from "./analyzer";
import { DeepSeekClient } from "./client";
import { SessionManager, SessionOperation } from "./session";

const prisma = new PrismaClient();

export interface GenerationResult {
  newTests: {
    description: string;
    code: string;
  }[];
  coverageImprovement: number;
  targetArea: string;
  strategy: string;
}

export class TestGenerator {
  private static instance: TestGenerator;
  private sessionManager: SessionManager;
  private analyzer: TestAnalyzer;
  private deepseek: DeepSeekClient;

  private constructor() {
    this.sessionManager = SessionManager.getInstance();
    this.analyzer = TestAnalyzer.getInstance();
    this.deepseek = DeepSeekClient.getInstance();
  }

  public static getInstance(): TestGenerator {
    if (!TestGenerator.instance) {
      TestGenerator.instance = new TestGenerator();
    }
    return TestGenerator.instance;
  }

  async generateTests(
    sessionId: string,
    testFile: TestFile,
    options: {
      type: "coverage" | "enhancement" | "regression" | "edge";
      targetArea?: string;
    }
  ): Promise<GenerationResult> {
    const session = await this.sessionManager.getSession(sessionId);
    if (!session) throw new Error(`Session not found: ${sessionId}`);

    // Read test file and source files
    const { testContent, sourceFiles } = await this.gatherContext(testFile);

    // Analyze coverage gaps
    const coverageAnalysis = await this.deepseek.analyzeCoverageGaps(
      Array.from(sourceFiles.values())[0] || "",
      await this.getCoverageData(testFile),
      await this.getExistingTests(testFile)
    );

    // Generate new tests based on gaps
    const improvements = await this.deepseek.generateTestImprovements(
      testContent,
      Array.from(sourceFiles.values())[0] || "",
      coverageAnalysis.gaps.map((gap) => ({
        type: this.mapToImprovementType(options.type),
        description: gap.description,
        targetArea: gap.area,
      }))
    );

    // Apply the new tests
    const updatedContent = await this.applyNewTests(
      testFile,
      testContent,
      improvements.code
    );

    // Calculate coverage improvement
    const beforeMetrics = await this.analyzer.analyzeTest(sessionId, testFile);
    await fs.writeFile(testFile.filePath, updatedContent, "utf-8");
    const afterMetrics = await this.analyzer.analyzeTest(sessionId, testFile);
    const coverageImprovement =
      afterMetrics.metrics.coverage - beforeMetrics.metrics.coverage;

    // Record the generation
    const testGeneration = await prisma.testGeneration.create({
      data: {
        testFileId: testFile.id,
        generationType: this.mapToGenerationType(options.type),
        newTests: improvements.changes,
        accepted: true,
        targetArea: options.targetArea || "general",
        coverageImprovement,
        generationStrategy: "deepseek-coverage-analysis",
        context: {
          originalCoverage: beforeMetrics.metrics.coverage,
          finalCoverage: afterMetrics.metrics.coverage,
          changes: improvements.changes,
        },
      },
    });

    // Record operation
    const operation: SessionOperation = {
      type: "GENERATE_TESTS",
      target: testFile.filePath,
      params: options,
      result: {
        newTests: improvements.changes,
        coverageImprovement,
      },
      timestamp: new Date(),
    };

    await this.sessionManager.recordOperation(sessionId, operation);

    return {
      newTests: improvements.changes.map((change) => ({
        description: change.description,
        code: change.type,
      })),
      coverageImprovement,
      targetArea: options.targetArea || "general",
      strategy: "deepseek-coverage-analysis",
    };
  }

  private mapToGenerationType(type: string): GenerationType {
    const typeMap: Record<string, GenerationType> = {
      coverage: GenerationType.COVERAGE_GAP,
      enhancement: GenerationType.ENHANCEMENT,
      regression: GenerationType.REGRESSION,
      edge: GenerationType.EDGE_CASE,
    };

    return typeMap[type] || GenerationType.COVERAGE_GAP;
  }

  private mapToImprovementType(
    type: "coverage" | "enhancement" | "regression" | "edge"
  ): "coverage" | "enhancement" | "fix" {
    const typeMap: Record<
      "coverage" | "enhancement" | "regression" | "edge",
      "coverage" | "enhancement" | "fix"
    > = {
      coverage: "coverage",
      enhancement: "enhancement",
      regression: "fix",
      edge: "enhancement",
    };

    return typeMap[type];
  }

  private async gatherContext(testFile: TestFile): Promise<{
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

  private async applyNewTests(
    testFile: TestFile,
    currentContent: string,
    newTests: string
  ): Promise<string> {
    // Create a backup
    const backupPath = `${testFile.filePath}.bak`;
    await fs.writeFile(backupPath, currentContent);

    try {
      // Find the last import statement
      const lastImportMatch = Array.from(
        currentContent.matchAll(/^import .+$/gm)
      ).pop();
      const insertPosition = lastImportMatch
        ? lastImportMatch.index! + lastImportMatch[0].length
        : 0;

      // Insert new tests after imports
      const updatedContent =
        currentContent.slice(0, insertPosition) +
        "\n\n" +
        newTests +
        currentContent.slice(insertPosition);

      return updatedContent;
    } catch (error) {
      // Restore from backup if something goes wrong
      const backup = await fs.readFile(backupPath, "utf-8");
      await fs.writeFile(testFile.filePath, backup);
      throw error;
    } finally {
      // Clean up backup
      await fs.unlink(backupPath);
    }
  }
}

import * as fs from "fs/promises";
import * as path from "path";
import { FixType, PrismaClient } from "../../../../prisma/test-analyzer-client";
import { TestFile } from "../types";
import { TestAnalyzer } from "./analyzer";
import { DeepSeekClient } from "./client";
import { SessionManager, SessionOperation } from "./session";

const prisma = new PrismaClient();

export interface FixResult {
  code: string;
  explanation: string;
  changes: Array<{ type: string; description: string }>;
  metrics?: {
    coverage: number;
    passRate: number;
  };
}

export class TestFixer {
  private static instance: TestFixer;
  private sessionManager: SessionManager;
  private analyzer: TestAnalyzer;
  private deepseek: DeepSeekClient;

  private constructor() {
    this.sessionManager = SessionManager.getInstance();
    this.analyzer = TestAnalyzer.getInstance();
    this.deepseek = DeepSeekClient.getInstance();
  }

  public static getInstance(): TestFixer {
    if (!TestFixer.instance) {
      TestFixer.instance = new TestFixer();
    }
    return TestFixer.instance;
  }

  async fixTest(
    sessionId: string,
    testFile: TestFile,
    issues: Array<{
      type: string;
      description: string;
      area?: string;
    }>
  ): Promise<FixResult> {
    const session = await this.sessionManager.getSession(sessionId);
    if (!session) throw new Error(`Session not found: ${sessionId}`);

    // Read test file and source files
    const { testContent, sourceFiles } = await this.gatherContext(testFile);

    // Generate improvements using DeepSeek
    const improvements = await this.deepseek.generateTestImprovements(
      testContent,
      Array.from(sourceFiles.values())[0] || "",
      issues.map((issue) => ({
        type: "fix",
        description: issue.description,
        targetArea: issue.area,
      }))
    );

    // Apply the improvements
    await this.applyFix(testFile, improvements.code);

    // Map issue type to FixType enum
    const fixType = this.mapToFixType(issues[0].type);

    // Record the fix
    const testFix = await prisma.testFix.create({
      data: {
        testFileId: testFile.id,
        fixType,
        problem: issues[0].description,
        solution: improvements.explanation,
        successful: true,
        confidenceScore: 0.8,
        beforeState: { content: testContent },
        afterState: { content: improvements.code },
        patternUsed: improvements.changes[0]?.type,
        impactScore: 0.7,
        appliedAt: new Date(),
      },
    });

    // Re-analyze the test to get updated metrics
    const analysisResults = await this.analyzer.analyzeTests([testFile]);
    const analysis = analysisResults.get(testFile.filePath)!;

    // Record operation
    const operation: SessionOperation = {
      type: "APPLY_FIX",
      target: testFile.filePath,
      params: { issues },
      result: {
        changes: improvements.changes,
        metrics: {
          coverage: analysis.metrics.coverage,
          passRate: analysis.metrics.passRate,
        },
      },
      timestamp: new Date(),
    };

    await this.sessionManager.recordOperation(sessionId, operation);

    return {
      ...improvements,
      metrics: {
        coverage: analysis.metrics.coverage,
        passRate: analysis.metrics.passRate,
      },
    };
  }

  private mapToFixType(type: string): FixType {
    const typeMap: Record<string, FixType> = {
      async: FixType.ASYNC,
      mock: FixType.MOCK,
      setup: FixType.SETUP,
      teardown: FixType.TEARDOWN,
      assertion: FixType.ASSERTION,
      timing: FixType.TIMING,
      dependency: FixType.DEPENDENCY,
      logic: FixType.LOGIC,
    };

    return typeMap[type.toLowerCase()] || FixType.OTHER;
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

  private async applyFix(testFile: TestFile, newCode: string): Promise<void> {
    // Create a backup
    const backupPath = `${testFile.filePath}.bak`;
    await fs.copyFile(testFile.filePath, backupPath);

    try {
      // Write the new code
      await fs.writeFile(testFile.filePath, newCode, "utf-8");
    } catch (error) {
      // Restore from backup if something goes wrong
      await fs.copyFile(backupPath, testFile.filePath);
      throw error;
    } finally {
      // Clean up backup
      await fs.unlink(backupPath);
    }
  }
}

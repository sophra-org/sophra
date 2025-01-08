import {
  FixPattern,
  PatternType,
  PrismaClient,
  TestPattern,
} from "../../../../prisma/test-analyzer-client";
import { TestFix } from "../types";

const prisma = new PrismaClient();

export interface PatternContext {
  fileType: string;
  testType: string;
  framework: string;
  dependencies: string[];
  metadata: Record<string, any>;
}

export interface PatternMatch {
  pattern: TestPattern | FixPattern;
  confidence: number;
  context: PatternContext;
}

export class PatternManager {
  private static instance: PatternManager;
  private constructor() {}

  public static getInstance(): PatternManager {
    if (!PatternManager.instance) {
      PatternManager.instance = new PatternManager();
    }
    return PatternManager.instance;
  }

  async learnTestPattern(
    pattern: string,
    type: PatternType,
    context: PatternContext
  ): Promise<TestPattern> {
    return prisma.testPattern.create({
      data: {
        pattern,
        type,
        context: context as any,
        successRate: 1.0, // Initial success rate
        usageCount: 1,
      },
    });
  }

  async learnFixPattern(
    problem: string,
    solution: string,
    context: PatternContext
  ): Promise<FixPattern> {
    return prisma.fixPattern.create({
      data: {
        problem,
        solution,
        context: context as any,
        successRate: 1.0, // Initial success rate
        usageCount: 1,
      },
    });
  }

  async updatePatternSuccess(
    patternId: string,
    successful: boolean,
    isFixPattern: boolean = false
  ): Promise<void> {
    const pattern = isFixPattern
      ? await prisma.fixPattern.findUnique({ where: { id: patternId } })
      : await prisma.testPattern.findUnique({ where: { id: patternId } });

    if (!pattern) throw new Error(`Pattern not found: ${patternId}`);

    const newSuccessRate =
      (pattern.successRate * pattern.usageCount + (successful ? 1 : 0)) /
      (pattern.usageCount + 1);

    if (isFixPattern) {
      await prisma.fixPattern.update({
        where: { id: patternId },
        data: {
          successRate: newSuccessRate,
          usageCount: { increment: 1 },
          lastUsed: new Date(),
        },
      });
    } else {
      await prisma.testPattern.update({
        where: { id: patternId },
        data: {
          successRate: newSuccessRate,
          usageCount: { increment: 1 },
          lastUsed: new Date(),
        },
      });
    }
  }

  async findSimilarTestPatterns(
    type: PatternType,
    context: PatternContext
  ): Promise<PatternMatch[]> {
    const patterns = await prisma.testPattern.findMany({
      where: {
        type,
        successRate: { gt: 0.5 }, // Only consider somewhat successful patterns
      },
      orderBy: [{ successRate: "desc" }, { usageCount: "desc" }],
    });

    return patterns.map((pattern) => ({
      pattern,
      confidence: this.calculateConfidence(pattern, context),
      context: (pattern.context as unknown as PatternContext) || {
        fileType: "",
        testType: "",
        framework: "",
        dependencies: [],
        metadata: {},
      },
    }));
  }

  async findSimilarFixPatterns(
    problem: string,
    context: PatternContext
  ): Promise<PatternMatch[]> {
    const patterns = await prisma.fixPattern.findMany({
      where: {
        successRate: { gt: 0.5 }, // Only consider somewhat successful patterns
      },
      orderBy: [{ successRate: "desc" }, { usageCount: "desc" }],
    });

    return patterns
      .map((pattern) => ({
        pattern,
        confidence: this.calculateFixConfidence(pattern, problem, context),
        context: (pattern.context as unknown as PatternContext) || {
          fileType: "",
          testType: "",
          framework: "",
          dependencies: [],
          metadata: {},
        },
      }))
      .filter((match) => match.confidence > 0.3); // Filter low confidence matches
  }

  async learnFromFix(fix: TestFix, context: PatternContext): Promise<void> {
    if (!fix.successful) return; // Only learn from successful fixes

    // Create or update fix pattern
    const existingPattern = await prisma.fixPattern.findFirst({
      where: {
        problem: fix.problem,
        solution: fix.solution,
      },
    });

    if (existingPattern) {
      await this.updatePatternSuccess(existingPattern.id, true, true);
    } else {
      await this.learnFixPattern(fix.problem, fix.solution, context);
    }
  }

  private calculateConfidence(
    pattern: TestPattern,
    context: PatternContext
  ): number {
    const patternContext = (pattern.context as unknown as PatternContext) || {
      fileType: "",
      testType: "",
      framework: "",
      dependencies: [],
      metadata: {},
    };
    let confidence = pattern.successRate;

    // Adjust confidence based on context match
    if (patternContext.fileType === context.fileType) confidence *= 1.2;
    if (patternContext.testType === context.testType) confidence *= 1.2;
    if (patternContext.framework === context.framework) confidence *= 1.1;

    // Consider dependency overlap
    const dependencyOverlap = context.dependencies.filter((dep) =>
      patternContext.dependencies.includes(dep)
    ).length;
    confidence *=
      1 + dependencyOverlap / Math.max(context.dependencies.length, 1);

    return Math.min(confidence, 1.0);
  }

  private calculateFixConfidence(
    pattern: FixPattern,
    problem: string,
    context: PatternContext
  ): number {
    const patternContext = (pattern.context as unknown as PatternContext) || {
      fileType: "",
      testType: "",
      framework: "",
      dependencies: [],
      metadata: {},
    };
    let confidence = pattern.successRate;

    // Check problem similarity
    const problemSimilarity = this.calculateStringSimilarity(
      pattern.problem,
      problem
    );
    confidence *= problemSimilarity;

    // Adjust confidence based on context match
    if (patternContext.fileType === context.fileType) confidence *= 1.2;
    if (patternContext.testType === context.testType) confidence *= 1.2;
    if (patternContext.framework === context.framework) confidence *= 1.1;

    return Math.min(confidence, 1.0);
  }

  private calculateStringSimilarity(str1: string, str2: string): number {
    // Simple Levenshtein distance-based similarity
    const distance = this.levenshteinDistance(
      str1.toLowerCase(),
      str2.toLowerCase()
    );
    const maxLength = Math.max(str1.length, str2.length);
    return 1 - distance / maxLength;
  }

  private levenshteinDistance(str1: string, str2: string): number {
    const m = str1.length;
    const n = str2.length;
    const dp: number[][] = Array(m + 1)
      .fill(0)
      .map(() => Array(n + 1).fill(0));

    for (let i = 0; i <= m; i++) dp[i][0] = i;
    for (let j = 0; j <= n; j++) dp[0][j] = j;

    for (let i = 1; i <= m; i++) {
      for (let j = 1; j <= n; j++) {
        if (str1[i - 1] === str2[j - 1]) {
          dp[i][j] = dp[i - 1][j - 1];
        } else {
          dp[i][j] = 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
        }
      }
    }

    return dp[m][n];
  }
}

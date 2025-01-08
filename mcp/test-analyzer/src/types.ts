import { TestHealthScore } from "../../../prisma/test-analyzer-client";

export interface TestFile {
  id: string;
  filePath: string;
  fileName: string;
  firstSeen: Date;
  lastUpdated: Date;
  totalRuns: number;
  avgPassRate: number;
  currentPassRate: number;
  avgDuration: number;
  currentCoverage: number;
  avgCoverage: number;
  totalFixes: number;
  flakyTests: number;
  metadata?: Record<string, any>;
  healthScore: TestHealthScore;
  totalTests: number;
  criticalTests: number;
  lastFailureReason?: string;
}

export interface TestPattern {
  id: string;
  type: string;
  pattern: string;
  context: Record<string, any>;
  successRate: number;
  usageCount: number;
  lastUsed: Date;
  createdAt: Date;
}

export interface TestExecution {
  id: string;
  testFileId: string;
  executedAt: Date;
  passed: boolean;
  duration: number;
  errorMessage?: string;
  testResults: Record<string, any>;
  environment: string;
  commitHash?: string;
  performance?: Record<string, any>;
}

export interface TestCoverage {
  id: string;
  testFileId: string;
  measuredAt: Date;
  coveragePercent: number;
  linesCovered: number[];
  linesUncovered: number[];
  branchCoverage?: Record<string, any>;
  functionCoverage?: Record<string, any>;
  suggestedAreas?: string[];
  coverageType: string;
}

export interface TestFix {
  id: string;
  testFileId: string;
  appliedAt: Date;
  fixType: string;
  problem: string;
  solution: string;
  successful: boolean;
  confidenceScore: number;
  beforeState: Record<string, any>;
  afterState: Record<string, any>;
  patternUsed?: string;
  impactScore: number;
}

export interface TestGeneration {
  id: string;
  testFileId: string;
  generatedAt: Date;
  generationType: string;
  newTests: Record<string, any>;
  accepted: boolean;
  targetArea: string;
  coverageImprovement: number;
  generationStrategy: string;
  context: Record<string, any>;
}

export interface TestAnalysis {
  id: string;
  sessionId: string;
  testFileId: string;
  patterns: Array<{
    type: string;
    description: string;
    impact: string;
  }>;
  antiPatterns: Array<{
    type: string;
    description: string;
    risk: string;
    suggestion: string;
  }>;
  suggestions: Array<{
    type: string;
    description: string;
    priority: number;
    effort: number;
  }>;
  context: Record<string, any>;
  timestamp: Date;
}

export interface AnalysisSession {
  id: string;
  startedAt: Date;
  endedAt?: Date;
  status: string;
  context?: Record<string, any>;
  decisions: Array<{
    type: string;
    context: Record<string, any>;
    outcome: string;
    reasoning: string;
    timestamp: Date;
  }>;
  operations: Array<{
    type: string;
    target: string;
    params: Record<string, any>;
    result: Record<string, any>;
    timestamp: Date;
  }>;
  testFiles: TestFile[];
  analyses: TestAnalysis[];
}

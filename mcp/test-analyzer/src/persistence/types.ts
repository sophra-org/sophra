export interface TestHistory {
  id: string;
  timestamp: string;
  file: string;
  name: string;
  status: 'pass' | 'fail';
  duration: number;
  errorType?: string;
  errorMessage?: string;
  fixAttempts?: FixAttempt[];
}

export interface FixAttempt {
  timestamp: string;
  strategy: string;
  changes: string;
  outcome: 'success' | 'failure';
  resultingError?: string;
}

export interface CoverageSnapshot {
  timestamp: string;
  overall: number;
  byModule: {
    [module: string]: {
      statements: number;
      branches: number;
      functions: number;
      lines: number;
      uncoveredLines: number[];
    }
  };
  newTests: string[];
}

export interface TestPattern {
  id: string;
  type: 'failure' | 'success';
  pattern: string;
  frequency: number;
  firstSeen: string;
  lastSeen: string;
  affectedTests: string[];
  solutions?: {
    strategy: string;
    successRate: number;
    examples: string[];
  }[];
}

export interface LearningProgress {
  timestamp: string;
  insights: {
    patternId: string;
    confidence: number;
    applications: number;
    successRate: number;
  }[];
  recommendations: {
    type: string;
    priority: number;
    rationale: string;
    suggestedAction: string;
  }[];
}

export interface TestKnowledgeBase {
  version: string;
  lastUpdated: string;
  testHistory: TestHistory[];
  coverageHistory: CoverageSnapshot[];
  patterns: TestPattern[];
  learningProgress: LearningProgress[];
  metadata: {
    totalTests: number;
    totalFixes: number;
    successfulFixes: number;
    coverageImprovement: number;
    commonPatterns: string[];
    criticalModules: string[];
  };
}

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import path from 'path';
import { TestKnowledgeBase, TestHistory, CoverageSnapshot, TestPattern, LearningProgress } from './types';

export class PersistentStore {
  private storePath: string;
  private data: TestKnowledgeBase;

  constructor(projectRoot: string) {
    this.storePath = path.join(projectRoot, '.test-analyzer');
    this.data = this.initializeStore();
  }

  private initializeStore(): TestKnowledgeBase {
    if (!existsSync(this.storePath)) {
      mkdirSync(this.storePath, { recursive: true });
    }

    const dbPath = path.join(this.storePath, 'knowledge.json');
    
    if (existsSync(dbPath)) {
      try {
        return JSON.parse(readFileSync(dbPath, 'utf-8'));
      } catch (error) {
        console.error('Error reading knowledge base:', error);
      }
    }

    // Initialize new knowledge base
    return {
      version: '1.0.0',
      lastUpdated: new Date().toISOString(),
      testHistory: [],
      coverageHistory: [],
      patterns: [],
      learningProgress: [],
      metadata: {
        totalTests: 0,
        totalFixes: 0,
        successfulFixes: 0,
        coverageImprovement: 0,
        commonPatterns: [],
        criticalModules: []
      }
    };
  }

  private save() {
    this.data.lastUpdated = new Date().toISOString();
    writeFileSync(
      path.join(this.storePath, 'knowledge.json'),
      JSON.stringify(this.data, null, 2)
    );
  }

  // Test History Management
  addTestResult(result: TestHistory) {
    const existingIndex = this.data.testHistory.findIndex(
      t => t.file === result.file && t.name === result.name
    );

    if (existingIndex >= 0) {
      this.data.testHistory[existingIndex] = result;
    } else {
      this.data.testHistory.push(result);
      this.data.metadata.totalTests++;
    }

    this.updatePatterns(result);
    this.save();
  }

  // Coverage Management
  addCoverageSnapshot(snapshot: CoverageSnapshot) {
    this.data.coverageHistory.push(snapshot);
    
    const previousSnapshot = this.data.coverageHistory[this.data.coverageHistory.length - 2];
    if (previousSnapshot) {
      this.data.metadata.coverageImprovement = snapshot.overall - previousSnapshot.overall;
    }
    
    this.save();
  }

  getCoverageHistory(): CoverageSnapshot[] {
    return this.data.coverageHistory;
  }

  // Pattern Recognition
  private updatePatterns(result: TestHistory) {
    if (!result.errorType) return;

    const pattern = this.identifyPattern(result);
    const existingPattern = this.data.patterns.find(p => p.pattern === pattern);

    if (existingPattern) {
      existingPattern.frequency++;
      existingPattern.lastSeen = result.timestamp;
      existingPattern.affectedTests = [...new Set([...existingPattern.affectedTests, result.id])];
    } else {
      this.data.patterns.push({
        id: `pattern_${this.data.patterns.length + 1}`,
        type: 'failure',
        pattern,
        frequency: 1,
        firstSeen: result.timestamp,
        lastSeen: result.timestamp,
        affectedTests: [result.id]
      });
    }

    this.updateCommonPatterns();
  }

  private identifyPattern(result: TestHistory): string {
    // Pattern identification logic based on error type and message
    const errorSignature = `${result.errorType}: ${result.errorMessage}`;
    return errorSignature;
  }

  private updateCommonPatterns() {
    const sortedPatterns = [...this.data.patterns]
      .sort((a, b) => b.frequency - a.frequency)
      .slice(0, 5);
    
    this.data.metadata.commonPatterns = sortedPatterns.map(p => p.pattern);
  }

  // Learning Progress
  addLearningProgress(progress: LearningProgress) {
    this.data.learningProgress.push(progress);
    this.save();
  }

  // Analytics & Insights
  getTestTrends() {
    return {
      totalTests: this.data.metadata.totalTests,
      fixSuccess: this.data.metadata.successfulFixes / this.data.metadata.totalFixes,
      coverageGain: this.data.metadata.coverageImprovement,
      commonPatterns: this.data.metadata.commonPatterns
    };
  }

  getPatternInsights() {
    return this.data.patterns.map(pattern => ({
      pattern: pattern.pattern,
      frequency: pattern.frequency,
      affectedTests: pattern.affectedTests.length,
      solutions: pattern.solutions?.map(s => ({
        strategy: s.strategy,
        successRate: s.successRate
      }))
    }));
  }

  getLearningEffectiveness() {
    if (this.data.learningProgress.length === 0) return null;

    const latest = this.data.learningProgress[this.data.learningProgress.length - 1];
    return {
      timestamp: latest.timestamp,
      insights: latest.insights.map(i => ({
        patternId: i.patternId,
        confidence: i.confidence,
        successRate: i.successRate
      })),
      recommendations: latest.recommendations
    };
  }
}

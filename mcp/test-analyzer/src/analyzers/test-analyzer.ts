import { TestHistory, TestPattern, LearningProgress } from '../persistence/types.js';
import { PersistentStore } from '../persistence/store.js';

interface Recommendation {
  type: string;
  priority: number;
  rationale: string;
  suggestedAction: string;
}

export class TestAnalyzer {
  private store: PersistentStore;

  constructor(projectRoot: string) {
    this.store = new PersistentStore(projectRoot);
  }

  async analyzeFailure(testFile: string, testOutput: string): Promise<TestHistory> {
    // Parse test output to extract failure details
    const result = this.parseTestOutput(testOutput);
    
    // Add to persistent store for pattern recognition
    this.store.addTestResult(result);

    // Analyze patterns and generate insights
    const patterns = this.store.getPatternInsights();
    const learningEffectiveness = this.store.getLearningEffectiveness();

    // Generate learning progress based on new insights
    const progress: LearningProgress = {
      timestamp: new Date().toISOString(),
      insights: patterns.map(p => ({
        patternId: p.pattern,
        confidence: this.calculateConfidence(p),
        applications: p.affectedTests,
        successRate: this.calculateSuccessRate(p)
      })),
      recommendations: this.generateRecommendations(patterns, learningEffectiveness)
    };

    this.store.addLearningProgress(progress);

    return result;
  }

  private parseTestOutput(output: string): TestHistory {
    // Extract test details from output
    const lines = output.split('\n');
    const errorLine = lines.find(l => l.includes('Error:'));
    const testName = lines.find(l => l.includes('test('))?.match(/test\(['"](.+)['"]/)?.[1] || 'Unknown Test';

    return {
      id: `test_${Date.now()}`,
      timestamp: new Date().toISOString(),
      file: lines[0], // First line usually contains file path
      name: testName,
      status: errorLine ? 'fail' : 'pass',
      duration: 0, // Would be extracted from actual test runner output
      errorType: errorLine?.split(':')[0],
      errorMessage: errorLine?.split(':').slice(1).join(':').trim(),
      fixAttempts: []
    };
  }

  private calculateConfidence(pattern: { frequency: number, affectedTests: number }): number {
    // Higher confidence for patterns seen multiple times across different tests
    const frequencyWeight = Math.min(pattern.frequency / 10, 1); // Cap at 1
    const coverageWeight = Math.min(pattern.affectedTests / 5, 1); // Cap at 1
    return (frequencyWeight + coverageWeight) / 2;
  }

  private calculateSuccessRate(pattern: { solutions?: { successRate: number }[] }): number {
    if (!pattern.solutions?.length) return 0;
    return pattern.solutions.reduce((acc, s) => acc + s.successRate, 0) / pattern.solutions.length;
  }

  private generateRecommendations(
    patterns: ReturnType<PersistentStore['getPatternInsights']>,
    effectiveness: ReturnType<PersistentStore['getLearningEffectiveness']>
  ): Recommendation[] {
    const recommendations: Recommendation[] = [];

    // Recommend addressing most frequent patterns first
    patterns
      .filter(p => p.frequency > 2)
      .forEach(p => {
        recommendations.push({
          type: 'pattern',
          priority: p.frequency * 0.8 + (p.affectedTests * 0.2),
          rationale: `High-frequency failure pattern affecting ${p.affectedTests} tests`,
          suggestedAction: `Investigate and fix common failure pattern: ${p.pattern}`
        });
      });

    // Recommend reinforcing successful strategies
    if (effectiveness?.insights) {
      effectiveness.insights
        .filter(i => i.successRate > 0.7)
        .forEach(i => {
          recommendations.push({
            type: 'strategy',
            priority: i.successRate * i.confidence,
            rationale: `Successful fix strategy with ${(i.successRate * 100).toFixed(1)}% success rate`,
            suggestedAction: `Apply proven fix strategy for pattern ${i.patternId}`
          });
        });
    }

    return recommendations.sort((a, b) => b.priority - a.priority);
  }
}

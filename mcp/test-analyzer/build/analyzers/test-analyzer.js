import { PersistentStore } from '../persistence/store.js';
export class TestAnalyzer {
    constructor(projectRoot) {
        this.store = new PersistentStore(projectRoot);
    }
    async analyzeFailure(testFile, testOutput) {
        // Parse test output to extract failure details
        const result = this.parseTestOutput(testOutput);
        // Add to persistent store for pattern recognition
        this.store.addTestResult(result);
        // Analyze patterns and generate insights
        const patterns = this.store.getPatternInsights();
        const learningEffectiveness = this.store.getLearningEffectiveness();
        // Generate learning progress based on new insights
        const progress = {
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
    parseTestOutput(output) {
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
    calculateConfidence(pattern) {
        // Higher confidence for patterns seen multiple times across different tests
        const frequencyWeight = Math.min(pattern.frequency / 10, 1); // Cap at 1
        const coverageWeight = Math.min(pattern.affectedTests / 5, 1); // Cap at 1
        return (frequencyWeight + coverageWeight) / 2;
    }
    calculateSuccessRate(pattern) {
        if (!pattern.solutions?.length)
            return 0;
        return pattern.solutions.reduce((acc, s) => acc + s.successRate, 0) / pattern.solutions.length;
    }
    generateRecommendations(patterns, effectiveness) {
        const recommendations = [];
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

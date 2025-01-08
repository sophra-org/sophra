"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PatternManager = void 0;
const test_analyzer_client_1 = require("../../../../prisma/test-analyzer-client");
const prisma = new test_analyzer_client_1.PrismaClient();
class PatternManager {
    constructor() { }
    static getInstance() {
        if (!PatternManager.instance) {
            PatternManager.instance = new PatternManager();
        }
        return PatternManager.instance;
    }
    async learnTestPattern(pattern, type, context) {
        return prisma.testPattern.create({
            data: {
                pattern,
                type,
                context: context,
                successRate: 1.0, // Initial success rate
                usageCount: 1,
            },
        });
    }
    async learnFixPattern(problem, solution, context) {
        return prisma.fixPattern.create({
            data: {
                problem,
                solution,
                context: context,
                successRate: 1.0, // Initial success rate
                usageCount: 1,
            },
        });
    }
    async updatePatternSuccess(patternId, successful, isFixPattern = false) {
        const pattern = isFixPattern
            ? await prisma.fixPattern.findUnique({ where: { id: patternId } })
            : await prisma.testPattern.findUnique({ where: { id: patternId } });
        if (!pattern)
            throw new Error(`Pattern not found: ${patternId}`);
        const newSuccessRate = (pattern.successRate * pattern.usageCount + (successful ? 1 : 0)) /
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
        }
        else {
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
    async findSimilarTestPatterns(type, context) {
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
            context: pattern.context || {
                fileType: "",
                testType: "",
                framework: "",
                dependencies: [],
                metadata: {},
            },
        }));
    }
    async findSimilarFixPatterns(problem, context) {
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
            context: pattern.context || {
                fileType: "",
                testType: "",
                framework: "",
                dependencies: [],
                metadata: {},
            },
        }))
            .filter((match) => match.confidence > 0.3); // Filter low confidence matches
    }
    async learnFromFix(fix, context) {
        if (!fix.successful)
            return; // Only learn from successful fixes
        // Create or update fix pattern
        const existingPattern = await prisma.fixPattern.findFirst({
            where: {
                problem: fix.problem,
                solution: fix.solution,
            },
        });
        if (existingPattern) {
            await this.updatePatternSuccess(existingPattern.id, true, true);
        }
        else {
            await this.learnFixPattern(fix.problem, fix.solution, context);
        }
    }
    calculateConfidence(pattern, context) {
        const patternContext = pattern.context || {
            fileType: "",
            testType: "",
            framework: "",
            dependencies: [],
            metadata: {},
        };
        let confidence = pattern.successRate;
        // Adjust confidence based on context match
        if (patternContext.fileType === context.fileType)
            confidence *= 1.2;
        if (patternContext.testType === context.testType)
            confidence *= 1.2;
        if (patternContext.framework === context.framework)
            confidence *= 1.1;
        // Consider dependency overlap
        const dependencyOverlap = context.dependencies.filter((dep) => patternContext.dependencies.includes(dep)).length;
        confidence *=
            1 + dependencyOverlap / Math.max(context.dependencies.length, 1);
        return Math.min(confidence, 1.0);
    }
    calculateFixConfidence(pattern, problem, context) {
        const patternContext = pattern.context || {
            fileType: "",
            testType: "",
            framework: "",
            dependencies: [],
            metadata: {},
        };
        let confidence = pattern.successRate;
        // Check problem similarity
        const problemSimilarity = this.calculateStringSimilarity(pattern.problem, problem);
        confidence *= problemSimilarity;
        // Adjust confidence based on context match
        if (patternContext.fileType === context.fileType)
            confidence *= 1.2;
        if (patternContext.testType === context.testType)
            confidence *= 1.2;
        if (patternContext.framework === context.framework)
            confidence *= 1.1;
        return Math.min(confidence, 1.0);
    }
    calculateStringSimilarity(str1, str2) {
        // Simple Levenshtein distance-based similarity
        const distance = this.levenshteinDistance(str1.toLowerCase(), str2.toLowerCase());
        const maxLength = Math.max(str1.length, str2.length);
        return 1 - distance / maxLength;
    }
    levenshteinDistance(str1, str2) {
        const m = str1.length;
        const n = str2.length;
        const dp = Array(m + 1)
            .fill(0)
            .map(() => Array(n + 1).fill(0));
        for (let i = 0; i <= m; i++)
            dp[i][0] = i;
        for (let j = 0; j <= n; j++)
            dp[0][j] = j;
        for (let i = 1; i <= m; i++) {
            for (let j = 1; j <= n; j++) {
                if (str1[i - 1] === str2[j - 1]) {
                    dp[i][j] = dp[i - 1][j - 1];
                }
                else {
                    dp[i][j] = 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
                }
            }
        }
        return dp[m][n];
    }
}
exports.PatternManager = PatternManager;

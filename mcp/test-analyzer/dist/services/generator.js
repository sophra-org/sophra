"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.TestGenerator = void 0;
const fs = __importStar(require("fs/promises"));
const path = __importStar(require("path"));
const test_analyzer_client_1 = require("../../../../prisma/test-analyzer-client");
const analyzer_1 = require("./analyzer");
const client_1 = require("./client");
const session_1 = require("./session");
const prisma = new test_analyzer_client_1.PrismaClient();
class TestGenerator {
    constructor() {
        this.sessionManager = session_1.SessionManager.getInstance();
        this.analyzer = analyzer_1.TestAnalyzer.getInstance();
        this.deepseek = client_1.DeepSeekClient.getInstance();
    }
    static getInstance() {
        if (!TestGenerator.instance) {
            TestGenerator.instance = new TestGenerator();
        }
        return TestGenerator.instance;
    }
    async generateTests(sessionId, testFile, options) {
        const session = await this.sessionManager.getSession(sessionId);
        if (!session)
            throw new Error(`Session not found: ${sessionId}`);
        // Read test file and source files
        const { testContent, sourceFiles } = await this.gatherContext(testFile);
        // Analyze coverage gaps
        const coverageAnalysis = await this.deepseek.analyzeCoverageGaps(Array.from(sourceFiles.values())[0] || "", await this.getCoverageData(testFile), await this.getExistingTests(testFile));
        // Generate new tests based on gaps
        const improvements = await this.deepseek.generateTestImprovements(testContent, Array.from(sourceFiles.values())[0] || "", coverageAnalysis.gaps.map((gap) => ({
            type: this.mapToImprovementType(options.type),
            description: gap.description,
            targetArea: gap.area,
        })));
        // Apply the new tests
        const updatedContent = await this.applyNewTests(testFile, testContent, improvements.code);
        // Calculate coverage improvement
        const beforeMetrics = await this.analyzer.analyzeTest(sessionId, testFile);
        await fs.writeFile(testFile.filePath, updatedContent, "utf-8");
        const afterMetrics = await this.analyzer.analyzeTest(sessionId, testFile);
        const coverageImprovement = afterMetrics.metrics.coverage - beforeMetrics.metrics.coverage;
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
        const operation = {
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
    mapToGenerationType(type) {
        const typeMap = {
            coverage: test_analyzer_client_1.GenerationType.COVERAGE_GAP,
            enhancement: test_analyzer_client_1.GenerationType.ENHANCEMENT,
            regression: test_analyzer_client_1.GenerationType.REGRESSION,
            edge: test_analyzer_client_1.GenerationType.EDGE_CASE,
        };
        return typeMap[type] || test_analyzer_client_1.GenerationType.COVERAGE_GAP;
    }
    mapToImprovementType(type) {
        const typeMap = {
            coverage: "coverage",
            enhancement: "enhancement",
            regression: "fix",
            edge: "enhancement",
        };
        return typeMap[type];
    }
    async gatherContext(testFile) {
        const testContent = await fs.readFile(testFile.filePath, "utf-8");
        const sourceFiles = new Map();
        // Find potential source files by removing .test from the path
        const potentialSourcePath = testFile.filePath.replace(".test.", ".");
        if (await this.fileExists(potentialSourcePath)) {
            sourceFiles.set(potentialSourcePath, await fs.readFile(potentialSourcePath, "utf-8"));
        }
        // Find imported files
        const importMatches = testContent.matchAll(/import\s+.*?from\s+['"](.+?)['"]/g);
        for (const match of importMatches) {
            const importPath = match[1];
            const resolvedPath = await this.resolveImportPath(importPath, path.dirname(testFile.filePath));
            if (resolvedPath && (await this.fileExists(resolvedPath))) {
                sourceFiles.set(resolvedPath, await fs.readFile(resolvedPath, "utf-8"));
            }
        }
        return { testContent, sourceFiles };
    }
    async resolveImportPath(importPath, basePath) {
        const extensions = [".ts", ".tsx", ".js", ".jsx"];
        for (const ext of extensions) {
            const fullPath = path.resolve(basePath, importPath + ext);
            if (await this.fileExists(fullPath)) {
                return fullPath;
            }
        }
        return null;
    }
    async fileExists(filePath) {
        try {
            await fs.access(filePath);
            return true;
        }
        catch {
            return false;
        }
    }
    async getExistingTests(testFile) {
        const content = await fs.readFile(testFile.filePath, "utf-8");
        const testBlocks = content.match(/(?:it|test)\s*\(\s*['"](.+?)['"]/g) || [];
        return testBlocks.map((block) => block.match(/['"](.+?)['"]/)?.[1] || "");
    }
    async getCoverageData(testFile) {
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
    async applyNewTests(testFile, currentContent, newTests) {
        // Create a backup
        const backupPath = `${testFile.filePath}.bak`;
        await fs.writeFile(backupPath, currentContent);
        try {
            // Find the last import statement
            const lastImportMatch = Array.from(currentContent.matchAll(/^import .+$/gm)).pop();
            const insertPosition = lastImportMatch
                ? lastImportMatch.index + lastImportMatch[0].length
                : 0;
            // Insert new tests after imports
            const updatedContent = currentContent.slice(0, insertPosition) +
                "\n\n" +
                newTests +
                currentContent.slice(insertPosition);
            return updatedContent;
        }
        catch (error) {
            // Restore from backup if something goes wrong
            const backup = await fs.readFile(backupPath, "utf-8");
            await fs.writeFile(testFile.filePath, backup);
            throw error;
        }
        finally {
            // Clean up backup
            await fs.unlink(backupPath);
        }
    }
}
exports.TestGenerator = TestGenerator;

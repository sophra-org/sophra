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
exports.TestAnalyzer = void 0;
exports.analyzeTest = analyzeTest;
const child_process_1 = require("child_process");
const fs = __importStar(require("fs/promises"));
const os = __importStar(require("os"));
const path = __importStar(require("path"));
const utils_1 = require("../utils");
const prisma_1 = require("../utils/prisma");
const client_1 = require("./client");
const session_1 = require("./session");
// Calculate optimal number of concurrent analyses based on system resources
const cpuCount = os.cpus().length;
const systemMemoryGB = os.totalmem() / 1024 / 1024 / 1024;
const MAX_CONCURRENT_ANALYSES = Math.max(
// Use 75% of available CPU cores, minimum of 4, maximum of 16
Math.min(Math.floor(cpuCount * 0.75), 16), 
// Or scale based on available memory (1 worker per 2GB, max 16)
Math.min(Math.floor(systemMemoryGB / 2), 16), 
// But never less than 4
4);
class TestAnalyzer {
    constructor() {
        this.currentSessionId = "";
        this.sessionManager = session_1.SessionManager.getInstance();
        this.deepseek = client_1.DeepSeekClient.getInstance();
        this.threadPool = new utils_1.ThreadPool(MAX_CONCURRENT_ANALYSES);
    }
    static getInstance() {
        if (!TestAnalyzer.instance) {
            TestAnalyzer.instance = new TestAnalyzer();
        }
        return TestAnalyzer.instance;
    }
    async startAnalysis(testFile, context = {}) {
        // Create a new session
        const session = await prisma_1.prisma.analysisSession.create({
            data: {
                status: "ACTIVE",
                context: context,
                testFiles: {
                    connect: { id: testFile.id },
                },
            },
        });
        this.currentSessionId = session.id;
        return session.id;
    }
    async analyzeTests(testFiles) {
        console.log(`Starting analysis of ${testFiles.length} test files...`);
        const results = new Map();
        // Process files sequentially instead of in parallel
        for (const testFile of testFiles) {
            try {
                console.log(`\nAnalyzing ${testFile.fileName}...`);
                const result = await this.analyzeTestFile(testFile);
                results.set(testFile.filePath, result);
                console.log(`✓ Completed analysis of ${testFile.fileName}`);
            }
            catch (error) {
                console.error(`✗ Failed analysis of ${testFile.fileName}:`, error);
                // Continue with next file even if one fails
            }
        }
        console.log(`\n✓ All ${testFiles.length} analyses completed`);
        return results;
    }
    async analyzeTestFile(testFile) {
        console.log(`Analyzing ${testFile.fileName}...`);
        try {
            // Read test file and related source files
            const { testContent, sourceFiles } = await this.gatherTestContext(testFile);
            console.log(`- Gathered context for ${testFile.fileName}`);
            // Extract test framework and dependencies
            const context = await this.extractContext(testFile);
            console.log(`- Extracted framework context for ${testFile.fileName}`);
            // Run test and collect metrics
            const metrics = await this.collectMetrics(testFile);
            console.log(`- Collected metrics for ${testFile.fileName}`);
            // Analyze patterns and anti-patterns using DeepSeek
            console.log(`- Starting DeepSeek analysis for ${testFile.fileName}`);
            const analysis = await this.deepseek.analyzeTestStructure(testContent, context);
            console.log(`- Completed DeepSeek analysis for ${testFile.fileName}`);
            // Analyze coverage gaps
            const coverageAnalysis = await this.analyzeCoverage(testFile, sourceFiles, metrics);
            console.log(`- Analyzed coverage for ${testFile.fileName}`);
            // Check for reliability issues
            const reliabilityAnalysis = await this.analyzeReliability(testFile, testContent);
            console.log(`- Analyzed reliability for ${testFile.fileName}`);
            // Generate comprehensive suggestions
            const suggestions = await this.generateSuggestions(analysis, coverageAnalysis, reliabilityAnalysis, metrics);
            const result = {
                patterns: analysis.patterns,
                antiPatterns: analysis.antiPatterns,
                suggestions,
                metrics,
            };
            // Record results one by one
            await this.createAnalysisRecord(testFile, result, context);
            await this.updateTestFileMetrics(testFile, result.metrics);
            await this.recordTestExecution(testFile, result);
            await this.recordCoverage(testFile, result.metrics);
            console.log(`✓ Recorded analysis results for ${testFile.fileName}`);
            return result;
        }
        catch (error) {
            console.error(`✗ Error analyzing ${testFile.fileName}:`, error);
            // Still record the failure in the database
            await this.recordAnalysisFailure(testFile, error);
            throw error;
        }
    }
    async createAnalysisRecord(testFile, result, context) {
        console.log(`- Creating analysis record for ${testFile.fileName}`);
        const analysis = await prisma_1.prisma.testAnalysis.create({
            data: {
                session: { connect: { id: this.currentSessionId } },
                testFile: { connect: { id: testFile.id } },
                patterns: result.patterns,
                antiPatterns: result.antiPatterns,
                suggestions: result.suggestions,
                context: context,
                timestamp: new Date(),
            },
        });
        console.log(`✓ Created analysis record: ${analysis.id}`);
    }
    async recordTestExecution(testFile, result) {
        console.log(`- Recording execution for ${testFile.fileName}`);
        const execution = await prisma_1.prisma.testExecution.create({
            data: {
                testFile: { connect: { id: testFile.id } },
                passed: result.metrics.passRate === 100,
                duration: result.metrics.avgDuration,
                testResults: result.patterns,
                environment: process.env.NODE_ENV || "development",
                executedAt: new Date(),
            },
        });
        console.log(`✓ Created execution record: ${execution.id}`);
    }
    async recordCoverage(testFile, metrics) {
        console.log(`- Recording coverage for ${testFile.fileName}`);
        try {
            // Try to read coverage data from coverage-final.json
            const coverageFile = path.join(process.cwd(), "coverage", "coverage-final.json");
            let linesCovered = [];
            let linesUncovered = [];
            try {
                const coverageData = JSON.parse(await fs.readFile(coverageFile, "utf-8"));
                const fileData = Object.values(coverageData).find((data) => data.path?.includes(path.basename(testFile.filePath).replace(".test.", ".")));
                if (fileData) {
                    const lines = fileData.statementMap || {};
                    const statements = fileData.s || {};
                    Object.entries(statements).forEach(([key, hit]) => {
                        const line = lines[key]?.start?.line?.toString();
                        if (line) {
                            if (hit) {
                                linesCovered.push(line);
                            }
                            else {
                                linesUncovered.push(line);
                            }
                        }
                    });
                }
            }
            catch (error) {
                console.warn(`Warning: Could not read coverage data from file: ${error instanceof Error ? error.message : String(error)}`);
            }
            const coverage = await prisma_1.prisma.testCoverage.create({
                data: {
                    testFile: { connect: { id: testFile.id } },
                    coveragePercent: metrics.coverage,
                    linesCovered,
                    linesUncovered,
                    coverageType: "static",
                    measuredAt: new Date(),
                },
            });
            console.log(`✓ Created coverage record: ${coverage.id}`);
        }
        catch (error) {
            console.error(`Error recording coverage: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
    async recordAnalysisFailure(testFile, error) {
        console.log(`\nRecording analysis failure for ${testFile.fileName}...`);
        try {
            const execution = await prisma_1.prisma.testExecution.create({
                data: {
                    testFile: { connect: { id: testFile.id } },
                    passed: false,
                    duration: 0,
                    errorMessage: error.message || String(error),
                    testResults: { error: error.message || String(error) },
                    environment: process.env.NODE_ENV || "development",
                    executedAt: new Date(),
                },
            });
            console.log(`✓ Created failure record: ${execution.id}`);
            await prisma_1.prisma.testFile.update({
                where: { id: testFile.id },
                data: {
                    lastFailureReason: error.message || String(error),
                    lastUpdated: new Date(),
                    totalRuns: { increment: 1 },
                },
            });
            console.log(`✓ Updated test file with failure info`);
            console.log(`✓ Failure recording completed for ${testFile.fileName}`);
        }
        catch (dbError) {
            console.error(`✗ Failed to record analysis failure for ${testFile.fileName}:`, dbError);
            console.error("Detailed error:", {
                error: dbError,
                testFile: {
                    id: testFile.id,
                    fileName: testFile.fileName,
                },
                originalError: error,
            });
        }
    }
    async gatherTestContext(testFile) {
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
    async extractContext(testFile) {
        const packageJsonPath = path.join(path.dirname(testFile.filePath), "package.json");
        let dependencies = [];
        let framework = "unknown";
        try {
            const packageJson = JSON.parse(await fs.readFile(packageJsonPath, "utf-8"));
            dependencies = [
                ...Object.keys(packageJson.dependencies || {}),
                ...Object.keys(packageJson.devDependencies || {}),
            ];
            // Detect framework
            if (dependencies.includes("vitest")) {
                framework = "vitest";
            }
            else if (dependencies.includes("jest")) {
                framework = "jest";
            }
        }
        catch (error) {
            // Package.json not found or invalid
        }
        return {
            fileType: path.extname(testFile.filePath),
            testType: this.detectTestType(testFile.fileName),
            framework,
            dependencies,
            metadata: {},
        };
    }
    async collectMetrics(testFile) {
        try {
            // Run test in isolation with coverage
            const result = (0, child_process_1.execSync)(`npx vitest run ${testFile.filePath} --coverage`, {
                stdio: "pipe",
                encoding: "utf-8",
            });
            // Parse coverage report
            const coverage = this.parseCoverageReport(result);
            const passRate = result.includes("Test Files") && !result.includes("FAIL") ? 100 : 0;
            const duration = this.parseTestDuration(result);
            return {
                healthScore: this.calculateHealthScore(coverage, passRate),
                coverage,
                passRate,
                avgDuration: duration,
            };
        }
        catch (error) {
            console.error("Error collecting metrics:", error);
            return {
                healthScore: "POOR",
                coverage: 0,
                passRate: 0,
                avgDuration: 0,
            };
        }
    }
    async analyzeCoverage(testFile, sourceFiles, metrics) {
        const existingTests = await this.getExistingTests(testFile);
        const coverageData = await this.getCoverageData(testFile);
        // Get source content for the main file being tested
        const sourceContent = Array.from(sourceFiles.values())[0] || "";
        return this.deepseek.analyzeCoverageGaps(sourceContent, coverageData, existingTests);
    }
    async analyzeReliability(testFile, testContent) {
        const executionHistory = await prisma_1.prisma.testExecution.findMany({
            where: { testFileId: testFile.id },
            orderBy: { executedAt: "desc" },
            take: 20, // Look at last 20 executions
        });
        return this.deepseek.analyzeTestReliability(testContent, executionHistory.map((exec) => ({
            timestamp: exec.executedAt,
            passed: exec.passed,
            duration: exec.duration,
            ...(exec.errorMessage ? { error: exec.errorMessage } : {}),
        })));
    }
    async generateSuggestions(analysis, coverageAnalysis, reliabilityAnalysis, metrics) {
        const suggestions = [];
        // Add suggestions from pattern analysis
        suggestions.push(...analysis.suggestions);
        // Add suggestions from coverage gaps
        coverageAnalysis.gaps.forEach((gap) => {
            suggestions.push({
                type: "COVERAGE",
                description: `Add tests for: ${gap.description}`,
                priority: gap.priority,
                effort: 2,
            });
        });
        // Add suggestions from reliability analysis
        if (reliabilityAnalysis.isFlaky) {
            reliabilityAnalysis.issues.forEach((issue) => {
                suggestions.push({
                    type: "RELIABILITY",
                    description: `Fix flaky test: ${issue.description}`,
                    priority: 1, // High priority for flaky tests
                    effort: 3,
                });
            });
        }
        return suggestions;
    }
    async updateTestFileMetrics(testFile, metrics) {
        await prisma_1.prisma.testFile.update({
            where: { id: testFile.id },
            data: {
                currentCoverage: metrics.coverage,
                avgCoverage: (testFile.avgCoverage + metrics.coverage) / 2,
                currentPassRate: metrics.passRate,
                avgPassRate: (testFile.avgPassRate + metrics.passRate) / 2,
                avgDuration: metrics.avgDuration,
                healthScore: metrics.healthScore,
                lastUpdated: new Date(),
            },
        });
    }
    calculateHealthScore(coverage, passRate) {
        if (coverage > 90 && passRate === 100) {
            return "EXCELLENT";
        }
        else if (coverage > 80 && passRate > 90) {
            return "GOOD";
        }
        else if (coverage > 60 && passRate > 80) {
            return "FAIR";
        }
        else if (coverage > 40 && passRate > 60) {
            return "POOR";
        }
        else {
            return "CRITICAL";
        }
    }
    parseCoverageReport(output) {
        const match = output.match(/(?:Coverage|All files)[^\d]*?([\d.]+)%/i);
        return match ? parseFloat(match[1]) : 0;
    }
    parseTestDuration(output) {
        const match = output.match(/Time:[\s\n]*([\d.]+)s/i);
        return match ? parseFloat(match[1]) : 0;
    }
    async getExistingTests(testFile) {
        const content = await fs.readFile(testFile.filePath, "utf-8");
        const testBlocks = content.match(/(?:it|test)\s*\(\s*['"](.+?)['"]/g) || [];
        return testBlocks.map((block) => block.match(/['"](.+?)['"]/)?.[1] || "");
    }
    async getCoverageData(testFile) {
        const latestCoverage = await prisma_1.prisma.testCoverage.findFirst({
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
    detectTestType(fileName) {
        if (fileName.includes(".unit."))
            return "unit";
        if (fileName.includes(".integration."))
            return "integration";
        if (fileName.includes(".e2e."))
            return "e2e";
        return "unknown";
    }
}
exports.TestAnalyzer = TestAnalyzer;
async function analyzeTest(testFile, context = {}) {
    const analyzer = TestAnalyzer.getInstance();
    const sessionId = await analyzer.startAnalysis(testFile, context);
    const results = await analyzer.analyzeTests([testFile]);
    return results.get(testFile.filePath);
}

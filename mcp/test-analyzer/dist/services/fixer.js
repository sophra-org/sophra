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
exports.TestFixer = void 0;
const fs = __importStar(require("fs/promises"));
const path = __importStar(require("path"));
const test_analyzer_client_1 = require("../../../../prisma/test-analyzer-client");
const analyzer_1 = require("./analyzer");
const client_1 = require("./client");
const session_1 = require("./session");
const prisma = new test_analyzer_client_1.PrismaClient();
class TestFixer {
    constructor() {
        this.sessionManager = session_1.SessionManager.getInstance();
        this.analyzer = analyzer_1.TestAnalyzer.getInstance();
        this.deepseek = client_1.DeepSeekClient.getInstance();
    }
    static getInstance() {
        if (!TestFixer.instance) {
            TestFixer.instance = new TestFixer();
        }
        return TestFixer.instance;
    }
    async fixTest(sessionId, testFile, issues) {
        const session = await this.sessionManager.getSession(sessionId);
        if (!session)
            throw new Error(`Session not found: ${sessionId}`);
        // Read test file and source files
        const { testContent, sourceFiles } = await this.gatherContext(testFile);
        // Generate improvements using DeepSeek
        const improvements = await this.deepseek.generateTestImprovements(testContent, Array.from(sourceFiles.values())[0] || "", issues.map((issue) => ({
            type: "fix",
            description: issue.description,
            targetArea: issue.area,
        })));
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
        const analysis = analysisResults.get(testFile.filePath);
        // Record operation
        const operation = {
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
    mapToFixType(type) {
        const typeMap = {
            async: test_analyzer_client_1.FixType.ASYNC,
            mock: test_analyzer_client_1.FixType.MOCK,
            setup: test_analyzer_client_1.FixType.SETUP,
            teardown: test_analyzer_client_1.FixType.TEARDOWN,
            assertion: test_analyzer_client_1.FixType.ASSERTION,
            timing: test_analyzer_client_1.FixType.TIMING,
            dependency: test_analyzer_client_1.FixType.DEPENDENCY,
            logic: test_analyzer_client_1.FixType.LOGIC,
        };
        return typeMap[type.toLowerCase()] || test_analyzer_client_1.FixType.OTHER;
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
    async applyFix(testFile, newCode) {
        // Create a backup
        const backupPath = `${testFile.filePath}.bak`;
        await fs.copyFile(testFile.filePath, backupPath);
        try {
            // Write the new code
            await fs.writeFile(testFile.filePath, newCode, "utf-8");
        }
        catch (error) {
            // Restore from backup if something goes wrong
            await fs.copyFile(backupPath, testFile.filePath);
            throw error;
        }
        finally {
            // Clean up backup
            await fs.unlink(backupPath);
        }
    }
}
exports.TestFixer = TestFixer;

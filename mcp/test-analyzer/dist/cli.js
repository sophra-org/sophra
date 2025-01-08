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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs = __importStar(require("fs/promises"));
const glob_1 = require("glob");
const inquirer_1 = __importDefault(require("inquirer"));
const ora_1 = __importDefault(require("ora"));
const path = __importStar(require("path"));
const test_analyzer_client_1 = require("../../../prisma/test-analyzer-client");
const analyzer_1 = require("./services/analyzer");
const fixer_1 = require("./services/fixer");
const generator_1 = require("./services/generator");
const prisma_1 = require("./utils/prisma");
const commands = new Map();
commands.set("analyze", async (state, options) => {
    const spinner = (0, ora_1.default)("Analyzing test files...").start();
    try {
        if (!state.selectedFiles.length) {
            const files = await scanTestFiles();
            const { selectedFiles } = await inquirer_1.default.prompt([
                {
                    type: "checkbox",
                    name: "selectedFiles",
                    message: "Select test files to analyze:",
                    choices: files.map((file) => ({
                        name: `${file.fileName} (${file.totalTests} tests)${file.isNew ? " [NEW]" : ""}`,
                        value: file.filePath,
                    })),
                },
            ]);
            state.selectedFiles = selectedFiles;
        }
        const results = await analyzeTestFiles(state.selectedFiles);
        state.analysisResults = results;
        spinner.succeed("Analysis complete");
        return state;
    }
    catch (error) {
        spinner.fail("Analysis failed");
        throw error;
    }
});
commands.set("fix", async (state, options) => {
    const spinner = (0, ora_1.default)("Fixing test issues...").start();
    try {
        if (!state.analysisResults.size) {
            spinner.warn("No analysis results found. Running analysis first...");
            state = await commands.get("analyze")(state, options);
        }
        for (const [filePath, analysis] of state.analysisResults) {
            spinner.text = `Fixing ${path.basename(filePath)}...`;
            // Apply fixes based on analysis and options
            const fixes = await applyFixes(filePath, analysis, options);
            state.fixSuggestions.set(filePath, fixes);
        }
        spinner.succeed("Fixes applied");
        return state;
    }
    catch (error) {
        spinner.fail("Fix application failed");
        throw error;
    }
});
commands.set("generate", async (state, options) => {
    const spinner = (0, ora_1.default)("Generating tests...").start();
    try {
        if (!state.analysisResults.size) {
            spinner.warn("No analysis results found. Running analysis first...");
            state = await commands.get("analyze")(state, options);
        }
        for (const [filePath, analysis] of state.analysisResults) {
            spinner.text = `Generating tests for ${path.basename(filePath)}...`;
            // Generate tests based on analysis and options
            const tests = await generateTests(filePath, analysis, options);
            state.generatedTests.set(filePath, tests);
        }
        spinner.succeed("Test generation complete");
        return state;
    }
    catch (error) {
        spinner.fail("Test generation failed");
        throw error;
    }
});
commands.set("report", async (state, options) => {
    console.log("\nTest Analysis Report");
    console.log("===================\n");
    for (const filePath of state.selectedFiles) {
        const fileName = path.basename(filePath);
        console.log(`File: ${fileName}`);
        const analysis = state.analysisResults.get(filePath);
        if (analysis) {
            console.log("Analysis Results:");
            console.log(JSON.stringify(analysis, null, 2));
        }
        const fixes = state.fixSuggestions.get(filePath);
        if (fixes?.length) {
            console.log("\nApplied Fixes:");
            console.log(JSON.stringify(fixes, null, 2));
        }
        const tests = state.generatedTests.get(filePath);
        if (tests?.length) {
            console.log("\nGenerated Tests:");
            console.log(JSON.stringify(tests, null, 2));
        }
        console.log("\n---\n");
    }
    return state;
});
async function parseCommandLine() {
    const args = process.argv.slice(2);
    const commands = [];
    let currentCommand = [];
    let currentOptions = {};
    let isInteractive = false;
    for (let i = 0; i < args.length; i++) {
        const arg = args[i];
        if (arg === "-i" || arg === "--interactive") {
            isInteractive = true;
            continue;
        }
        if (arg.startsWith("--")) {
            const option = arg.slice(2);
            if (i + 1 < args.length && !args[i + 1].startsWith("--")) {
                currentOptions[option] = args[++i];
            }
            else {
                currentOptions[option] = true;
            }
        }
        else {
            if (currentCommand.length) {
                commands.push([currentCommand, currentOptions]);
                currentCommand = [];
                currentOptions = {};
            }
            currentCommand.push(arg);
        }
    }
    if (currentCommand.length) {
        commands.push([currentCommand, currentOptions]);
    }
    // If interactive mode or no commands, enter interactive workflow
    if (isInteractive || commands.length === 0) {
        while (true) {
            const { action } = await inquirer_1.default.prompt([
                {
                    type: "list",
                    name: "action",
                    message: "Select an action:",
                    choices: [
                        { name: "Analyze Tests", value: "analyze" },
                        { name: "Fix Issues", value: "fix" },
                        { name: "Generate Tests", value: "generate" },
                        { name: "View Report", value: "report" },
                        { name: "Exit", value: "exit" },
                    ],
                },
            ]);
            if (action === "exit") {
                process.exit(0);
            }
            const { options } = await inquirer_1.default.prompt([
                {
                    type: "checkbox",
                    name: "options",
                    message: "Select options:",
                    choices: [
                        { name: "Coverage Analysis", value: "coverage" },
                        { name: "Pattern Analysis", value: "patterns" },
                        { name: "Performance Analysis", value: "performance" },
                        { name: "Flaky Test Detection", value: "flaky" },
                    ],
                },
            ]);
            const commandOptions = {};
            options.forEach((opt) => {
                switch (opt) {
                    case "coverage":
                    case "patterns":
                    case "performance":
                    case "flaky":
                        commandOptions[opt] = true;
                        break;
                }
            });
            commands.push([[action], commandOptions]);
            const { continue: shouldContinue } = await inquirer_1.default.prompt([
                {
                    type: "confirm",
                    name: "continue",
                    message: "Would you like to perform another action?",
                    default: true,
                },
            ]);
            if (!shouldContinue)
                break;
        }
    }
    return commands;
}
async function main() {
    try {
        const commandSequence = await parseCommandLine();
        if (commandSequence.length === 0) {
            // Interactive mode
            const { action } = await inquirer_1.default.prompt([
                {
                    type: "list",
                    name: "action",
                    message: "Select an action:",
                    choices: [
                        { name: "Analyze Tests", value: "analyze" },
                        { name: "Fix Issues", value: "fix" },
                        { name: "Generate Tests", value: "generate" },
                        { name: "View Report", value: "report" },
                        { name: "Exit", value: "exit" },
                    ],
                },
            ]);
            if (action === "exit") {
                return;
            }
            commandSequence.push([[action], {}]);
        }
        let state = {
            selectedFiles: [],
            analysisResults: new Map(),
            fixSuggestions: new Map(),
            generatedTests: new Map(),
        };
        for (const [cmdList, options] of commandSequence) {
            for (const cmd of cmdList) {
                const commandFn = commands.get(cmd);
                if (!commandFn) {
                    console.error(`Unknown command: ${cmd}`);
                    process.exit(1);
                }
                state = await commandFn(state, options);
            }
        }
    }
    catch (error) {
        console.error("Error:", error);
        process.exit(1);
    }
}
async function findTestFiles(pattern = "./src/**/*.test.ts") {
    try {
        // Use the current working directory as the base
        const workspaceRoot = process.cwd();
        console.log("Searching for tests in:", workspaceRoot);
        const files = await (0, glob_1.glob)(pattern, {
            ignore: ["**/node_modules/**", "**/dist/**"],
            cwd: workspaceRoot,
            absolute: true,
        });
        // Log found files for debugging
        console.log(`Found ${files.length} test files:`, files);
        return files;
    }
    catch (error) {
        console.error("Error finding test files:", error);
        console.error("Error details:", error instanceof Error ? error.message : error);
        return [];
    }
}
async function convertPrismaTestFileToType(prismaTestFile) {
    return {
        id: prismaTestFile.id,
        filePath: prismaTestFile.filePath,
        fileName: prismaTestFile.fileName,
        firstSeen: prismaTestFile.firstSeen,
        lastUpdated: prismaTestFile.lastUpdated,
        totalRuns: prismaTestFile.totalRuns,
        avgPassRate: prismaTestFile.avgPassRate,
        currentPassRate: prismaTestFile.currentPassRate,
        avgDuration: prismaTestFile.avgDuration,
        currentCoverage: prismaTestFile.currentCoverage,
        avgCoverage: prismaTestFile.avgCoverage,
        totalFixes: prismaTestFile.totalFixes,
        flakyTests: prismaTestFile.flakyTests,
        metadata: prismaTestFile.metadata || {},
        healthScore: prismaTestFile.healthScore,
        totalTests: prismaTestFile.totalTests,
        criticalTests: prismaTestFile.criticalTests,
        lastFailureReason: prismaTestFile.lastFailureReason || undefined,
    };
}
async function scanTestFiles() {
    const spinner = (0, ora_1.default)("Scanning for test files...").start();
    try {
        const files = await findTestFiles();
        console.log("Found test files:", files);
        const results = [];
        for (const filePath of files) {
            const content = await fs.readFile(filePath, "utf-8");
            const fileName = path.basename(filePath);
            const testCount = (content.match(/\b(it|test|describe)\s*\(/g) || [])
                .length;
            const existingFile = await prisma_1.prisma.testFile.findUnique({
                where: { filePath },
            });
            results.push({
                filePath,
                fileName,
                totalTests: testCount,
                isNew: !existingFile,
            });
        }
        spinner.succeed(`Found ${results.length} test files`);
        return results;
    }
    catch (error) {
        spinner.fail("Error scanning test files");
        console.error("Scan error:", error);
        throw error;
    }
}
async function analyzeTestFiles(filePaths) {
    const spinner = (0, ora_1.default)(`Analyzing ${filePaths.length} test files...`).start();
    try {
        const testFiles = await Promise.all(filePaths.map(async (filePath) => {
            const testFile = await prisma_1.prisma.testFile.upsert({
                where: { filePath },
                create: {
                    filePath,
                    fileName: path.basename(filePath),
                    firstSeen: new Date(),
                    lastUpdated: new Date(),
                    totalRuns: 0,
                    avgPassRate: 0,
                    currentPassRate: 0,
                    avgDuration: 0,
                    currentCoverage: 0,
                    avgCoverage: 0,
                    totalFixes: 0,
                    flakyTests: 0,
                    totalTests: 0,
                    criticalTests: 0,
                    healthScore: test_analyzer_client_1.TestHealthScore.POOR,
                },
                update: {
                    lastUpdated: new Date(),
                },
            });
            return convertPrismaTestFileToType(testFile);
        }));
        const analyzer = analyzer_1.TestAnalyzer.getInstance();
        // Start a session for the first test file (we'll use this session for all files)
        if (testFiles.length > 0) {
            await analyzer.startAnalysis(testFiles[0]);
        }
        const results = await analyzer.analyzeTests(testFiles);
        spinner.succeed(`Analysis complete for ${filePaths.length} files`);
        return results;
    }
    catch (error) {
        spinner.fail(`Error analyzing test files`);
        throw error;
    }
}
async function applyFixes(filePath, analysis, options) {
    const fixer = fixer_1.TestFixer.getInstance();
    const testFile = await convertPrismaTestFileToType(await prisma_1.prisma.testFile.findUnique({ where: { filePath } }));
    if (!testFile)
        throw new Error(`Test file not found: ${filePath}`);
    const issues = analysis.suggestions
        .filter((s) => s.type === "FIX" || s.type === "RELIABILITY")
        .map((s) => ({
        type: s.type.toLowerCase(),
        description: s.description,
        area: s.targetArea,
    }));
    if (issues.length === 0)
        return [];
    const result = await fixer.fixTest("default", testFile, issues);
    return [result];
}
async function generateTests(filePath, analysis, options) {
    const generator = generator_1.TestGenerator.getInstance();
    const testFile = await convertPrismaTestFileToType(await prisma_1.prisma.testFile.findUnique({ where: { filePath } }));
    if (!testFile)
        throw new Error(`Test file not found: ${filePath}`);
    const type = options.type || "coverage";
    const targetArea = options.target;
    const result = await generator.generateTests("default", testFile, {
        type,
        targetArea,
    });
    return [result];
}
main();

import * as fs from "fs/promises";
import { glob } from "glob";
import inquirer from "inquirer";
import ora from "ora";
import * as path from "path";
import {
  PrismaClient,
  TestHealthScore,
} from "../../../prisma/test-analyzer-client";
import { TestAnalyzer } from "./services/analyzer";
import { TestFixer } from "./services/fixer";
import { TestGenerator } from "./services/generator";
import { TestFile } from "./types";

const prisma = new PrismaClient();

interface TestScanResult {
  filePath: string;
  fileName: string;
  totalTests: number;
  isNew: boolean;
}

interface WorkflowState {
  sessionId?: string;
  selectedFiles: string[];
  analysisResults: Map<string, any>;
  fixSuggestions: Map<string, any[]>;
  generatedTests: Map<string, any[]>;
}

interface CommandOptions {
  coverage?: boolean;
  patterns?: boolean;
  performance?: boolean;
  flaky?: boolean;
  type?: "coverage" | "enhancement" | "regression" | "edge";
  target?: string;
}

type CommandFunction = (
  state: WorkflowState,
  options: CommandOptions
) => Promise<WorkflowState>;

const commands = new Map<string, CommandFunction>();

commands.set(
  "analyze",
  async (state: WorkflowState, options: CommandOptions) => {
    const spinner = ora("Analyzing test files...").start();
    try {
      if (!state.selectedFiles.length) {
        const files = await scanTestFiles();
        const { selectedFiles } = await inquirer.prompt([
          {
            type: "checkbox",
            name: "selectedFiles",
            message: "Select test files to analyze:",
            choices: files.map((file) => ({
              name: `${file.fileName} (${file.totalTests} tests)${
                file.isNew ? " [NEW]" : ""
              }`,
              value: file.filePath,
            })),
          },
        ]);
        state.selectedFiles = selectedFiles;
      }

      for (const filePath of state.selectedFiles) {
        spinner.text = `Analyzing ${path.basename(filePath)}...`;
        const testFile = await analyzeTestFile(filePath);
        state.analysisResults.set(filePath, testFile);
      }

      spinner.succeed("Analysis complete");
      return state;
    } catch (error) {
      spinner.fail("Analysis failed");
      throw error;
    }
  }
);

commands.set("fix", async (state: WorkflowState, options: CommandOptions) => {
  const spinner = ora("Fixing test issues...").start();
  try {
    if (!state.analysisResults.size) {
      spinner.warn("No analysis results found. Running analysis first...");
      state = await commands.get("analyze")!(state, options);
    }

    for (const [filePath, analysis] of state.analysisResults) {
      spinner.text = `Fixing ${path.basename(filePath)}...`;
      // Apply fixes based on analysis and options
      const fixes = await applyFixes(filePath, analysis, options);
      state.fixSuggestions.set(filePath, fixes);
    }

    spinner.succeed("Fixes applied");
    return state;
  } catch (error) {
    spinner.fail("Fix application failed");
    throw error;
  }
});

commands.set(
  "generate",
  async (state: WorkflowState, options: CommandOptions) => {
    const spinner = ora("Generating tests...").start();
    try {
      if (!state.analysisResults.size) {
        spinner.warn("No analysis results found. Running analysis first...");
        state = await commands.get("analyze")!(state, options);
      }

      for (const [filePath, analysis] of state.analysisResults) {
        spinner.text = `Generating tests for ${path.basename(filePath)}...`;
        // Generate tests based on analysis and options
        const tests = await generateTests(filePath, analysis, options);
        state.generatedTests.set(filePath, tests);
      }

      spinner.succeed("Test generation complete");
      return state;
    } catch (error) {
      spinner.fail("Test generation failed");
      throw error;
    }
  }
);

commands.set(
  "report",
  async (state: WorkflowState, options: CommandOptions) => {
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
  }
);

async function parseCommandLine(): Promise<[string[], CommandOptions][]> {
  const args = process.argv.slice(2);
  const commands: [string[], CommandOptions][] = [];
  let currentCommand: string[] = [];
  let currentOptions: CommandOptions = {};
  let isInteractive = false;

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === "-i" || arg === "--interactive") {
      isInteractive = true;
      continue;
    }
    if (arg.startsWith("--")) {
      const option = arg.slice(2) as keyof CommandOptions;
      if (i + 1 < args.length && !args[i + 1].startsWith("--")) {
        currentOptions[option] = args[++i] as any;
      } else {
        currentOptions[option] = true as any;
      }
    } else {
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
      const { action } = await inquirer.prompt([
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

      const { options } = await inquirer.prompt([
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

      const commandOptions: CommandOptions = {};
      options.forEach((opt: string) => {
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

      const { continue: shouldContinue } = await inquirer.prompt([
        {
          type: "confirm",
          name: "continue",
          message: "Would you like to perform another action?",
          default: true,
        },
      ]);

      if (!shouldContinue) break;
    }
  }

  return commands;
}

async function main() {
  try {
    const commandSequence = await parseCommandLine();

    if (commandSequence.length === 0) {
      // Interactive mode
      const { action } = await inquirer.prompt([
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

    let state: WorkflowState = {
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
  } catch (error) {
    console.error("Error:", error);
    process.exit(1);
  }
}

async function findTestFiles(
  pattern: string = "./src/**/*.test.ts"
): Promise<string[]> {
  try {
    // Use the current working directory as the base
    const workspaceRoot = process.cwd();
    console.log("Searching for tests in:", workspaceRoot);

    const files = await glob(pattern, {
      ignore: ["**/node_modules/**", "**/dist/**"],
      cwd: workspaceRoot,
      absolute: true,
    });

    // Log found files for debugging
    console.log(`Found ${files.length} test files:`, files);

    return files;
  } catch (error) {
    console.error("Error finding test files:", error);
    console.error(
      "Error details:",
      error instanceof Error ? error.message : error
    );
    return [];
  }
}

async function convertPrismaTestFileToType(
  prismaTestFile: any
): Promise<TestFile> {
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

async function scanTestFiles(): Promise<TestScanResult[]> {
  const spinner = ora("Scanning for test files...").start();
  try {
    const files = await findTestFiles();
    console.log("Found test files:", files);
    const results: TestScanResult[] = [];

    for (const filePath of files) {
      const content = await fs.readFile(filePath, "utf-8");
      const fileName = path.basename(filePath);
      const testCount = (content.match(/\b(it|test|describe)\s*\(/g) || [])
        .length;

      const existingFile = await prisma.testFile.findUnique({
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
  } catch (error) {
    spinner.fail("Error scanning test files");
    console.error("Scan error:", error);
    throw error;
  }
}

async function analyzeTestFile(filePath: string) {
  const spinner = ora(`Analyzing ${path.basename(filePath)}...`).start();
  try {
    const testFile = await prisma.testFile.upsert({
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
        healthScore: TestHealthScore.POOR,
      },
      update: {
        lastUpdated: new Date(),
      },
    });

    const typedTestFile = await convertPrismaTestFileToType(testFile);
    const analyzer = TestAnalyzer.getInstance();
    const sessionId = await analyzer.startAnalysis(typedTestFile);
    const result = await analyzer.analyzeTest(sessionId, typedTestFile);

    spinner.succeed(`Analysis complete for ${path.basename(filePath)}`);
    return result;
  } catch (error) {
    spinner.fail(`Error analyzing ${path.basename(filePath)}`);
    throw error;
  }
}

async function applyFixes(
  filePath: string,
  analysis: any,
  options: CommandOptions
): Promise<any[]> {
  const fixer = TestFixer.getInstance();
  const testFile = await convertPrismaTestFileToType(
    await prisma.testFile.findUnique({ where: { filePath } })
  );
  if (!testFile) throw new Error(`Test file not found: ${filePath}`);

  const issues = analysis.suggestions
    .filter((s: any) => s.type === "FIX" || s.type === "RELIABILITY")
    .map((s: any) => ({
      type: s.type.toLowerCase(),
      description: s.description,
      area: s.targetArea,
    }));

  if (issues.length === 0) return [];

  const result = await fixer.fixTest("default", testFile, issues);
  return [result];
}

async function generateTests(
  filePath: string,
  analysis: any,
  options: CommandOptions
): Promise<any[]> {
  const generator = TestGenerator.getInstance();
  const testFile = await convertPrismaTestFileToType(
    await prisma.testFile.findUnique({ where: { filePath } })
  );
  if (!testFile) throw new Error(`Test file not found: ${filePath}`);

  const type = options.type || "coverage";
  const targetArea = options.target;

  const result = await generator.generateTests("default", testFile, {
    type,
    targetArea,
  });

  return [result];
}

main();

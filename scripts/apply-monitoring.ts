import fs from "fs";
import path from "path";
import { promisify } from "util";

const readFile = promisify(fs.readFile);
const writeFile = promisify(fs.writeFile);

const API_DIRS = [
  "src/app/api/cortex",
  "src/app/api/nous",
  "src/app/api/keys",
  "src/app/api/health",
  "src/app/api/admin",
];

async function updateRouteFile(filePath: string) {
  const content = await readFile(filePath, "utf8");

  // Check for monitoring status
  const hasNewImport = content.includes('from "@middleware/newrelic"');
  const hasOldImport = content.includes('from "../middleware/newrelic"');

  // Start with removing old imports if they exist
  let newContent = content;
  if (hasOldImport) {
    // Remove the old import line
    newContent = newContent
      .split("\n")
      .filter((line) => !line.includes('from "../middleware/newrelic"'))
      .join("\n");
    console.log(`  Removed old import from: ${filePath}`);
  }

  // Add new import using path alias if needed
  if (!hasNewImport) {
    const importStatement = `import { withNewRelic } from "@middleware/newrelic";`;
    // Find the last import statement
    const importLines = newContent
      .split("\n")
      .filter((line) => line.trim().startsWith("import "));
    if (importLines.length > 0) {
      // Insert after the last import
      const lastImportIndex = newContent.lastIndexOf(
        importLines[importLines.length - 1]
      );
      newContent =
        newContent.slice(
          0,
          lastImportIndex + importLines[importLines.length - 1].length
        ) +
        "\n" +
        importStatement +
        newContent.slice(
          lastImportIndex + importLines[importLines.length - 1].length
        );
    } else {
      // No imports found, add at the beginning
      newContent = `${importStatement}\n${newContent}`;
    }
  }

  // Handle exports
  const lines = newContent.split("\n");
  const updatedLines: string[] = [];
  const seenExports = new Set<string>();
  let inFunctionBlock = false;
  let currentFunction = "";
  let functionLines: string[] = [];
  let braceCount = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmedLine = line.trim();

    // Count braces to properly track function blocks
    braceCount += (line.match(/{/g) || []).length;
    braceCount -= (line.match(/}/g) || []).length;

    // Remove existing wrapped exports
    if (
      trimmedLine.startsWith("export const") &&
      trimmedLine.includes("withNewRelic")
    ) {
      continue;
    }

    // Check for export declarations
    const exportMatch = line.match(
      /export (async )?function (GET|POST|PUT|DELETE|PATCH)/
    );
    if (exportMatch && !inFunctionBlock) {
      inFunctionBlock = true;
      currentFunction = exportMatch[2];
      // Generate a unique name for the function
      const uniqueName = `_${currentFunction}_handler`;
      // Replace export with async function
      functionLines = [
        line.replace(
          /export (async )?function (GET|POST|PUT|DELETE|PATCH)/,
          `async function ${uniqueName}`
        ),
      ];
      seenExports.add(currentFunction);
      // Add the export at the end
      updatedLines.push(
        `export const ${currentFunction} = withNewRelic(${uniqueName});`
      );
      continue;
    }

    if (inFunctionBlock) {
      functionLines.push(line);
      if (braceCount === 0) {
        inFunctionBlock = false;
        updatedLines.push(...functionLines);
        functionLines = [];
      }
      continue;
    }

    updatedLines.push(line);
  }

  newContent = updatedLines.join("\n");

  // Clean up any duplicate blank lines
  newContent = newContent.replace(/\n{3,}/g, "\n\n");

  await writeFile(filePath, newContent);
  console.log(`✓ Updated monitoring in: ${filePath}`);
}

async function processDirectory(dir: string) {
  const files = fs.readdirSync(dir);

  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory()) {
      await processDirectory(fullPath);
    } else if (file === "route.ts") {
      await updateRouteFile(fullPath);
    }
  }
}

async function main() {
  console.log("Updating New Relic monitoring imports to use path alias...\n");

  for (const dir of API_DIRS) {
    if (fs.existsSync(dir)) {
      await processDirectory(dir);
    }
  }

  console.log("\nDone! All routes now use path alias for New Relic imports.");
}

main().catch(console.error);

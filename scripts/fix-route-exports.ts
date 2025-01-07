import * as fs from "fs";
import * as path from "path";

const HTTP_METHODS = [
  "GET",
  "POST",
  "PUT",
  "PATCH",
  "DELETE",
  "HEAD",
  "OPTIONS",
];

function fixRouteFile(filePath: string) {
  let content = fs.readFileSync(filePath, "utf-8");
  let modified = false;

  // Remove old New Relic imports and withNewRelic wrappers
  const oldImportRegexes = [
    /import\s*{\s*withNewRelic\s*}\s*from\s*["']@middleware\/newrelic["'];?\n?/,
    /import\s*{\s*withNewRelic\s*}\s*from\s*["']\.\.\/\.\.\/middleware\/newrelic["'];?\n?/,
    /import\s*{\s*withNewRelic\s*}\s*from\s*["']\.\.\/middleware\/newrelic["'];?\n?/,
    /import\s*{\s*withNewRelic\s*}\s*from\s*["']\.\/middleware\/newrelic["'];?\n?/,
  ];

  oldImportRegexes.forEach((regex) => {
    if (regex.test(content)) {
      modified = true;
      content = content.replace(regex, "");
    }
  });

  // Remove withNewRelic wrappers
  HTTP_METHODS.forEach((method) => {
    const wrapperRegexes = [
      new RegExp(
        `export\\s*{\\s*withNewRelic\\(${method}\\)\\s+as\\s+${method}\\s*};?\\n?`
      ),
      new RegExp(
        `export\\s+const\\s+${method}\\s*=\\s*withNewRelic\\(.*?\\);?\\n?`,
        "s"
      ),
    ];

    wrapperRegexes.forEach((regex) => {
      if (regex.test(content)) {
        modified = true;
        if (content.includes(`async function ${method}`)) {
          content = content.replace(regex, `export { ${method} };`);
        } else {
          // If the function is not found, remove the export entirely
          content = content.replace(regex, "");
        }
      }
    });
  });

  // Add runtime if missing
  if (!content.includes("export const runtime")) {
    modified = true;
    const runtimeDeclaration =
      '\n// Declare Node.js runtime\nexport const runtime = "nodejs";\n';
    const importEnd = content.lastIndexOf("import");
    const importEndPos = content.indexOf(";", importEnd) + 1;
    const beforeImports = content.slice(0, importEndPos);
    const afterImports = content.slice(importEndPos);
    content = beforeImports + runtimeDeclaration + afterImports;
  }

  // Fix missing exports
  HTTP_METHODS.forEach((method) => {
    const methodRegex = new RegExp(`\\basync\\s+function\\s+${method}\\b`);
    const exportedMethodRegex = new RegExp(
      `\\bexport\\s+async\\s+function\\s+${method}\\b`
    );

    if (methodRegex.test(content) && !exportedMethodRegex.test(content)) {
      modified = true;
      content = content.replace(methodRegex, `export async function ${method}`);
    }
  });

  if (modified) {
    fs.writeFileSync(filePath, content);
    console.log(`Fixed exports in ${filePath}`);
  }
}

function findRouteFiles(dir: string) {
  const files = fs.readdirSync(dir);

  files.forEach((file) => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      findRouteFiles(filePath);
    } else if (file === "route.ts") {
      fixRouteFile(filePath);
    }
  });
}

// Start scanning from the api directory
const apiDir = path.join(process.cwd(), "src", "app", "api");
console.log("Scanning for route files...");
findRouteFiles(apiDir);
console.log("Done fixing route exports.");

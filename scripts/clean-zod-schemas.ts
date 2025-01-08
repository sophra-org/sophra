import * as fs from "fs";
import { glob } from "glob";
import * as path from "path";

const removeInvalidSchemas = async () => {
  const baseDir = path.join(
    process.cwd(),
    "src/lib/shared/database/validation/generated/outputTypeSchemas"
  );

  // Simplified pattern to match exactly what we're seeing
  const pattern = path.join(
    baseDir,
    "UpdateMany*AndReturnOutputTypeArgsSchema.ts"
  );

  console.log("Searching for pattern:", pattern);

  try {
    const files = await glob(pattern);
    console.log("Found files:", files);

    if (files.length === 0) {
      console.log("No invalid schema files found");
      return;
    }

    let deletedCount = 0;
    files.forEach((file) => {
      try {
        fs.unlinkSync(file);
        console.log(`Removed: ${path.basename(file)}`);
        deletedCount++;
      } catch (err) {
        console.error(`Error removing ${file}:`, err);
      }
    });

    console.log(`Successfully removed ${deletedCount} invalid schema files`);
  } catch (err) {
    console.error("Error finding files:", err);
    process.exit(1);
  }
};

// Check if directory exists first
const baseDir = path.join(
  process.cwd(),
  "src/lib/shared/database/validation/generated/outputTypeSchemas"
);
if (!fs.existsSync(baseDir)) {
  console.error("Directory does not exist:", baseDir);
  process.exit(1);
}

removeInvalidSchemas().catch((err) => {
  console.error("Unhandled error:", err);
  process.exit(1);
});

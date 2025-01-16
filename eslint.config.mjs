import { FlatCompat } from "@eslint/eslintrc";
import typescript from "@typescript-eslint/eslint-plugin";
import typescriptParser from "@typescript-eslint/parser";
import { dirname } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.extends("next/core-web-vitals"),
  {
    files: ["**/*.ts", "**/*.tsx"],
    languageOptions: {
      parser: typescriptParser,
      parserOptions: {
        project: "./tsconfig.json",
        tsconfigRootDir: ".",
      },
    },
    plugins: {
      "@typescript-eslint": typescript,
    },
    rules: {
      "@typescript-eslint/no-unused-vars": "off",
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/explicit-function-return-type": "off",
      "@typescript-eslint/explicit-module-boundary-types": "off",
      "import/no-unused-exports": "off"
    },
    settings: {
      "import/resolver": {
        typescript: {
          project: "./tsconfig.json",
          alwaysTryTypes: true,
        },
        alias: {
          map: [
            ["@", "./src"],
            ["@cortex/api", "./src/app/api/cortex"],
            ["@cortex/lib", "./src/lib/cortex"],
            ["@nous/api", "./src/app/api/nous"],
            ["@nous/lib", "./src/lib/nous"],
            ["@shared", "./lib/shared"],
            ["@prisma", "./lib/shared/database/client"],
            ["@logger", "./lib/shared/logger"],
            ["@database", "./lib/shared/database"],
            ["@middleware", "./src/app/api/middleware"],
          ],
          extensions: [".ts", ".tsx", ".js", ".jsx", ".json"],
        },
      },
    },
  },
];

export default eslintConfig;

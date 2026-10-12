import eslint from "@eslint/js";
import tseslint from "typescript-eslint";
import eslintConfigPrettier from "eslint-config-prettier/flat";

export default tseslint.config(
  eslint.configs.recommended,
  tseslint.configs.recommended,
  {
    files: ["**/*.ts", "**/*.tsx"],
    rules: {
      "@typescript-eslint/no-unused-vars": ["warn"],
    },
  },
  {
    files: ["e2e/tests/**/*.ts"],
    rules: {
      "@typescript-eslint/no-unused-vars": ["warn", { args: "none" }],
    },
  },
  {
    ignores: ["node_modules/**", "dist/**", "coverage/**", "playwright-report/**", "playwright-report-html/**"],
  },

  // Must be LAST
  eslintConfigPrettier
);
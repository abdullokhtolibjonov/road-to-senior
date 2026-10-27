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
    // .claude/skills holds third-party skill examples (k6 scripts with k6 globals), not project code
    ignores: ["node_modules/**", "dist/**", "coverage/**", "playwright-report/**", "playwright-report-html/**",
      "allure-results/**", "allure-report/**", ".claude/**"],
  },

  // Must be LAST
  eslintConfigPrettier
);
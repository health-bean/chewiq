import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    ignores: [
      "**/*.test.ts",
      "**/*.test.tsx",
      "**/*.example.tsx",
      "**/*.example.ts",
      "lib/correlations/test-*.ts",
      "lib/correlations/verify-*.ts",
      "archive/**",
      ".next/**",
      "node_modules/**",
    ],
  },
];

export default eslintConfig;

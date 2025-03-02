import { fileURLToPath } from "node:url";

import { GLOB_MARKDOWN_CODE } from "@antfu/eslint-config";
import { includeIgnoreFile } from "@eslint/compat";
import { vdustr } from "@vp-tw/eslint-config";
import path from "pathe";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const prettierignorePath = path.resolve(__dirname, ".prettierignore");

export default vdustr(
  {
    react: true,
  },
  includeIgnoreFile(prettierignorePath),
).append({
  files: [GLOB_MARKDOWN_CODE, "**/*.mdx/**.*"],
  rules: {
    "react-refresh/only-export-components": "off",
  },
});

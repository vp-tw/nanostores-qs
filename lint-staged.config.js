import process from "node:process";

// eslint-disable-next-line dot-notation -- tsgo requires bracket notation for index signatures
const isFormat = process.env["LINT_STAGED_TYPE"] === "format";

const config = isFormat
  ? {
      "**/*": [
        "eslint --report-unused-disable-directives --fix --max-warnings=0 --no-error-on-unmatched-pattern --no-warn-ignored",
        "oxfmt --write --no-error-on-unmatched-pattern",
      ],
    }
  : {
      "**/*": "cspell lint --no-must-find-files",
      "**/(*.{js,ts,jsx,tsx}|tsconfig.json|tsconfig.*.json)": () => "pnpm run -w checkTypes",
      "**/*.{js,jsx,ts,tsx}": "pnpm exec vitest related --run --passWithNoTests",
    };

export default config;

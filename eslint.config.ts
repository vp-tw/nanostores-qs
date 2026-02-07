import { GLOB_SRC } from "@antfu/eslint-config";
import { vdustr } from "@vp-tw/eslint-config";
import oxfmtConfig from "./.oxfmtrc.json" with { type: "json" };

export default vdustr(
  // @ts-expect-error TS2589 — ESLint config type recursion too deep for tsgo
  {
    react: true,
  },
  {
    ignores: oxfmtConfig.ignorePatterns,
  },
  {
    files: [GLOB_SRC],
    rules: {
      // Pre-existing demo code patterns — suppress until refactored
      "react/jsx-no-iife": "off",
      "react-hooks/set-state-in-effect": "off",
      "react-hooks-extra/no-direct-set-state-in-use-effect": "off",
    },
  },
);

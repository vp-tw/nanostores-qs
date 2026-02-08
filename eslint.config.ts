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
);

import process from "node:process";

import glob from "fast-glob";
import fs from "fs-extra";
import path from "pathe";

const isFormat = process.env.TYPE === "format";

const typescriptExtensions = ["js", "jsx", "ts", "tsx"];

const pkgs = glob.sync("packages/*", {
  absolute: false,
  onlyDirectories: true,
});

/**
 * Packages containing a `src` directory. Each package should have its own
 * tsconfig.json file located within the `src` directory.
 */
const withSrcPkgs = pkgs.filter((pkg) => fs.existsSync(path.join(pkg, "src")));

/**
 * @type {import('lint-staged').Configuration}
 */
const config = isFormat
  ? {
      "**/*.css": "stylelint --fix",
      "**/*": [
        "eslint --report-unused-disable-directives --fix --max-warnings=0 --no-error-on-unmatched-pattern --no-warn-ignored",
        "prettier --ignore-unknown --write",
      ],
    }
  : {
      "**/*": "cspell lint --no-must-find-files",
      ...Object.fromEntries(
        pkgs.flatMap((pkg) => {
          if (withSrcPkgs.includes(pkg)) {
            return [
              [`${pkg}/*.config.{js,ts}`, () => `pnpm exec tsc -p ${pkg}`],
              [
                `${pkg}/src/**/*.{${typescriptExtensions.join(",")}}`,
                () => `pnpm exec tsc -p ${pkg}/src`,
              ],
            ];
          }
          return [
            [
              `${pkg}/**/*.{${typescriptExtensions.join(",")}}`,
              () => `pnpm exec tsc -p ${pkg}`,
            ],
          ];
        }),
      ),
    };

export default config;

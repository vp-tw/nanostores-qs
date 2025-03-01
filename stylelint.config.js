/**
 * @type {import('stylelint').Config}
 */
const config = {
  allowEmptyInput: true,
  extends: [
    "stylelint-config-standard",
    "stylelint-config-idiomatic-order",
    "stylelint-prettier/recommended",
  ],
  fix: true,
  overrides: [
    {
      files: ["*.cjs", "*.js", "*.jsx", "*.ts", "*.tsx"],
      customSyntax: "postcss-styled-syntax",
    },
  ],
};

export default config;

---
"@vp-tw/nanostores-qs": major
---

## Breaking Changes

- **nanostores peer dependency**: ^0.11.4 → ^1.1.0 (nanostores 1.x)
- **@nanostores/react**: ^0.8.4 → ^1.0.0 (required for nanostores 1.x compatibility)
- **Minimum Node.js**: >=20.19.0

## Tooling Migration

- Replace Lerna with @changesets/cli for version management
- Replace Prettier with oxfmt for code formatting
- Replace tsc type checking with tsgo (TypeScript native preview) in build mode
- Upgrade ESLint ecosystem (@antfu/eslint-config v7, @vp-tw/eslint-config v1)
- Upgrade @vp-tw/tsconfig v3 → v4 with TypeScript project references
- Remove Stylelint

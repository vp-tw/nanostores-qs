# Change Log

## 1.0.0

### Major Changes

- 9de1496: ## Breaking Changes

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

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

## [0.3.1](https://github.com/VdustR/nanostores-qs/compare/v0.3.0...v0.3.1) (2025-06-27)

### Bug Fixes

- **nanostores-qs:** fix default encode and pathname ([#12](https://github.com/VdustR/nanostores-qs/issues/12)) ([709d1c0](https://github.com/VdustR/nanostores-qs/commit/709d1c059b864fd913cff2a89d06ba83487b7c72))

# [0.3.0](https://github.com/VdustR/nanostores-qs/compare/v0.2.1...v0.3.0) (2025-05-23)

### Bug Fixes

- **nanostores-qs:** skip for ssr ([#10](https://github.com/VdustR/nanostores-qs/issues/10)) ([ba9f2fb](https://github.com/VdustR/nanostores-qs/commit/ba9f2fba099f973c342185f2ff7334bbdcdf3223))

### Features

- **nanostores-qs:** force update option ([#9](https://github.com/VdustR/nanostores-qs/issues/9)) ([bcf5c3c](https://github.com/VdustR/nanostores-qs/commit/bcf5c3cd443467c65c6c5c67143be2030e6e293e))

## [0.2.1](https://github.com/VdustR/nanostores-qs/compare/v0.2.0...v0.2.1) (2025-03-16)

**Note:** Version bump only for package @vp-tw/nanostores-qs

# 0.2.0 (2025-03-16)

### Bug Fixes

- **nanostores-qs:** fix types for build ([16a1125](https://github.com/VdustR/nanostores-qs/commit/16a11259e450722fedfecab4a64c6cbb95c22518))

### Features

- **nanostores-qs:** update method for SearchParamsStore ([d3fdf03](https://github.com/VdustR/nanostores-qs/commit/d3fdf03d32630c0c746c24ad75adac5f5709e54c))

# 0.1.0 (2025-03-16)

### Bug Fixes

- **nanostores-qs:** fix types for build ([16a1125](https://github.com/VdustR/nanostores-qs/commit/16a11259e450722fedfecab4a64c6cbb95c22518))

### Features

- **nanostores-qs:** update method for SearchParamsStore ([d3fdf03](https://github.com/VdustR/nanostores-qs/commit/d3fdf03d32630c0c746c24ad75adac5f5709e54c))

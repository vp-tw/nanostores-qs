---
name: nanostore-qs
description: How to use @vp-tw/nanostores-qs — reactive, type-safe query string management with nanostores
---

# @vp-tw/nanostores-qs Usage Guide

## Quick Setup

```tsx
import { createQsUtils } from "@vp-tw/nanostores-qs";
import * as presets from "@vp-tw/nanostores-qs/presets";

const qsUtils = createQsUtils();
```

## Single Parameter Store

```tsx
const pageStore = qsUtils.createSearchParamStore("page", presets.integer);

// Read (React)
const page = useStore(pageStore.$value); // number (NaN when absent)

// Update URL
pageStore.update(42); // pushState
pageStore.update(42, { replace: true }); // replaceState

// Dry-run (no side effects — for link building)
const nextSearch = pageStore.update.dry(100); // "?page=100"
```

## Multi-Parameter Store

```tsx
const filters = qsUtils.createSearchParamsStore({
  search: presets.string,
  page: presets.integer.optional,
  sort: presets.enum(["newest", "oldest", "popular"]),
});

// Read all values
const values = useStore(filters.$values);

// Update single field
filters.update("page", 2);

// Update all atomically (single history entry)
filters.updateAll({ ...values, search: "query", page: undefined });

// Dry-run
const preview = filters.updateAll.dry({ ...values, page: 1 });
```

## Available Presets

`import * as presets from "@vp-tw/nanostores-qs/presets"`. Each preset has `.optional`, `.array`, and `.default(value)` modifiers:

| Preset                           | Type                     | Default         |
| -------------------------------- | ------------------------ | --------------- |
| `presets.string`                 | `string`                 | `""`            |
| `presets.string.optional`        | `string \| undefined`    | `undefined`     |
| `presets.string.array`           | `string[]`               | `[]`            |
| `presets.integer`                | `number`                 | `NaN`           |
| `presets.integer.optional`       | `number \| undefined`    | `undefined`     |
| `presets.integer.array`          | `number[]`               | `[]`            |
| `presets.float`                  | `number`                 | `NaN`           |
| `presets.float.optional`         | `number \| undefined`    | `undefined`     |
| `presets.float.array`            | `number[]`               | `[]`            |
| `presets.boolean`                | `boolean`                | `false`         |
| `presets.boolean.optional`       | `boolean \| undefined`   | `undefined`     |
| `presets.enum(options)`          | `T[number]`              | First element   |
| `presets.enum(options).optional` | `T[number] \| undefined` | `undefined`     |
| `presets.enum(options).array`    | `T[number][]`            | `[]`            |
| `presets.date`                   | `Date`                   | `new Date(NaN)` |
| `presets.date.optional`          | `Date \| undefined`      | `undefined`     |
| `presets.date.array`             | `Date[]`                 | `[]`            |
| `presets.ymd`                    | `string`                 | `"0000-00-00"`  |
| `presets.hms`                    | `string`                 | `"00:00:00"`    |

### Integer rounding variants

| Variant                 | Description               |
| ----------------------- | ------------------------- |
| `presets.integer`       | `Math.round` (default)    |
| `presets.integer.round` | Same as `presets.integer` |
| `presets.integer.ceil`  | `Math.ceil`               |
| `presets.integer.floor` | `Math.floor`              |
| `presets.integer.parse` | `parseInt` (truncates)    |

### Float precision

```ts
presets.float.fixed(2); // e.g., 3.14 — encodes with toFixed(2)
```

### `.default(value)` modifier

Override the type's inherent default with a custom value. Terminal modifier (no further chaining):

```ts
presets.integer.default(1); // number, default 1 instead of NaN
presets.integer.ceil.default(0); // number, uses Math.ceil, default 0
presets.float.fixed(2).default(0); // number, 2 decimal places, default 0
presets.string.default("all"); // string, default "all" instead of ""
```

## Update Options

```tsx
store.update(value, {
  replace: true, // replaceState instead of pushState
  keepHash: true, // preserve URL hash
  force: true, // bypass equality check
  state: {}, // custom History API state
});
```

## Router Integration with .dry()

Use `.dry()` to generate search strings for router-based navigation:

```tsx
const nextSearch = filters.updateAll.dry({ ...values, sort: "popular" });

// React Router
<Link to={{ pathname, search: nextSearch }}>Popular</Link>;

// Next.js
router.push(`${pathname}${nextSearch}`);
```

**Why `.dry()`?** Calling `update()` mutates the History API directly, bypassing router features (navigation blocking, loaders, transitions). `.dry()` lets your router handle the navigation.

## Custom Presets

Use `createPreset` for presets with automatic `.optional` and `.array` variants:

```ts
import { createPreset } from "@vp-tw/nanostores-qs/presets";

const bounded = (min: number, max: number) =>
  createPreset({
    decode: (value: unknown) => {
      const n = Number(value);
      if (Number.isNaN(n)) throw new Error("invalid");
      return Math.max(min, Math.min(max, n));
    },
    defaultValue: min,
    encode: (v) => String(v),
  });

// bounded(1, 100)             — base
// bounded(1, 100).optional    — no defaultValue
// bounded(1, 100).array       — array variant
// bounded(1, 100).default(50) — custom default
```

## Custom QS Library

```ts
import { parse, stringify } from "qs";

const qsUtils = createQsUtils({
  qs: {
    parse: (search) => parse(search, { ignoreQueryPrefix: true }),
    stringify: (values) => stringify(values),
  },
});
```

## Key Patterns

1. **Correlated params**: Use `updateAll` when changing one param should reset another (e.g., search -> reset page)
2. **Router integration**: Always use `.dry()` + router navigation when your app has route guards/loaders
3. **Custom presets**: Use `createPreset` for reusable decode/encode logic with automatic `.optional`/`.array`/`.default()` modifiers
4. **Custom defaults**: Use `.default(value)` when the type's inherent default isn't appropriate (e.g., `presets.integer.default(1)` for page numbers)
5. **Validation**: Handle in `decode` — throw to reject invalid input (filtered out in `.array`, falls back to `defaultValue` in base)

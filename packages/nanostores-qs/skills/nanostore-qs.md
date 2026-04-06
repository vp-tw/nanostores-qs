---
name: nanostore-qs
description: How to use @vp-tw/nanostores-qs — reactive, type-safe query string management with nanostores
---

# @vp-tw/nanostores-qs Usage Guide

## Quick Setup

```tsx
import { createQsUtils } from "@vp-tw/nanostores-qs";
import { boolean, integer, enum as presetEnum } from "@vp-tw/nanostores-qs/presets";

const qsUtils = createQsUtils();
```

## Single Parameter Store

```tsx
const pageStore = qsUtils.createSearchParamStore("page", integer);

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
  search: string,
  page: integer.optional,
  sort: presetEnum(["newest", "oldest", "popular"]),
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

Import from `@vp-tw/nanostores-qs/presets`. Each preset has `.optional` and `.array` variants:

| Preset                   | Type                     | Default         |
| ------------------------ | ------------------------ | --------------- |
| `string`                 | `string`                 | `""`            |
| `string.optional`        | `string \| undefined`    | `undefined`     |
| `string.array`           | `string[]`               | `[]`            |
| `integer`                | `number`                 | `NaN`           |
| `integer.optional`       | `number \| undefined`    | `undefined`     |
| `integer.array`          | `number[]`               | `[]`            |
| `float`                  | `number`                 | `NaN`           |
| `float.optional`         | `number \| undefined`    | `undefined`     |
| `float.array`            | `number[]`               | `[]`            |
| `boolean`                | `boolean`                | `false`         |
| `boolean.optional`       | `boolean \| undefined`   | `undefined`     |
| `enum(options)`          | `T[number]`              | First element   |
| `enum(options).optional` | `T[number] \| undefined` | `undefined`     |
| `enum(options).array`    | `T[number][]`            | `[]`            |
| `date`                   | `Date`                   | `new Date(NaN)` |
| `date.optional`          | `Date \| undefined`      | `undefined`     |
| `date.array`             | `Date[]`                 | `[]`            |
| `ymd`                    | `string`                 | `"0000-00-00"`  |
| `hms`                    | `string`                 | `"00:00:00"`    |

### Integer rounding variants

| Variant         | Description            |
| --------------- | ---------------------- |
| `integer`       | `Math.round` (default) |
| `integer.round` | Same as `integer`      |
| `integer.ceil`  | `Math.ceil`            |
| `integer.floor` | `Math.floor`           |
| `integer.parse` | `parseInt` (truncates) |

### Float precision

```ts
float.fixed(2); // e.g., 3.14 — encodes with toFixed(2)
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

// bounded(1, 100)          — base
// bounded(1, 100).optional — no defaultValue
// bounded(1, 100).array    — array variant
```

Or use `defineSearchParam` for standalone presets (decoupled from createQsUtils):

```ts
import { defineSearchParam } from "@vp-tw/nanostores-qs/defineSearchParam";

const presetBoundedInt = (min: number, max: number) =>
  defineSearchParam({
    decode: (value) => {
      const int = Number.parseInt(String(value), 10);
      if (Number.isNaN(int)) return undefined;
      return Math.max(min, Math.min(max, int));
    },
  }).setEncode((value) => {
    if (value == null) return undefined;
    return String(Math.max(min, Math.min(max, value)));
  });
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
3. **Custom presets**: Use `createPreset` for reusable decode/encode logic with automatic `.optional`/`.array` variants
4. **Validation**: Handle in `decode` — throw to reject invalid input (filtered out in `.array`, falls back to `defaultValue` in base)

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
const pageStore = qsUtils.createSearchParamStore("page", presets.integer({ default: 1, min: 0 }));

// Read (React)
const page = useStore(pageStore.$value); // number (1 when absent)

// Update URL
pageStore.update(42); // pushState
pageStore.update(42, { replace: true }); // replaceState

// Dry-run (no side effects — for link building)
const nextSearch = pageStore.update.dry(100); // "?page=100"
```

## Multi-Parameter Store

```tsx
const filters = qsUtils.createSearchParamsStore({
  search: presets.string(),
  page: presets.integer({ optional: true, min: 0 }),
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

`import * as presets from "@vp-tw/nanostores-qs/presets"`. All presets are functions that accept an options object:

| Preset                                      | Type                     | Default         |
| ------------------------------------------- | ------------------------ | --------------- |
| `presets.string()`                          | `string`                 | `""`            |
| `presets.string({ optional: true })`        | `string \| undefined`    | `undefined`     |
| `presets.string({ array: true })`           | `string[]`               | `[]`            |
| `presets.integer()`                         | `number`                 | `NaN`           |
| `presets.integer({ optional: true })`       | `number \| undefined`    | `undefined`     |
| `presets.integer({ array: true })`          | `number[]`               | `[]`            |
| `presets.float()`                           | `number`                 | `NaN`           |
| `presets.float({ optional: true })`         | `number \| undefined`    | `undefined`     |
| `presets.float({ array: true })`            | `number[]`               | `[]`            |
| `presets.boolean()`                         | `boolean`                | `false`         |
| `presets.boolean({ optional: true })`       | `boolean \| undefined`   | `undefined`     |
| `presets.enum(options)`                     | `T[number]`              | First element   |
| `presets.enum(options, { optional: true })` | `T[number] \| undefined` | `undefined`     |
| `presets.enum(options, { array: true })`    | `T[number][]`            | `[]`            |
| `presets.date()`                            | `Date`                   | `new Date(NaN)` |
| `presets.date({ optional: true })`          | `Date \| undefined`      | `undefined`     |
| `presets.date({ array: true })`             | `Date[]`                 | `[]`            |
| `presets.ymd()`                             | `string`                 | `"0000-00-00"`  |
| `presets.hms()`                             | `string`                 | `"00:00:00"`    |

### Integer-specific options

| Option       | Type                                      | Default      | Description              |
| ------------ | ----------------------------------------- | ------------ | ------------------------ |
| `round`      | `"round" \| "ceil" \| "floor" \| "parse"` | `"round"`    | Rounding mode            |
| `min`        | `number`                                  | Min safe int | Minimum allowed value    |
| `max`        | `number`                                  | Max safe int | Maximum allowed value    |
| `outOfRange` | `"clamp" \| "reject"`                     | `"clamp"`    | Clamp to range or reject |

```ts
presets.integer({ round: "ceil" }); // Math.ceil
presets.integer({ round: "ceil", default: 0 }); // Math.ceil, default 0
presets.integer({ min: 1, max: 100, default: 1 }); // clamped 1-100
```

### Float-specific options

```ts
presets.float({ fixed: 2 }); // 2 decimal places
presets.float({ fixed: 2, default: 0 }); // 2 decimal places, default 0
```

### Custom defaults

Use the `default` option to override the type's inherent default:

```ts
presets.integer({ default: 1, min: 0 }); // number, default 1 instead of NaN
presets.string({ default: "all" }); // string, default "all" instead of ""
presets.boolean({ default: true }); // boolean, default true instead of false
presets.enum(["a", "b"], { default: "b" }); // enum, default "b" instead of "a"
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

Use `createPreset` for presets with the same function-based options API:

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

// bounded(1, 100)()                    — base
// bounded(1, 100)({ optional: true })  — no defaultValue
// bounded(1, 100)({ array: true })     — array variant
// bounded(1, 100)({ default: 50 })     — custom default
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
3. **Custom presets**: Use `createPreset` for reusable decode/encode logic with automatic `{ optional }` / `{ array }` / `{ default }` options
4. **Custom defaults**: Use `{ default: value }` when the type's inherent default isn't appropriate (e.g., `presets.integer({ default: 1, min: 0 })` for page numbers)
5. **Validation**: Handle in `decode` — throw to reject invalid input (filtered out in `{ array: true }`, falls back to `defaultValue` in base)

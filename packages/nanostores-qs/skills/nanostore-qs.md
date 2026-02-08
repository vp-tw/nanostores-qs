---
name: nanostore-qs
description: How to use @vp-tw/nanostores-qs — reactive, type-safe query string management with nanostores
---

# @vp-tw/nanostores-qs Usage Guide

## Quick Setup

```tsx
import { createQsUtils } from "@vp-tw/nanostores-qs";
import { presetBoolean, presetEnum, presetInt } from "@vp-tw/nanostores-qs/presets";

const qsUtils = createQsUtils();
```

## Single Parameter Store

```tsx
const pageStore = qsUtils.createSearchParamStore("page", presetInt);

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
  search: presetString,
  page: presetIntOptional,
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

Import from `@vp-tw/nanostores-qs/presets`:

| Preset                        | Type                     | Default         |
| ----------------------------- | ------------------------ | --------------- |
| `presetString`                | `string`                 | `""`            |
| `presetStringOptional`        | `string \| undefined`    | `undefined`     |
| `presetStringArray`           | `string[]`               | `[]`            |
| `presetInt`                   | `number`                 | `NaN`           |
| `presetIntOptional`           | `number \| undefined`    | `undefined`     |
| `presetIntArray`              | `number[]`               | `[]`            |
| `presetFloat`                 | `number`                 | `NaN`           |
| `presetFloatOptional`         | `number \| undefined`    | `undefined`     |
| `presetFloatArray`            | `number[]`               | `[]`            |
| `presetBoolean`               | `boolean`                | `false`         |
| `presetBooleanOptional`       | `boolean \| undefined`   | `undefined`     |
| `presetEnum(options)`         | `T[number]`              | First element   |
| `presetEnumOptional(options)` | `T[number] \| undefined` | `undefined`     |
| `presetEnumArray(options)`    | `T[number][]`            | `[]`            |
| `presetDate`                  | `Date`                   | `new Date(NaN)` |
| `presetDateOptional`          | `Date \| undefined`      | `undefined`     |
| `presetDateArray`             | `Date[]`                 | `[]`            |

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

1. **Correlated params**: Use `updateAll` when changing one param should reset another (e.g., search → reset page)
2. **Router integration**: Always use `.dry()` + router navigation when your app has route guards/loaders
3. **Custom presets**: Use `defineSearchParam` for reusable decode/encode logic across stores
4. **Validation**: Handle in `decode` — return `defaultValue` on invalid input

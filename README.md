# @vp-tw/nanostores-qs

Reactive, type-safe query string management built on top of [nanostores](https://github.com/nanostores/nanostores).

## Why `@vp-tw/nanostores-qs`?

- 🔄 Reactive stores that stay in sync with the URL.
- 🔍 Type-safe parameter definitions with encode/decode.
- 🧪 Dry-run URL generation via `.dry` (no history side effects) — great for link building and router integrations.
- 🧩 Works with native `URLSearchParams` or custom libs like [`qs`](https://www.npmjs.com/package/qs) or [`query-string`](https://www.npmjs.com/package/query-string).
- 🪝 Framework-friendly via Nanostores.
- 🔢 Arrays, numbers, dates, and custom types.
- ✅ Validation-friendly (zod, arktype, etc.).

## Installation

```bash
# npm
npm install @vp-tw/nanostores-qs @nanostores/react nanostores

# yarn
yarn add @vp-tw/nanostores-qs @nanostores/react nanostores

# pnpm
pnpm install @vp-tw/nanostores-qs @nanostores/react nanostores
```

## Quick Start

```tsx
import { useStore } from "@nanostores/react";
import { createQsUtils } from "@vp-tw/nanostores-qs";
import { presetBoolean, presetEnum, presetInt } from "@vp-tw/nanostores-qs/presets";

const qsUtils = createQsUtils();

// Single parameter with a preset
const pageStore = qsUtils.createSearchParamStore("page", presetInt);

// Multiple parameters with presets
const filters = qsUtils.createSearchParamsStore({
  page: presetInt,
  sort: presetEnum(["newest", "oldest", "popular"]),
  showArchived: presetBoolean,
});

function Filters() {
  const page = useStore(pageStore.$value); // number (NaN when absent)
  const values = useStore(filters.$values); // { page, sort, showArchived }
  return (
    <div>
      <p>Page: {Number.isNaN(page) ? "—" : page}</p>
      <button
        type="button"
        onClick={() => filters.updateAll({ ...values, page: 1, sort: "popular" })}
      >
        Popular first
      </button>
    </div>
  );
}
```

## Presets

Built-in presets for common parameter types. Import from `@vp-tw/nanostores-qs/presets`:

```bash
import { presetInt, presetEnum, presetBoolean } from "@vp-tw/nanostores-qs/presets";
```

| Preset                    | Value Type               | Description                                             |
| ------------------------- | ------------------------ | ------------------------------------------------------- |
| `presetString`            | `string`                 | String with `""` as default, omitted when empty         |
| `presetStringOptional`    | `string \| undefined`    | Optional string (`undefined` when missing)              |
| `presetStringArray`       | `Array<string>`          | Array of strings                                        |
| `presetInt`               | `number`                 | Integer, `NaN` as default, omitted when `NaN`           |
| `presetIntOptional`       | `number \| undefined`    | Integer, `undefined` for invalid                        |
| `presetIntArray`          | `Array<number>`          | Array of integers, filters invalid                      |
| `presetFloat`             | `number`                 | Float, `NaN` as default, omitted when `NaN`             |
| `presetFloatOptional`     | `number \| undefined`    | Float, `undefined` for invalid                          |
| `presetFloatArray`        | `Array<number>`          | Array of floats, filters invalid                        |
| `presetBoolean`           | `boolean`                | `true` = `"true"`, `false` = omitted                    |
| `presetBooleanOptional`   | `boolean \| undefined`   | `"true"`/`"false"` or `undefined`                       |
| `presetEnum(arr)`         | `T[number]`              | Falls back to first element for invalid                 |
| `presetEnumOptional(arr)` | `T[number] \| undefined` | `undefined` for invalid                                 |
| `presetEnumArray(arr)`    | `Array<T[number]>`       | Filters invalid values                                  |
| `presetDate`              | `Date`                   | ISO string, invalid = `Date(NaN)`, omitted when invalid |
| `presetDateOptional`      | `Date \| undefined`      | `undefined` for invalid                                 |
| `presetDateArray`         | `Array<Date>`            | Filters invalid dates                                   |

## Core Concepts

- `createQsUtils(options?)`: factory that exposes reactive URL state and helpers.
  - `$search`: current `window.location.search` string.
  - `$urlSearchParams`: `URLSearchParams` derived from `$search`.
  - `$qs`: parsed query object (`string | string[] | undefined` values by default).
  - `createSearchParamStore(name, preset?)`: single-parameter store.
  - `createSearchParamsStore(configs)`: multi-parameter store.
  - For custom decode/encode logic, see [Advanced: Inline Configuration](#advanced-inline-configuration).

## Single-Parameter Store (`createSearchParamStore`)

Create a store for one query parameter. Pass a preset for type-safe decode/encode; update mutates history, and `.dry` returns the next search string without side effects.

```tsx
const pageStore = qsUtils.createSearchParamStore("page", presetInt);

// Read in React
const page = useStore(pageStore.$value); // number

// Mutate URL
pageStore.update(42); // push history
pageStore.update(42, { replace: true, keepHash: true });

// Dry-run: just compute next search
const nextSearch = pageStore.update.dry(100); // "?page=100"
```

Notes:

- When a new value equals the default, the parameter is removed from the URL.
- Use `force: true` to bypass equality checks and always write.

## Multi-Parameter Store (`createSearchParamsStore`)

Manage multiple query parameters together with ergonomic `update` and `updateAll`. Both have `.dry` counterparts for computing the next search string.

```tsx
import {
  presetEnum,
  presetIntOptional,
  presetString,
  presetStringArray,
} from "@vp-tw/nanostores-qs/presets";

const filters = qsUtils.createSearchParamsStore({
  search: presetString,
  category: presetStringArray,
  minPrice: presetIntOptional,
  maxPrice: presetIntOptional,
  sortBy: presetEnum(["newest", "price_asc", "price_desc"]),
});

// Mutate URL
filters.update("minPrice", 100);
filters.updateAll({
  search: "headphones",
  category: ["wireless", "anc"],
  minPrice: 100,
  maxPrice: 300,
  sortBy: "newest",
});

// Dry-run (for links/router)
const preview = filters.updateAll.dry({
  ...filters.$values.get(),
  sortBy: "price_asc",
});
// "?search=headphones&category=wireless&category=anc&minPrice=100&maxPrice=300&sortBy=price_asc"
```

## Router Integration

Use `.dry` to generate the `search` string, then let your router perform navigation. This keeps router features (navigation blocking, data loaders, transitions, scroll restoration, analytics) intact and avoids conflicts with direct History API calls.

```tsx
import { Link, useLocation, useNavigate } from "react-router-dom";

const location = useLocation();

const nextSearch = filters.updateAll.dry({
  ...filters.$values.get(),
  sortBy: "price_desc",
});

// 1) Plain anchor href
<a href={`${location.pathname}${nextSearch}`}>Apply filters</a>;

// 2) React Router <Link>
<Link
  to={{
    pathname: location.pathname,
    search: nextSearch,
  }}
>
  Newest
</Link>;

// 3) React Router navigate()
const navigate = useNavigate();
function onApply() {
  navigate({ pathname: location.pathname, search: nextSearch });
}
```

Notes:

- Calling `update`/`updateAll` mutates history directly and may bypass router-level hooks/blockers.
- Prefer `.dry` + router navigation when your app relies on router features such as navigation blocking.

## Good Practices

- Integrate with routers using `.dry`:
  - Generate `search` via `.dry` and hand it to your router (`Link`, `navigate`, etc.).
  - Preserves router features like navigation blocking, transitions, scroll restoration, analytics, loaders.
  - Avoids potential conflicts from calling the History API directly.

- Update correlated params together with `createSearchParamsStore`:
  - Example: when `search` changes, reset `page` to `1` in a single update to keep state consistent and produce a single history entry.

```tsx
import { presetInt, presetString } from "@vp-tw/nanostores-qs/presets";

const qsUtils = createQsUtils();

// Correlated params: search + page
const list = qsUtils.createSearchParamsStore({
  search: presetString,
  page: presetInt,
});

// Good: one atomic update (single history entry, consistent UI)
function onSearchChange(term: string) {
  list.updateAll({ ...list.$values.get(), search: term, page: 1 });
}

// Bad: two separate single-param updates (can create two entries and transient states)
const searchStore = qsUtils.createSearchParamStore("search", presetString);
const pageStore = qsUtils.createSearchParamStore("page", presetInt);

function onSearchChangeBad(term: string) {
  searchStore.update(term); // 1st history mutation
  pageStore.update(1); // 2nd history mutation, possible transient UI state
}
```

### Update Options

`nanostores-qs` only mutates the parameter(s) it manages. Options:

- `replace`: use `history.replaceState` instead of `pushState`.
- `keepHash`: keep the current `location.hash` in the URL.
- `state`: custom state passed to the History API.
- `force`: bypass equality check and force an update.

## Defaults and Equality

If a value equals its `defaultValue`, the parameter is removed from the URL to keep it clean. Customize equality with `isEqual` when creating the utils:

```ts
const qsUtils = createQsUtils({
  isEqual: (a, b) => JSON.stringify(a) === JSON.stringify(b),
});
```

Default `isEqual` comes from `es-toolkit`.

## Advanced

### Advanced: Inline Configuration

For cases where presets don't fit, you can use the inline `def()` callback or a config object directly.

#### Single-parameter inline config

```tsx
// num: number | "" (empty string) — demonstrates custom decode with defaultValue
const num = qsUtils.createSearchParamStore("num", (def) =>
  def({ decode: (v) => (!v ? "" : Number(v)), defaultValue: "" }),
);

// Read in React
const value = useStore(num.$value);

// Mutate URL
num.update(42); // push history
num.update(42, { replace: true, keepHash: true });

// Dry-run: just compute next search
const nextSearch = num.update.dry(100); // "?num=100"
```

#### Multi-parameter inline config

```tsx
const filters = qsUtils.createSearchParamsStore((def) => ({
  search: def({ defaultValue: "" }),
  category: def({ isArray: true }),
  minPrice: def({ decode: Number }).setEncode(String),
  maxPrice: def({ decode: Number }).setEncode(String),
  sortBy: def({ defaultValue: "newest" }),
}));
```

### Advanced: Custom Presets

Use `defineSearchParam` to create reusable custom presets:

```bash
import { defineSearchParam } from "@vp-tw/nanostores-qs/defineSearchParam";
```

#### Int with min/max

Add validation and clamping logic on top of a preset:

```typescript
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

const pageStore = qsUtils.createSearchParamStore("page", presetBoundedInt(1, 100));
```

#### Comma-separated array

A single URL parameter representing an array (vs `isArray: true` which uses multiple same-name parameters):

```typescript
const presetCommaSeparated = defineSearchParam({
  decode: (value) =>
    String(value)
      .split(",")
      .filter((s) => s.length > 0),
  defaultValue: [] as Array<string>,
}).setEncode((value) => (value.length === 0 ? undefined : value.join(",")));

// URL: ?tags=react,typescript,nanostores
const tagsStore = qsUtils.createSearchParamStore("tags", presetCommaSeparated);
```

#### JSON object

Serialize complex objects to/from URL parameters:

```typescript
const presetJson = <T>(defaultValue: T) =>
  defineSearchParam({
    decode: (value) => {
      try {
        return JSON.parse(String(value)) as T;
      } catch {
        return defaultValue;
      }
    },
    defaultValue,
  }).setEncode((value) => JSON.stringify(value));

// URL: ?filter=%7B%22status%22%3A%22active%22%7D
const filterStore = qsUtils.createSearchParamStore("filter", presetJson({ status: "active" }));
```

### Advanced: Validation and Custom Types

You can validate via `decode` and fall back to `defaultValue` on failure.

```tsx
import { z } from "zod";

const SortOptionSchema = z.enum(["newest", "price_asc", "price_desc"]);
type SortOption = z.infer<typeof SortOptionSchema>;

const sort = qsUtils.createSearchParamStore("sort", {
  decode: (v) => SortOptionSchema.parse(v),
  defaultValue: SortOptionSchema[0],
});

function SortSelector() {
  const option = useStore(sort.$value); // SortOption
  return (
    <select value={option} onChange={(e) => sort.update(e.target.value as SortOption)}>
      {SortOptionSchema.options.map((o) => (
        <option key={o} value={o}>
          {o}
        </option>
      ))}
    </select>
  );
}
```

## Using a Custom Query String Library

```ts
import { parse, stringify } from "qs";

const qsUtils = createQsUtils({
  qs: {
    parse: (search) => parse(search, { ignoreQueryPrefix: true }),
    stringify: (values) => stringify(values),
  },
});
```

## Routing Notes

- When `window` is unavailable, the internal search defaults to an empty string; listeners are not attached.
- The utils listen to `popstate` and patch `pushState/replaceState` to stay reactive with navigation.

## Release

```bash
pnpm pub
```

## License

[MIT](./LICENSE)

Copyright (c) 2025-2026 ViPro <vdustr@gmail.com> (<http://vdustr.dev>)

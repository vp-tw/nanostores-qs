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

const qsUtils = createQsUtils();
const str = qsUtils.createSearchParamStore("str");

function StrInput() {
  const value = useStore(str.$value); // string | undefined
  return <input value={value ?? ""} onChange={(e) => str.update(e.target.value)} />;
}
```

## Core Concepts

- `createQsUtils(options?)`: factory that exposes reactive URL state and helpers.
  - `$search`: current `window.location.search` string.
  - `$urlSearchParams`: `URLSearchParams` derived from `$search`.
  - `$qs`: parsed query object (`string | string[] | undefined` values by default).
  - `createSearchParamStore(name, config?)`: single-parameter store.
  - `createSearchParamsStore(configs)`: multi-parameter store.
  - `defineSearchParam(config).setEncode(fn)`: helper to attach an `encode` function.

## Single-Parameter Store (`createSearchParamStore`)

Create a store for one query parameter. Configure decode/encode and defaults; update mutates history, and `.dry` returns the next search string without side effects.

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

Notes:

- When a new value equals the default, the parameter is removed from the URL.
- Use `force: true` to bypass equality checks and always write.

## Multi-Parameter Store (`createSearchParamsStore`)

Manage multiple query parameters together with ergonomic `update` and `updateAll`. Both have `.dry` counterparts for computing the next search string.

```tsx
const filters = qsUtils.createSearchParamsStore((def) => ({
  search: def({ defaultValue: "" }),
  category: def({ isArray: true }),
  minPrice: def({ decode: Number }).setEncode(String),
  maxPrice: def({ decode: Number }).setEncode(String),
  sortBy: def({ defaultValue: "newest" }),
}));

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
const qsUtils = createQsUtils();

// Correlated params: search + page
const list = qsUtils.createSearchParamsStore((def) => ({
  search: def({ defaultValue: "" }),
  page: def({ decode: Number, defaultValue: 1 }).setEncode(String),
}));

// Good: one atomic update (single history entry, consistent UI)
function onSearchChange(term: string) {
  list.updateAll({ ...list.$values.get(), search: term, page: 1 });
}

// Bad: two separate single-param updates (can create two entries and transient states)
const searchStore = qsUtils.createSearchParamStore("search", {
  defaultValue: "",
});
const pageStore = qsUtils.createSearchParamStore("page", (def) =>
  def({ decode: Number, defaultValue: 1 }).setEncode(String),
);

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

## Validation and Custom Types

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

Copyright (c) 2025 ViPro <vdustr@gmail.com> (<http://vdustr.dev>)

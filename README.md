# @vp-tw/nanostores-qs

A reactive querystring manager using [nanostores](https://github.com/nanostores/nanostores).

## Features

- 🔄 Reactive query string parameters that stay in sync with the URL
- 🔍 Type-safe parameter definitions with encoding/decoding support
- 🧩 Works with both native URLSearchParams and custom query string libraries (like [`qs`](https://www.npmjs.com/package/qs) or [`query-string`](https://www.npmjs.com/package/query-string))
- 🪝 Easy integration with frameworks via [nanostores](https://github.com/nanostores/nanostores)
- 🔢 Support for arrays, numbers, dates, and custom types
- ✅ Validation using libraries like [zod](https://github.com/colinhacks/zod) or [arktype](https://github.com/arktypeio/arktype)
- 📚 Flexible API for single or multiple parameters

## Installation

```bash
# npm
npm install @vp-tw/nanostores-qs @nanostores/react nanostores

# yarn
yarn add @vp-tw/nanostores-qs @nanostores/react nanostores

# pnpm
pnpm install @vp-tw/nanostores-qs @nanostores/react nanostores
```

## Usage

For React projects:

```ts
import { createQsUtils } from "@vp-tw/nanostores-qs";

const qsUtils = createQsUtils(/* Options */);
```

You can also replace `react` with any other framework supported by Nanostores. See: [nanostores#integration](https://github.com/nanostores/nanostores#integration).

## Basic Usage

```tsx
import { useStore } from "@nanostores/react";
import { createQsUtils } from "@vp-tw/nanostores-qs";

// Create query string utilities
const qsUtils = createQsUtils();

// Create a store for a single parameter
const strStore = qsUtils.createSearchParamStore("str");

// In React component
function Str() {
  const str = useStore(strStore.$value);
  //    ^? string | undefined

  return (
    <input
      value={str ?? ""}
      onChange={(e) => {
        strStore.update(e.target.value);
      }}
    />
  );
}

// Number parameter with custom encoding/decoding
const numStore = qsUtils.createSearchParamStore("num", (def) =>
  def({
    decode: (v) => (!v ? "" : Number(v)),
    defaultValue: "",
  }),
);

function Num() {
  const num = useStore(numStore.$value);
  //    ^? number | ""

  return (
    <input
      type="number"
      value={num}
      onChange={(e) => {
        numStore.update(!e.target.value ? "" : Number(e.target.value));
      }}
    />
  );
}
```

### Update Options

`nanostores-qs` will only update the parameter it manages, leaving other parameters untouched.

```ts
// Push a new history state (default)
numStore.update(42);

// Replace current history state instead
numStore.update(42, { replace: true });

// Keep the hash part of the URL when updating
numStore.update(42, { keepHash: true });

// Pass custom state to history API
numStore.update(42, { state: { foo: "bar" } });
```

### Default Values

When the store value is equal to the default value, the parameter will be removed from the query string. You can customize the `isEqual` function:

```ts
const qsUtils = createQsUtils({
  isEqual: (a, b) => JSON.stringify(a) === JSON.stringify(b),
});
```

By default, it uses `es-toolkit`'s `isEqual` function.

## Advanced Usage

### Multiple Parameters

```tsx
const filtersStore = qsUtils.createSearchParamsStore((def) => ({
  search: def({ defaultValue: "" }),
  category: def({ isArray: true }),
  minPrice: def({
    decode: Number,
  }).setEncode(String),
  maxPrice: def({
    decode: Number,
  }).setEncode(String),
  sortBy: def({
    defaultValue: "newest",
  }),
}));

// In React component
function Filters() {
  const filters = useStore(filtersStore.$values);

  const updateFilters = (newFilters) => {
    filtersStore.updateAll(
      {
        ...filters,
        ...newFilters,
      },
      {
        replace: true,
      },
    );
  };

  // Update a single parameter
  const updateMinPrice = (e) => {
    filtersStore.update("minPrice", Number(e.target.value), { replace: true });
  };

  return <div>...</div>;
}
```

### Using Zod for Validation

```tsx
import { z } from "zod";

// Create an enum schema for sort options
const SortOptionSchema = z.enum(["newest", "price_asc", "price_desc"]);
type SortOption = z.infer<typeof SortOptionSchema>;

// Create a store with validation
const sortStore = qsUtils.createSearchParamStore("sort", {
  // Parse and validate the input string
  decode: (value) => SortOptionSchema.parse(value),

  // Falls back to default value if parsing fails
  defaultValue: SortOptionSchema[0],
});

// Usage in component
function SortSelector() {
  const sortOption = useStore(sortStore.$value);
  // sortOption is safely typed as SortOption

  return (
    <select
      value={sortOption}
      onChange={(e) => sortStore.update(e.target.value as SortOption)}
    >
      {SortOptionSchema.options.map((option) => (
        <option key={option} value={option}>
          {option}
        </option>
      ))}
    </select>
  );
}
```

### Custom Query String Library

```ts
import { parse, stringify } from "qs";

const qsUtils = createQsUtils({
  qs: {
    parse: (search) => parse(search, { ignoreQueryPrefix: true }),
    stringify: (values) => stringify(values),
  },
});

// Now you can use the advanced query string parsing capabilities
// of the 'qs' library instead of the built-in URLSearchParams
```

## Maintainance

### Release

```bash
pnpm pub
```

## License

[MIT](./LICENSE)

Copyright (c) 2025 ViPro <vdustr@gmail.com> (<http://vdustr.dev>)

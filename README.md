# @vp-tw/nanostores-qs

A reactive querystring manager using nanostores.

> [!WARNING]
>
> ## WIP
>
> Documentation generated using Copilot Edits.

## Features

- 🔄 Reactive query string parameters that stay in sync with the URL
- 🔍 Type-safe parameter definitions with encoding/decoding support
- 🧩 Works with both native URLSearchParams and custom query string libraries (like `qs`)
- 🪝 Easy integration with frameworks via [nanostores](https://github.com/nanostores/nanostores)
- 🔢 Support for arrays, numbers, dates, and custom types
- ✅ Validation using libraries like Zod
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

```ts
import { createQsUtils } from "@vp-tw/nanostores-qs";

const qsUtils = createQsUtils(/* Options */);
```

## Basic Usage

```tsx
import { useStore } from "@nanostores/react";
import { createQsUtils } from "@vp-tw/nanostores-qs";

// Create query string utilities
const qsUtils = createQsUtils();

// Create a store for a single parameter
const pageStore = qsUtils.createSearchParamStore("page", {
  decode: Number,
  encode: String,
  defaultValue: 1,
});

// In React component
function Pagination() {
  const page = useStore(pageStore.$value);

  return (
    <div>
      Current page: {page}
      <Bottom onClick={() => pageStore.update(page + 1)}>Next</Bottom>
    </div>
  );
}
```

## Advanced Usage

Multiple Parameters

```tsx
const filtersStore = qsUtils.createSearchParamsStore((defineSearchParam) => ({
  search: defineSearchParam({ defaultValue: "" }),
  category: defineSearchParam({ isArray: true }),
  minPrice: defineSearchParam({
    decode: Number,
    encode: String,
  }),
  maxPrice: defineSearchParam({
    decode: Number,
    encode: String,
  }),
  sortBy: defineSearchParam({
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
        replace: true, // Replace current history state instead of adding new entry
      },
    );
  };

  return <div>...</div>;
}
```

Using Zod for Validation

```ts
import { z } from "zod";

const SortOptionSchema = z.enum(["newest", "price_asc", "price_desc"]);

const sortStore = qsUtils.createSearchParamStore("sort", {
  decode: SortOptionSchema.parse,
  defaultValue: "newest",
});
```

Custom Query String Library

```ts
import { parse, stringify } from "qs";

const qsUtils = createQsUtils({
  qs: {
    parse: (search) => parse(search, { ignoreQueryPrefix: true }),
    stringify: (values) => stringify(values),
  },
});
```

## License

[MIT](./LICENSE)

Copyright (c) 2025 ViPro <vdustr@gmail.com> (<http://vdustr.dev>)

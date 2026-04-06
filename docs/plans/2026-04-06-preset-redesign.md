# Preset API Redesign

Redesign flat preset exports (`presetInt`, `presetIntOptional`, `presetIntArray`) into grouped presets with `.optional` / `.array` modifiers, plus a `createPreset` factory for custom presets.

## Usage

All presets accessed via namespace import to avoid name collisions (`string`, `boolean` shadow TS types):

```ts
import * as presets from "@vp-tw/nanostores-qs/presets";

createSearchParamStore("count", presets.integer); // number (default NaN)
createSearchParamStore("count", presets.integer.optional); // number | undefined
createSearchParamStore("count", presets.integer.array); // Array<number>
```

## Core Types

### `Preset<TDescriptor>`

Maps a descriptor object to the config shape consumed by `createSearchParamStore`. The existing `InferValueFromQueryParamConfig` infers value types from `decode` return type + `defaultValue` presence.

```ts
type Preset<
  TDescriptor extends {
    type: unknown;
    defaultValueType?: unknown;
    isArray?: boolean;
  },
> = TDescriptor extends { isArray: true }
  ? {
      isArray: true;
      decode: (value: Array<unknown>) => Array<TDescriptor["type"]>;
    }
  : TDescriptor extends { defaultValueType: infer TDefaultValueType }
    ? undefined extends TDefaultValueType
      ? { decode: (value: unknown) => TDescriptor["type"] }
      : { decode: (value: unknown) => TDescriptor["type"]; defaultValue: TDefaultValueType }
    : { decode: (value: unknown) => TDescriptor["type"] };
```

### `PresetGroup<TType, TDefaultValueType>`

A preset with `.optional` and `.array` modifiers. Returned by `createPreset`.

```ts
type PresetGroup<TType, TDefaultValueType = TType> = Preset<{
  type: TType;
  defaultValueType: TDefaultValueType;
}> & {
  optional: Preset<{ type: TType }>;
  array: Preset<{ type: TType; isArray: true }>;
};
```

## `createPreset<TType, TDefaultValueType>` Factory

Creates a `PresetGroup` from a decode/defaultValue/encode config. The `decode` function should **throw on invalid input** -- the library's existing try-catch mechanism handles fallback:

- **base**: `decode` throw -> library catch -> `defaultValue`
- **optional**: `decode` throw -> library catch -> `undefined` (no `defaultValue`)
- **array**: per-item `decode` throw -> filter out invalid items

```ts
function createPreset<TType, TDefaultValueType = TType>(config: {
  decode: (value: unknown) => TType;
  defaultValue: TDefaultValueType;
  encode?: (value: TType) => string | undefined;
}): PresetGroup<TType, TDefaultValueType>;
```

Generated variants:

- **base**: `{ decode, defaultValue, encode }`
- **optional**: `{ decode, encode }` -- no `defaultValue`
- **array**: `{ isArray: true, decode: wrapDecode, encode: wrapEncode }`
  - `wrapDecode`: `(values) => values.flatMap(v => { try { return [decode(v)] } catch { return [] } })`
  - `wrapEncode`: `(values) => values.flatMap(v => { try { return [encode(v)] } catch { return [] } })`

Default `encode` when not provided: `(v) => String(v)`.

## Built-in Presets

### `presets.string` -- `PresetGroup<string>`

| Variant                   | Default     | Type                  |
| ------------------------- | ----------- | --------------------- |
| `presets.string`          | `""`        | `string`              |
| `presets.string.optional` | `undefined` | `string \| undefined` |
| `presets.string.array`    | `[]`        | `Array<string>`       |

### `presets.boolean` -- `PresetGroup<boolean>`

| Variant                    | Default     | Type                   |
| -------------------------- | ----------- | ---------------------- |
| `presets.boolean`          | `false`     | `boolean`              |
| `presets.boolean.optional` | `undefined` | `boolean \| undefined` |
| `presets.boolean.array`    | `[]`        | `Array<boolean>`       |

Decode: `"true"` -> `true`, anything else -> `false`.
Encode: `true` -> `"true"`, `false` -> `undefined` (omit from URL).
Optional decode: `"true"` -> `true`, `"false"` -> `false`, anything else -> throw.

### `presets.integer` -- `PresetGroup<number>` + rounding variants

Default rounding mode is `round`. All variants have `.optional` and `.array`.

| Variant                 | Decode                                                  | Default |
| ----------------------- | ------------------------------------------------------- | ------- |
| `presets.integer`       | `parseFloat` + `Math.round`                             | `NaN`   |
| `presets.integer.parse` | `parseInt(v, 10)`                                       | `NaN`   |
| `presets.integer.ceil`  | `parseFloat` + `Math.ceil`                              | `NaN`   |
| `presets.integer.floor` | `parseFloat` + `Math.floor`                             | `NaN`   |
| `presets.integer.round` | `parseFloat` + `Math.round` (same as `presets.integer`) | `NaN`   |

Each rounding variant is a `PresetGroup<number>`:

```ts
presets.integer.ceil.optional; // number | undefined
presets.integer.parse.array; // Array<number>
```

Order is fixed: **rounding mode -> optional/array**. `integer.optional.ceil` is not supported.

### `presets.float` -- `PresetGroup<number>` + `fixed(n)` variant

| Variant                  | Decode                                | Default |
| ------------------------ | ------------------------------------- | ------- |
| `presets.float`          | `parseFloat`                          | `NaN`   |
| `presets.float.fixed(n)` | `parseFloat` + `Number(v.toFixed(n))` | `NaN`   |

`float.fixed(n)` returns a `PresetGroup<number>`. Encode uses `v.toFixed(n)`.

```ts
presets.float.fixed(2).optional; // number | undefined
presets.float.fixed(2).array; // Array<number>
```

### `presets.date` -- `PresetGroup<Date>`

| Variant                 | Default         | Type                |
| ----------------------- | --------------- | ------------------- |
| `presets.date`          | `new Date(NaN)` | `Date`              |
| `presets.date.optional` | `undefined`     | `Date \| undefined` |
| `presets.date.array`    | `[]`            | `Array<Date>`       |

Decode: `new Date(String(value))`, throw if `getTime()` is `NaN`.
Encode: `value.toISOString()`.

### `presets.ymd` -- `PresetGroup<string>`

| Variant                | Default        | Type                  |
| ---------------------- | -------------- | --------------------- |
| `presets.ymd`          | `"0000-00-00"` | `string`              |
| `presets.ymd.optional` | `undefined`    | `string \| undefined` |
| `presets.ymd.array`    | `[]`           | `Array<string>`       |

Format: `YYYY-MM-DD`. Decode validates format, throws on invalid.

### `presets.hms` -- `PresetGroup<string>`

| Variant                | Default      | Type                  |
| ---------------------- | ------------ | --------------------- |
| `presets.hms`          | `"00:00:00"` | `string`              |
| `presets.hms.optional` | `undefined`  | `string \| undefined` |
| `presets.hms.array`    | `[]`         | `Array<string>`       |

Format: `HH:mm:ss`. Decode validates format, throws on invalid.

### `presets.enum(enumArray)` -- factory returning `PresetGroup`

```ts
presets.enum(["asc", "desc"]); // "asc" | "desc" (default "asc")
presets.enum(["asc", "desc"]).optional; // "asc" | "desc" | undefined
presets.enum(["asc", "desc"]).array; // Array<"asc" | "desc">
```

Signature:

```ts
presets.enum: <const TEnumArray extends ReadonlyArray<string>>(
  enumArray: TEnumArray
) => PresetGroup<TEnumArray[number], TEnumArray[0]>
```

Decode: throw if value not in `enumArray`. Array variant filters out non-enum values.

### `presets.tuple(configs)` -- composite preset

Combines multiple preset configs into a single comma-separated query parameter. No `.optional` or `.array` modifiers.

```ts
presets.tuple([presets.string, presets.integer]);
// type: [string, number], default: ["", NaN]
// URL: ?param=hello,42

presets.tuple([presets.string.optional, presets.integer.optional]);
// type: [string | undefined, number | undefined], default: [undefined, undefined]
```

Signature:

```ts
presets.tuple: <const TConfigs extends ReadonlyArray<Preset<any>>>(
  configs: TConfigs,
  options?: { separator?: string }
) => Preset<{
  type: InferTupleType<TConfigs>;
  defaultValueType: InferTupleDefaults<TConfigs>;
}>
```

Tuple type helpers:

```ts
type InferTupleType<TConfigs extends ReadonlyArray<unknown>> = {
  [K in keyof TConfigs]: InferValueFromItemQueryParamConfig<TConfigs[K]>;
};

type InferTupleDefaults<TConfigs extends ReadonlyArray<unknown>> = {
  [K in keyof TConfigs]: TConfigs[K] extends { defaultValue: infer TDefaultValue }
    ? TDefaultValue
    : undefined;
};
```

Default separator: `","`. Customizable via options.

Decode: split string by separator, decode each element with its config's decode. If any element's decode throws, the entire tuple falls back to its combined `defaultValue`.

Encode: encode each element, join with separator.

## Export Structure

`createPreset` is exported from the presets entry point:

```ts
import { createPreset } from "@vp-tw/nanostores-qs/presets";
import * as presets from "@vp-tw/nanostores-qs/presets";
```

## Documentation Strategy

Presets are the **primary usage pattern** in all docs and demos. Plain config and `createPreset` are documented as **advanced usage**.

### Primary (presets):

```ts
import * as presets from "@vp-tw/nanostores-qs/presets";

const count = qsUtils.createSearchParamStore("count", presets.integer);
const sort = qsUtils.createSearchParamStore("sort", presets.enum(["asc", "desc"]));
```

### Advanced (custom preset with `createPreset`):

```ts
import { createPreset } from "@vp-tw/nanostores-qs/presets";
import { Decimal } from "decimal.js";

const decimal = createPreset<Decimal>({
  decode: (v) => new Decimal(String(v)),
  defaultValue: new Decimal(0),
  encode: (v) => v.toString(),
});
```

### Advanced (plain config / zod integration):

```ts
const tab = qsUtils.createSearchParamStore("tab", {
  decode: TabSchema.parse,
  defaultValue: TabSchema.options[0],
});
```

## Verification Plan

1. Rewrite `presets.ts` with new grouped API
2. Rewrite `presets.test.ts` — all preset variants with decode/encode/error cases
3. Rewrite `presets.test-d.ts` — type-level tests for all inferred types
4. Run full CI: lint, typecheck, tests
5. Update README and Astro docs to use preset-first examples
6. Update demo to showcase presets as primary usage

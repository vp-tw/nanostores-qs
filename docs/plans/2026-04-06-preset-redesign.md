# Preset API Redesign (v2)

Redesign presets as function calls with options. All configuration (optional, default, array, constraints) via a single options object. No property chaining.

## Usage

```ts
import * as presets from "@vp-tw/nanostores-qs/presets";

createSearchParamStore("page", presets.integer({ default: 1, min: 1 }));
createSearchParamStore("q", presets.string({ optional: true }));
createSearchParamStore("sort", presets.enum(["asc", "desc"]));
createSearchParamStore("tags", presets.enum(["a", "b", "c"], { array: true }));
```

## Options Design

### Mutual Exclusivity

`optional`, `default`, `numInput`, and `array` are mutually exclusive. Enforced via `never` overrides in TypeScript.

- No modifier — uses preset's inherent default (e.g., `NaN` for integer)
- `optional: true` — value can be `undefined`, no `defaultValue` in config
- `default: T` — custom default value
- `numInput: true` — for `<input type="number">` binding (integer/float only, requires `default`)
- `array: true` — `Array<T>`, default `[]`

### `outOfRange`

Controls constraint violation behavior. Available on presets with constraints (integer, float, string):

- `"clamp"` (default) — silently correct (clamp numbers, truncate strings, slice arrays)
- `"reject"` — throw → falls back to `defaultValue` (or `undefined` for optional)

### Nil Handling

`main.ts` spreads `defaultItemConfig` (which includes `defaultValue: undefined`) onto all configs. This means `"defaultValue" in config` is always `true` after the spread, and the nil short-circuit in the decode path never triggers.

**Solution:** Preset functions wrap decode with nil checks:

- Base decode: nil → return `defaultValue`
- Optional decode: nil → return `undefined`
- Default decode: nil → return custom default
- Array: handled by per-item try-catch

`isNil` from `es-toolkit` (shared with `main.ts`).

## Config Shape

### Base Config (existing)

```ts
{
  decode: (value: unknown) => TParsed;
  defaultValue?: TParsed;
  encode?: (value: TParsed) => string | undefined;
  isArray?: boolean;
}
```

### Extended Config with `resolve` (new)

```ts
{
  decode: (value: unknown) => TParsed;
  resolve?: (value: TParsed) => TResolved;  // NEW — maps parsed → resolved
  defaultValue?: TParsed;
  encode?: (value: TParsed) => string | undefined;
  isArray?: boolean;
}
```

When `resolve` is present in config, `createSearchParamStore` provides `$resolved`:

```ts
const store = qsUtils.createSearchParamStore("page", config);
store.$value; // ReadableAtom<TParsed>
store.$resolved; // ReadableAtom<TResolved>   — computed(store.$value, config.resolve)
store.update; // accepts TParsed
```

When `resolve` is absent: `$resolved === $value` (same reference, zero overhead).

This is a core library change in `main.ts`.

## Store API

### Single param store

```ts
const store = qsUtils.createSearchParamStore("key", config);

store.$value      // ReadableAtom<TParsed>     — raw decoded value
store.$resolved   // ReadableAtom<TResolved>   — resolve(parsed), or same as $value
store.update(value: TParsed)                   — push new value
store.update.dry(value: TParsed): string       — preview URL without changing
```

### Multi param store

```ts
const store = qsUtils.createSearchParamsStore({ ... });

store.$values     // ReadableAtom<{ [K]: TParsed }>
store.$resolved   // ReadableAtom<{ [K]: TResolved }>   — per-key resolve
store.update(key, value)
store.updateAll(values)
```

## Built-in Presets

### `presets.integer(options?)`

```ts
presets.integer(); // number, default NaN
presets.integer({ default: 1 }); // number, default 1
presets.integer({ optional: true }); // number | undefined
presets.integer({ array: true }); // Array<number>
presets.integer({ min: 0, max: 100 }); // clamped
presets.integer({ min: 0, max: 100, outOfRange: "reject" }); // throws on out-of-range
presets.integer({ round: "ceil" }); // Math.ceil
presets.integer({ round: "floor", min: 0, default: 0 }); // combined
presets.integer({ array: true, maxItems: 5, min: 0 }); // array + constraints
presets.integer({ numInput: true, default: 1, min: 1 }); // for <input type="number">
```

| Option       | Type                                      | Default                   |
| ------------ | ----------------------------------------- | ------------------------- |
| `round`      | `"round" \| "ceil" \| "floor" \| "parse"` | `"round"`                 |
| `min`        | `number`                                  | `Number.MIN_SAFE_INTEGER` |
| `max`        | `number`                                  | `Number.MAX_SAFE_INTEGER` |
| `outOfRange` | `"clamp" \| "reject"`                     | `"clamp"`                 |
| `numInput`   | `boolean`                                 | `false`                   |

- `"round"` / `"ceil"` / `"floor"`: `parseFloat` + `Math` method
- `"parse"`: `parseInt(value, 10)` (truncates toward zero, e.g., `"3.9"` → `3`)
- Decode: parse → round → clamp/reject to `[min, max]`
- Encode: `NaN`/nil → `undefined` (omit), else `String(value)`

#### `numInput: true`

For binding to `<input type="number">`. Requires `default`.

```ts
presets.integer({ numInput: true, default: 1, min: 1 });
// $value:    `${number}` | ""    — bindable to input.value
// $resolved: number              — business logic value
```

- Decode: valid number string → `` `${number}` ``, nil → `""`
- Resolve: `` `${number}` `` → number, `""` → default
- Encode: `""` → `undefined` (omit), `` `${number}` `` → pass through

### `presets.float(options?)`

```ts
presets.float(); // number, default NaN
presets.float({ fixed: 2 }); // 2 decimal places
presets.float({ fixed: 2, min: 0, max: 1 }); // clamped
presets.float({ optional: true }); // number | undefined
presets.float({ numInput: true, default: 0, fixed: 2 }); // for <input type="number">
```

| Option       | Type                  | Default                   |
| ------------ | --------------------- | ------------------------- |
| `fixed`      | `number`              | (none — full precision)   |
| `min`        | `number`              | `Number.MIN_SAFE_INTEGER` |
| `max`        | `number`              | `Number.MAX_SAFE_INTEGER` |
| `outOfRange` | `"clamp" \| "reject"` | `"clamp"`                 |
| `numInput`   | `boolean`             | `false`                   |

- Decode: `parseFloat` → `fixed` ? `Number(v.toFixed(n))` (rounding, not just formatting) → clamp/reject
- Encode: `NaN`/nil → `undefined`, else `fixed` ? `toFixed(n)` : `String(value)`

`numInput`: same pattern as integer — `$value` is `` `${number}` | "" ``, `$resolved` is `number`.

### `presets.string(options?)`

```ts
presets.string(); // string, default ""
presets.string({ maxLength: 10 }); // truncated
presets.string({ maxLength: 10, outOfRange: "reject" }); // throws → default ""
presets.string({ optional: true }); // string | undefined
```

| Option       | Type                  | Default   |
| ------------ | --------------------- | --------- |
| `maxLength`  | `number`              | (none)    |
| `outOfRange` | `"clamp" \| "reject"` | `"clamp"` |

- Decode: `String(value)` → truncate/reject if `maxLength` exceeded
- `"clamp"`: `value.slice(0, maxLength)`
- `"reject"`: throw → `defaultValue` (or `undefined` for optional)

### `presets.boolean(options?)`

```ts
presets.boolean(); // boolean, default false
presets.boolean({ default: true }); // default true
presets.boolean({ optional: true }); // boolean | undefined
```

No constraint options.

Decode:

- Base/Default: `"true"` → `true`, `"false"` → `false`, nil → `defaultValue`, else → throw
- Optional: `"true"` → `true`, `"false"` → `false`, nil → `undefined`, else → throw

Encode is **conditional on defaultValue** to ensure the non-default value appears in URL:

- `defaultValue === false` (default): `true` → `"true"`, `false` → `undefined` (omit)
- `defaultValue === true`: `false` → `"false"`, `true` → `undefined` (omit)
- Optional: `true` → `"true"`, `false` → `"false"`, `undefined` → `undefined`

### `presets.date(options?)`

```ts
presets.date(); // Date, default Invalid Date
presets.date({ optional: true }); // Date | undefined
presets.date({ array: true }); // Array<Date>
```

No constraint options. Decode: `new Date(String(value))`, throw if `getTime()` is `NaN`.

Encode: Invalid Date/nil → `undefined` (omit), else `toISOString()`.

### `presets.ymd(options?)`

```ts
presets.ymd(); // string, default "0000-00-00"
presets.ymd({ optional: true }); // string | undefined
presets.ymd({ default: "2024-01-01" });
```

Format: `YYYY-MM-DD`. Syntactic validation only (`/^\d{4}-\d{2}-\d{2}$/`). Throws on invalid format.

### `presets.hms(options?)`

```ts
presets.hms(); // string, default "00:00:00"
presets.hms({ optional: true }); // string | undefined
presets.hms({ default: "08:00:00" });
```

Format: `HH:mm:ss`. Validates hour 00-23, minute/second 00-59 (`/^(?:[01]\d|2[0-3]):[0-5]\d:[0-5]\d$/`). Throws on invalid format.

### `presets.enum(enumArray, options?)`

```ts
presets.enum(["asc", "desc"]); // "asc" | "desc", default "asc"
presets.enum(["asc", "desc"], { optional: true }); // "asc" | "desc" | undefined
presets.enum(["asc", "desc"], { array: true }); // Array<"asc" | "desc">
presets.enum(["asc", "desc"], { default: "desc" }); // default "desc"
```

`default` option type is constrained to `TEnumArray[number]`.

Decode: throw if value not in array. Encode: `String(value)`.

### `presets.tuple(configs)`

```ts
presets.tuple([presets.string(), presets.integer()]);
// isArray: true
// type: [string, number], default: ["", NaN]
// URL: ?param=hello&param=42
```

- `isArray: true` — qs library parses to array, tuple decodes positionally
- No options parameter (no optional/array/default/numInput)
- Decode: map each element with its preset's decode. Any throw → entire tuple fails to combined `defaultValue`
- Encode: map each element with its preset's encode, return `Array<string>`

### Array Variants

When `array: true`, the config returned has `isArray: true`:

- Decode: per-item decode with try-catch, invalid items filtered out
- Encode: per-item encode, nil results filtered out, returns `Array<string>`
- `maxItems` with `"clamp"`: `array.slice(0, maxItems)` after decode
- `maxItems` with `"reject"`: throw if array length exceeds → fallback to `[]`

## Type System

### Options Type (per preset, with `never` exclusivity)

```ts
type IntegerOptions =
  | (IntegerBaseOptions & { optional?: never; default?: never; array?: never; numInput?: never })
  | (IntegerBaseOptions & { optional: true; default?: never; array?: never; numInput?: never })
  | (IntegerBaseOptions & { default: number; optional?: never; array?: never; numInput?: never })
  | (IntegerBaseOptions & {
      array: true;
      maxItems?: number;
      optional?: never;
      default?: never;
      numInput?: never;
    })
  | (IntegerBaseOptions & { numInput: true; default: number; optional?: never; array?: never });

interface IntegerBaseOptions {
  round?: "round" | "ceil" | "floor" | "parse";
  min?: number;
  max?: number;
  outOfRange?: "clamp" | "reject";
}
```

### Return Type (conditional on options)

```ts
// No modifier     → { decode, defaultValue, encode }
// optional: true  → { decode, encode }  (no defaultValue)
// default: T      → { decode, defaultValue, encode }
// numInput: true  → { decode, resolve, defaultValue, encode }
// array: true     → { isArray: true, decode, encode }
```

Inferred via conditional types so `InferValueFromQueryParamConfig` works correctly.

For `numInput`, the decode return type is `` `${number}` | "" `` and resolve return type is `number`.

### Tuple Type Inference

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

## `createPreset` Factory

```ts
import { createPreset } from "@vp-tw/nanostores-qs/presets";

const percentage = createPreset({
  decode: (value: unknown) => {
    const n = Number(value);
    if (Number.isNaN(n) || n < 0 || n > 100) throw new Error("invalid");
    return n;
  },
  defaultValue: 0,
  encode: (v) => String(v),
});

// Returns a function accepting shared options (optional, default, array, maxItems):
createSearchParamStore("progress", percentage());
createSearchParamStore("progress", percentage({ default: 50 }));
createSearchParamStore("progress", percentage({ optional: true }));
createSearchParamStore("progress", percentage({ array: true }));
```

`createPreset` returns a function that accepts shared options (`optional`, `default`, `array`, `maxItems`). Custom constraint options (like min/max for percentage) are baked into the decode — `outOfRange` is not passed through. `numInput` is not available for custom presets.

## Edge Case Demo

Interactive table showing all preset behaviors. Each row:

- Preset config (fixed)
- Text input for qs value + present/absent toggle
- `$value` column — displayed with `objectInspect` (distinguishes `0` vs `'0'` vs `undefined`)
- `$resolved` column — displayed with `objectInspect`

Preset rows cover:

| Preset Config                               | Key edge cases                              |
| ------------------------------------------- | ------------------------------------------- |
| `integer()`                                 | `"42"`, `"3.7"`, `"abc"`, `""`, absent      |
| `integer({ default: 1, min: 1 })`           | `"0"` (clamped to 1), `"-5"`, absent        |
| `integer({ round: "ceil" })`                | `"3.2"` → 4                                 |
| `integer({ round: "parse" })`               | `"3.9"` → 3 (truncation)                    |
| `integer({ optional: true })`               | absent → `undefined`                        |
| `integer({ numInput: true, default: 1 })`   | absent → `$value: ""`, `$resolved: 1`       |
| `integer({ outOfRange: "reject", min: 0 })` | `"-5"` → NaN                                |
| `float({ fixed: 2 })`                       | `"3.14159"` → 3.14                          |
| `string()`                                  | absent → `""` (not `"undefined"`)           |
| `string({ maxLength: 5 })`                  | `"hello world"` → `"hello"`                 |
| `boolean()`                                 | `"true"`, `"false"`, `"1"`, absent          |
| `boolean({ default: true })`                | absent → `true`, encode `false` → `"false"` |
| `date()`                                    | ISO string, `"invalid"`                     |
| `ymd()`                                     | `"2024-01-15"`, `"2024/01/15"` (invalid)    |
| `hms()`                                     | `"14:30:00"`, `"25:00:00"` (invalid)        |
| `enum(["a","b"])`                           | `"a"`, `"c"` (invalid)                      |

## Documentation Strategy

Presets are the **primary usage pattern**. `createPreset` and plain config are **advanced usage**.

### Primary (presets):

```ts
import * as presets from "@vp-tw/nanostores-qs/presets";

const page = qsUtils.createSearchParamStore("page", presets.integer({ default: 1, min: 1 }));
const sort = qsUtils.createSearchParamStore("sort", presets.enum(["asc", "desc"]));
```

### Advanced (createPreset / decimal.js):

```ts
import { createPreset } from "@vp-tw/nanostores-qs/presets";
import { Decimal } from "decimal.js";

const decimal = createPreset<Decimal>({
  decode: (v) => {
    const d = new Decimal(String(v));
    if (!d.isFinite()) throw new Error("invalid");
    return d;
  },
  defaultValue: new Decimal(0),
  encode: (v) => v.toString(),
});
```

### Advanced (plain config / zod v4):

```ts
import { z } from "zod";

const tabSchema = z.enum(["home", "settings", "profile"]);
const tab = qsUtils.createSearchParamStore("tab", {
  decode: (v) => tabSchema.parse(String(v)),
  defaultValue: "home" satisfies z.infer<typeof tabSchema>,
});
```

## Implementation Plan

1. **main.ts**: Add `resolve` config support + `$resolved` store on both `createSearchParamStore` and `createSearchParamsStore`
2. **presets.ts**: Add `numInput` option to integer/float
3. **Tests**: Add tests for `resolve`, `$resolved`, `numInput`
4. **Edge case demo**: Interactive table component
5. **Docs**: Update all docs, document edge cases clearly
6. **Browser test**: Verify with agent-browser

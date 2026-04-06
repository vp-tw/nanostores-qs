# Preset API Redesign (v2)

Redesign presets as function calls with options. All configuration (optional, default, array, constraints) via a single options object. No property chaining. Zero external dependencies — presets module uses its own utilities.

## Usage

```ts
import * as presets from "@vp-tw/nanostores-qs/presets";

createSearchParamStore("page", presets.integer({ default: 1 }));
createSearchParamStore("q", presets.string({ optional: true }));
createSearchParamStore("sort", presets.enum(["asc", "desc"]));
createSearchParamStore("tags", presets.enum(["a", "b", "c"], { array: true }));
```

## Options Design

### Mutual Exclusivity

`optional`, `default`, and `array` are mutually exclusive. Enforced via `never` overrides:

```ts
type IntegerOptions =
  | (IntegerBaseOptions & { optional?: never; default?: never; array?: never })
  | (IntegerBaseOptions & { optional: true; default?: never; array?: never })
  | (IntegerBaseOptions & { default: number; optional?: never; array?: never })
  | (IntegerBaseOptions & { array: true; maxItems?: number; optional?: never; default?: never });
```

- No modifier — uses preset's inherent default (e.g., `NaN` for integer)
- `optional: true` — value can be `undefined`, no `defaultValue` in config
- `default: T` — custom default value
- `array: true` — `Array<T>`, default `[]`

### `outOfRange`

Controls constraint violation behavior. Available on presets with constraints (integer, float, string):

- `"clamp"` (default) — silently correct (clamp numbers, truncate strings, slice arrays)
- `"reject"` — throw → falls back to `defaultValue` (or `undefined` for optional)

### Nil Handling in Optional

`main.ts` spreads `defaultItemConfig` (which includes `defaultValue: undefined`) onto all configs. This means `"defaultValue" in config` is always `true` after the spread, and the nil short-circuit in the decode path never triggers.

**Solution:** Preset functions wrap optional decode and encode with nil checks:

- Optional decode: if value is nil, return `undefined` without calling the user decode
- Optional encode: if value is nil, return `undefined` without calling the user encode

This is handled by internal `isNil` utility (no external dependency):

```ts
function isNil(value: unknown): value is null | undefined {
  return value === null || value === undefined;
}
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
```

| Option       | Type                                      | Default                   |
| ------------ | ----------------------------------------- | ------------------------- |
| `round`      | `"round" \| "ceil" \| "floor" \| "parse"` | `"round"`                 |
| `min`        | `number`                                  | `Number.MIN_SAFE_INTEGER` |
| `max`        | `number`                                  | `Number.MAX_SAFE_INTEGER` |
| `outOfRange` | `"clamp" \| "reject"`                     | `"clamp"`                 |

- `"round"` / `"ceil"` / `"floor"`: `parseFloat` + `Math` method
- `"parse"`: `parseInt(value, 10)` (truncates toward zero, e.g., `"3.9"` → `3`)
- Decode: parse → round → clamp/reject to `[min, max]`
- Encode: `NaN`/nil → `undefined` (omit), else `String(value)`

### `presets.float(options?)`

```ts
presets.float(); // number, default NaN
presets.float({ fixed: 2 }); // 2 decimal places
presets.float({ fixed: 2, min: 0, max: 1 }); // clamped
presets.float({ optional: true }); // number | undefined
```

| Option       | Type                  | Default                   |
| ------------ | --------------------- | ------------------------- |
| `fixed`      | `number`              | (none — full precision)   |
| `min`        | `number`              | `Number.MIN_SAFE_INTEGER` |
| `max`        | `number`              | `Number.MAX_SAFE_INTEGER` |
| `outOfRange` | `"clamp" \| "reject"` | `"clamp"`                 |

- Decode: `parseFloat` → `fixed` ? `Number(v.toFixed(n))` (rounding, not just formatting) → clamp/reject
- Encode: `NaN`/nil → `undefined`, else `fixed` ? `toFixed(n)` : `String(value)`

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

- Base: `"true"` → `true`, else → `false`
- Optional: `"true"` → `true`, `"false"` → `false`, else → throw

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
function tuple<const TConfigs extends ReadonlyArray<PresetConfig>>(
  configs: TConfigs,
): {
  isArray: true;
  decode: (value: Array<unknown>) => InferTupleType<TConfigs>;
  defaultValue: InferTupleDefaults<TConfigs>;
  encode: (value: InferTupleType<TConfigs>) => Array<string>;
};
```

```ts
presets.tuple([presets.string(), presets.integer()]);
// isArray: true
// type: [string, number], default: ["", NaN]
// URL: ?param=hello&param=42
```

- `isArray: true` — qs library parses to array, tuple decodes positionally
- No options parameter (no optional/array/default)
- Decode: map each element with its preset's decode. Any throw → entire tuple fails to combined `defaultValue`
- Encode: map each element with its preset's encode, return `Array<string>`

Array encode per element: call element's `encode`, filter nil results.

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
  | (IntegerBaseOptions & { optional?: never; default?: never; array?: never })
  | (IntegerBaseOptions & { optional: true; default?: never; array?: never })
  | (IntegerBaseOptions & { default: number; optional?: never; array?: never })
  | (IntegerBaseOptions & { array: true; maxItems?: number; optional?: never; default?: never });

interface IntegerBaseOptions {
  round?: "round" | "ceil" | "floor" | "parse";
  min?: number;
  max?: number;
  outOfRange?: "clamp" | "reject";
}
```

### Return Type (conditional on options)

```ts
// No modifier → { decode, defaultValue, encode }
// optional: true → { decode, encode }  (no defaultValue)
// default: T → { decode, defaultValue, encode }
// array: true → { isArray: true, decode, encode }
```

Inferred via conditional types so `InferValueFromQueryParamConfig` works correctly.

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

`createPreset` returns a function that accepts shared options (`optional`, `default`, `array`, `maxItems`). Custom constraint options (like min/max for percentage) are baked into the decode — `outOfRange` is not passed through.

## Documentation Strategy

Presets are the **primary usage pattern**. `createPreset` and plain config are **advanced usage**.

### Primary (presets):

```ts
import * as presets from "@vp-tw/nanostores-qs/presets";

const page = qsUtils.createSearchParamStore("page", presets.integer({ default: 1 }));
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

## Verification Plan

1. Rewrite `presets.ts` — function-based API, zero external dependencies
2. Rewrite `presets.test.ts` — all presets, all option combinations, constraints, edge cases
3. Rewrite `presets.test-d.ts` — type inference for all option variants
4. Run full CI: lint, typecheck, tests
5. Update docs and demos
6. Browser test with agent-browser

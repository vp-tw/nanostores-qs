---
"@vp-tw/nanostores-qs": major
---

Redesign preset API from property-based to function-based with options.

**Breaking changes:**

- All presets are now functions called with `()`: `presets.integer()`, not `presets.integer`
- Options (`optional`, `default`, `array`, `numInput`) passed as object: `presets.integer({ default: 1, min: 1 })`
- Removed `defineSearchParam` export and `def()` callback pattern — use `createPreset` from `./presets` instead
- Removed `.setEncode()` chaining — pass `encode` directly in config
- Boolean base decode is now strict (invalid values throw → fallback to `defaultValue`)

**New features:**

- `min`/`max` constraints on integer/float (default: safe integers), with `outOfRange: "clamp" | "reject"`
- `round` option for integer: `"round"` | `"ceil"` | `"floor"` | `"parse"`
- `fixed` option for float: decimal precision
- `maxLength` for string, `maxItems` for array
- `numInput` option for integer/float: `$value` is string (input-bindable), `$resolved` is number
- `resolve` config field: maps `$value` → `$resolved` for custom type transforms
- `$resolved` store on all `createSearchParamStore` / `createSearchParamsStore` results
- `StoreConfig<{ value, defaultValue?, resolved? }>` consumer-facing type
- `boolean({ default: true })` encode correctly flips (false appears in URL)
- `outOfRange: "reject"` applies consistently in both decode and encode paths
- Shared history patch for multi-instance support

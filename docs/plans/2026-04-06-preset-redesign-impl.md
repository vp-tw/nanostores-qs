# Preset API Redesign — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Rewrite flat presets (`presetInt`, `presetIntOptional`, `presetIntArray`) into grouped presets with `.optional` / `.array` modifiers, powered by a `createPreset` factory.

**Architecture:** `createPreset<TType, TDefaultValueType>` generates `PresetGroup` objects (base + `.optional` + `.array`). Built-in presets (`string`, `boolean`, `integer`, `float`, `date`, `ymd`, `hms`, `enum`, `tuple`) are composed from `createPreset`. `integer` has rounding variants (`.parse`, `.ceil`, `.floor`, `.round`). `float` has `.fixed(n)`. All accessed via `import * as presets`.

**Tech Stack:** TypeScript (tsgo), vitest, es-toolkit, nanostores

**Branch:** `feat/presets` (existing — rewrite in place)

**Design doc:** `docs/plans/2026-04-06-preset-redesign.md`

---

### Task 1: createPreset core — types and factory

**Files:**

- Rewrite: `packages/nanostores-qs/src/presets.ts` (delete all existing content, start fresh)
- Test: `packages/nanostores-qs/src/presets.test.ts` (delete all existing content, start fresh)

**Step 1: Write failing test for createPreset**

```ts
// presets.test.ts
import { describe, expect, it } from "vitest";

import { createPreset } from "./presets";

describe("createPreset", () => {
  const preset = createPreset({
    decode: (value: unknown): number => {
      const n = Number(value);
      if (Number.isNaN(n)) throw new Error();
      return n;
    },
    defaultValue: 0,
    encode: (v) => String(v),
  });

  describe("base", () => {
    it("has decode and defaultValue", () => {
      expect(preset.decode("42")).toBe(42);
      expect(preset.defaultValue).toBe(0);
    });

    it("has encode", () => {
      expect(preset.encode(42)).toBe("42");
    });
  });

  describe("optional", () => {
    it("has decode but no defaultValue", () => {
      expect(preset.optional.decode("42")).toBe(42);
      expect("defaultValue" in preset.optional).toBe(false);
    });

    it("has encode", () => {
      expect(preset.optional.encode(42)).toBe("42");
    });
  });

  describe("array", () => {
    it("has isArray true", () => {
      expect(preset.array.isArray).toBe(true);
    });

    it("decodes valid items", () => {
      expect(preset.array.decode(["1", "2", "3"])).toEqual([1, 2, 3]);
    });

    it("filters invalid items", () => {
      expect(preset.array.decode(["1", "abc", "3"])).toEqual([1, 3]);
    });

    it("has encode", () => {
      expect(preset.array.encode([1, 2])).toEqual(["1", "2"]);
    });
  });

  describe("default encode", () => {
    const noEncode = createPreset({
      decode: (v: unknown) => String(v),
      defaultValue: "",
    });

    it("falls back to String()", () => {
      expect(noEncode.encode(42 as any)).toBe("42");
    });
  });
});
```

**Step 2: Run test to verify it fails**

Run: `pnpm test -- --run packages/nanostores-qs/src/presets.test.ts`
Expected: FAIL — `createPreset` not exported

**Step 3: Write createPreset implementation**

```ts
// presets.ts — start with just createPreset
import { isNil } from "es-toolkit";

function createPreset<TType, TDefaultValueType = TType>(config: {
  decode: (value: unknown) => TType;
  defaultValue: TDefaultValueType;
  encode?: (value: TType) => string | undefined;
}): CreatePresetResult<TType, TDefaultValueType> {
  const encode = config.encode ?? ((v: TType) => String(v));

  const base = {
    decode: config.decode,
    defaultValue: config.defaultValue,
    encode,
  };

  const optional = {
    decode: config.decode,
    encode,
  };

  const array = {
    isArray: true as const,
    decode: (values: Array<unknown>): Array<TType> => {
      return values.flatMap((v) => {
        try {
          return [config.decode(v)];
        } catch {
          return [];
        }
      });
    },
    encode: (values: Array<TType>): Array<string> => {
      return values.flatMap((v) => {
        if (isNil(v)) return [];
        try {
          const encoded = encode(v);
          return isNil(encoded) ? [] : [encoded];
        } catch {
          return [];
        }
      });
    },
  };

  return Object.assign(base, { optional, array }) as CreatePresetResult<TType, TDefaultValueType>;
}

// Internal result type — exact object shapes for InferValueFromQueryParamConfig to work
type CreatePresetResult<TType, TDefaultValueType> = {
  decode: (value: unknown) => TType;
  defaultValue: TDefaultValueType;
  encode: (value: TType) => string | undefined;
  optional: {
    decode: (value: unknown) => TType;
    encode: (value: TType) => string | undefined;
  };
  array: {
    isArray: true;
    decode: (value: Array<unknown>) => Array<TType>;
    encode: (value: Array<TType>) => Array<string>;
  };
};

export { createPreset };
export type { CreatePresetResult };
```

**Step 4: Run test to verify it passes**

Run: `pnpm test -- --run packages/nanostores-qs/src/presets.test.ts`
Expected: PASS

**Step 5: Commit**

```
feat(presets): add createPreset factory
```

---

### Task 2: Type-level tests for createPreset

**Files:**

- Rewrite: `packages/nanostores-qs/src/presets.test-d.ts` (delete all existing content)

**Step 1: Write type-level tests**

```ts
// presets.test-d.ts
import { createQsUtils } from "./main";
import { createPreset } from "./presets";

const anyObj: any = {};
const qs = createQsUtils();

// --- createPreset type inference ---

const numberPreset = createPreset({
  decode: (v: unknown) => {
    const n = Number(v);
    if (Number.isNaN(n)) throw new Error();
    return n;
  },
  defaultValue: 0,
});

// base -> number
(() => {
  const s = qs.createSearchParamStore("n", numberPreset);
  type Result = ReturnType<typeof s.$value.get>;
  type Expected = number;
  anyObj as Result satisfies Expected;
  anyObj as Expected satisfies Result;
})();

// optional -> number | undefined
(() => {
  const s = qs.createSearchParamStore("n", numberPreset.optional);
  type Result = ReturnType<typeof s.$value.get>;
  type Expected = number | undefined;
  anyObj as Result satisfies Expected;
  anyObj as Expected satisfies Result;
})();

// array -> Array<number>
(() => {
  const s = qs.createSearchParamStore("n", numberPreset.array);
  type Result = ReturnType<typeof s.$value.get>;
  type Expected = Array<number>;
  anyObj as Result satisfies Expected;
  anyObj as Expected satisfies Result;
})();
```

**Step 2: Run typecheck to verify it passes**

Run: `pnpm run checkTypes`
Expected: PASS

**Step 3: Commit**

```
test(presets): add type-level tests for createPreset
```

---

### Task 3: Built-in presets — string, boolean

**Files:**

- Modify: `packages/nanostores-qs/src/presets.ts`
- Modify: `packages/nanostores-qs/src/presets.test.ts`

**Step 1: Write failing tests for string and boolean presets**

```ts
// Add to presets.test.ts
import { createPreset, boolean, string } from "./presets";

describe("presets.string", () => {
  it("base: defaultValue empty string", () => {
    expect(string.defaultValue).toBe("");
    expect(string.decode("hello")).toBe("hello");
    expect(string.encode("hello")).toBe("hello");
  });

  it("optional: no defaultValue", () => {
    expect("defaultValue" in string.optional).toBe(false);
    expect(string.optional.decode("hello")).toBe("hello");
  });

  it("array: filters nil", () => {
    expect(string.array.isArray).toBe(true);
    expect(string.array.decode(["a", "b"])).toEqual(["a", "b"]);
  });
});

describe("presets.boolean", () => {
  it("base: decodes truthy/falsy", () => {
    expect(boolean.defaultValue).toBe(false);
    expect(boolean.decode("true")).toBe(true);
    expect(boolean.decode("false")).toBe(false);
    expect(boolean.decode("")).toBe(false);
    expect(boolean.decode("anything")).toBe(false);
  });

  it("base: encodes", () => {
    expect(boolean.encode(true)).toBe("true");
    expect(boolean.encode(false)).toBeUndefined();
  });

  it("optional: strict matching", () => {
    expect(boolean.optional.decode("true")).toBe(true);
    expect(boolean.optional.decode("false")).toBe(false);
    // "anything" should throw -> library catches -> undefined
    expect(() => boolean.optional.decode("anything")).toThrow();
  });

  it("array: filters invalid", () => {
    expect(boolean.array.decode(["true", "invalid", "false"])).toEqual([true, false]);
  });
});
```

**Step 2: Run test to verify it fails**

Run: `pnpm test -- --run packages/nanostores-qs/src/presets.test.ts`
Expected: FAIL

**Step 3: Implement string and boolean**

Note: `string` and `boolean` are JS reserved words but valid as named exports. They work with `import * as presets` namespace access.

```ts
// Add to presets.ts

const string = createPreset({
  decode: (value: unknown): string => String(value),
  defaultValue: "",
});

// boolean needs special handling: base decode is lenient, optional decode is strict.
// createPreset alone can't express this. Build manually and reuse createPreset internals for array.
const booleanBase = createPreset({
  decode: (value: unknown): boolean => {
    if (value === "true") return true;
    if (value === "false") return false;
    throw new Error();
  },
  defaultValue: false,
  encode: (v) => (v ? "true" : undefined),
});

// Override base decode to be lenient (non-throwing)
const boolean: CreatePresetResult<boolean, boolean> = {
  ...booleanBase,
  decode: (value: unknown): boolean => value === "true",
  optional: booleanBase.optional,
  array: booleanBase.array,
};

export { boolean, string };
```

**Step 4: Run test to verify it passes**

Run: `pnpm test -- --run packages/nanostores-qs/src/presets.test.ts`
Expected: PASS

**Step 5: Add type-level tests for string and boolean**

```ts
// Add to presets.test-d.ts
import * as presets from "./presets";

// string -> string
(() => {
  const s = qs.createSearchParamStore("s", presets.string);
  type Result = ReturnType<typeof s.$value.get>;
  anyObj as Result satisfies string;
  anyObj as string satisfies Result;
})();

// string.optional -> string | undefined
(() => {
  const s = qs.createSearchParamStore("s", presets.string.optional);
  type Result = ReturnType<typeof s.$value.get>;
  anyObj as Result satisfies string | undefined;
  anyObj as string | undefined satisfies Result;
})();

// string.array -> Array<string>
(() => {
  const s = qs.createSearchParamStore("s", presets.string.array);
  type Result = ReturnType<typeof s.$value.get>;
  anyObj as Result satisfies Array<string>;
  anyObj as Array<string> satisfies Result;
})();

// boolean -> boolean
(() => {
  const s = qs.createSearchParamStore("b", presets.boolean);
  type Result = ReturnType<typeof s.$value.get>;
  anyObj as Result satisfies boolean;
  anyObj as boolean satisfies Result;
})();

// boolean.optional -> boolean | undefined
(() => {
  const s = qs.createSearchParamStore("b", presets.boolean.optional);
  type Result = ReturnType<typeof s.$value.get>;
  anyObj as Result satisfies boolean | undefined;
  anyObj as boolean | undefined satisfies Result;
})();
```

**Step 6: Run typecheck**

Run: `pnpm run checkTypes`
Expected: PASS

**Step 7: Commit**

```
feat(presets): add string and boolean presets
```

---

### Task 4: Built-in presets — integer (with rounding variants)

**Files:**

- Modify: `packages/nanostores-qs/src/presets.ts`
- Modify: `packages/nanostores-qs/src/presets.test.ts`
- Modify: `packages/nanostores-qs/src/presets.test-d.ts`

**Step 1: Write failing tests**

```ts
describe("presets.integer", () => {
  it("base: rounds by default", () => {
    expect(integer.decode("3.7")).toBe(4);
    expect(integer.decode("3.2")).toBe(3);
    expect(integer.defaultValue).toBeNaN();
  });

  it("base: throws on invalid", () => {
    expect(() => integer.decode("abc")).toThrow();
  });

  it("base: encodes", () => {
    expect(integer.encode(42)).toBe("42");
    expect(integer.encode(Number.NaN)).toBeUndefined();
  });

  it("optional: no defaultValue", () => {
    expect("defaultValue" in integer.optional).toBe(false);
    expect(integer.optional.decode("5")).toBe(5);
  });

  it("array: filters invalid", () => {
    expect(integer.array.decode(["1", "abc", "3.7"])).toEqual([1, 4]);
  });
});

describe("presets.integer.parse", () => {
  it("uses parseInt", () => {
    expect(integer.parse.decode("3.7")).toBe(3);
    expect(integer.parse.decode("10")).toBe(10);
  });

  it("throws on invalid", () => {
    expect(() => integer.parse.decode("abc")).toThrow();
  });

  it("optional/array work", () => {
    expect("defaultValue" in integer.parse.optional).toBe(false);
    expect(integer.parse.array.decode(["1", "abc", "3.7"])).toEqual([1, 3]);
  });
});

describe("presets.integer.ceil", () => {
  it("uses Math.ceil", () => {
    expect(integer.ceil.decode("3.2")).toBe(4);
    expect(integer.ceil.decode("3.7")).toBe(4);
    expect(integer.ceil.decode("-1.5")).toBe(-1);
  });
});

describe("presets.integer.floor", () => {
  it("uses Math.floor", () => {
    expect(integer.floor.decode("3.7")).toBe(3);
    expect(integer.floor.decode("-1.5")).toBe(-2);
  });
});

describe("presets.integer.round", () => {
  it("same behavior as integer base", () => {
    expect(integer.round.decode("3.7")).toBe(4);
    expect(integer.round.decode("3.2")).toBe(3);
  });
});
```

**Step 2: Run test to verify it fails**

Run: `pnpm test -- --run packages/nanostores-qs/src/presets.test.ts`
Expected: FAIL

**Step 3: Implement integer**

```ts
// presets.ts

function createIntegerPreset(roundFn: (n: number) => number): CreatePresetResult<number, number> {
  return createPreset({
    decode: (value: unknown): number => {
      const n = Number.parseFloat(String(value));
      if (Number.isNaN(n)) throw new Error();
      return roundFn(n);
    },
    defaultValue: Number.NaN,
    encode: (v) => {
      if (isNil(v) || Number.isNaN(v)) return undefined;
      return String(v);
    },
  });
}

const integerRound = createIntegerPreset(Math.round);
const integerParse = createPreset({
  decode: (value: unknown): number => {
    const n = Number.parseInt(String(value), 10);
    if (Number.isNaN(n)) throw new Error();
    return n;
  },
  defaultValue: Number.NaN,
  encode: (v) => {
    if (isNil(v) || Number.isNaN(v)) return undefined;
    return String(v);
  },
});

const integer = Object.assign(integerRound, {
  parse: integerParse,
  ceil: createIntegerPreset(Math.ceil),
  floor: createIntegerPreset(Math.floor),
  round: integerRound,
});

export { integer };
```

**Step 4: Run test to verify it passes**

Run: `pnpm test -- --run packages/nanostores-qs/src/presets.test.ts`
Expected: PASS

**Step 5: Add type-level tests**

Test `presets.integer`, `presets.integer.optional`, `presets.integer.array`, `presets.integer.parse`, `presets.integer.ceil.optional`, `presets.integer.floor.array` — all should infer `number`, `number | undefined`, or `Array<number>`.

**Step 6: Run typecheck**

Run: `pnpm run checkTypes`
Expected: PASS

**Step 7: Commit**

```
feat(presets): add integer preset with rounding variants
```

---

### Task 5: Built-in presets — float (with fixed(n))

**Files:**

- Modify: `packages/nanostores-qs/src/presets.ts`
- Modify: `packages/nanostores-qs/src/presets.test.ts`
- Modify: `packages/nanostores-qs/src/presets.test-d.ts`

**Step 1: Write failing tests**

```ts
describe("presets.float", () => {
  it("base: parseFloat", () => {
    expect(float.decode("3.14")).toBe(3.14);
    expect(float.defaultValue).toBeNaN();
  });

  it("throws on invalid", () => {
    expect(() => float.decode("abc")).toThrow();
  });

  it("encodes", () => {
    expect(float.encode(3.14)).toBe("3.14");
    expect(float.encode(Number.NaN)).toBeUndefined();
  });
});

describe("presets.float.fixed(2)", () => {
  const fixed2 = float.fixed(2);

  it("rounds to 2 decimals", () => {
    expect(fixed2.decode("3.14159")).toBe(3.14);
    expect(fixed2.decode("3.145")).toBe(3.15);
  });

  it("encodes with 2 decimals", () => {
    expect(fixed2.encode(3.1)).toBe("3.10");
    expect(fixed2.encode(3)).toBe("3.00");
  });

  it("optional/array work", () => {
    expect("defaultValue" in fixed2.optional).toBe(false);
    expect(fixed2.array.decode(["1.5", "abc", "2.7"])).toEqual([1.5, 2.7]);
  });
});
```

**Step 2: Run test to verify it fails**

**Step 3: Implement float**

```ts
// presets.ts

const floatBase = createPreset({
  decode: (value: unknown): number => {
    const n = Number.parseFloat(String(value));
    if (Number.isNaN(n)) throw new Error();
    return n;
  },
  defaultValue: Number.NaN,
  encode: (v) => {
    if (isNil(v) || Number.isNaN(v)) return undefined;
    return String(v);
  },
});

function fixed(digits: number): CreatePresetResult<number, number> {
  return createPreset({
    decode: (value: unknown): number => {
      const n = Number.parseFloat(String(value));
      if (Number.isNaN(n)) throw new Error();
      return Number(n.toFixed(digits));
    },
    defaultValue: Number.NaN,
    encode: (v) => {
      if (isNil(v) || Number.isNaN(v)) return undefined;
      return v.toFixed(digits);
    },
  });
}

const float = Object.assign(floatBase, { fixed });

export { float };
```

**Step 4: Run test to verify it passes**

**Step 5: Add type-level tests for float, float.optional, float.array, float.fixed(2), float.fixed(2).optional, float.fixed(2).array**

**Step 6: Run typecheck**

**Step 7: Commit**

```
feat(presets): add float preset with fixed(n) variant
```

---

### Task 6: Built-in presets — date, ymd, hms

**Files:**

- Modify: `packages/nanostores-qs/src/presets.ts`
- Modify: `packages/nanostores-qs/src/presets.test.ts`
- Modify: `packages/nanostores-qs/src/presets.test-d.ts`

**Step 1: Write failing tests**

```ts
describe("presets.date", () => {
  it("base: decodes ISO string", () => {
    const d = date.decode("2024-01-15T00:00:00.000Z");
    expect(d.toISOString()).toBe("2024-01-15T00:00:00.000Z");
  });

  it("base: default is Invalid Date", () => {
    expect(Number.isNaN(date.defaultValue.getTime())).toBe(true);
  });

  it("throws on invalid", () => {
    expect(() => date.decode("not-a-date")).toThrow();
  });

  it("encodes to ISO string", () => {
    expect(date.encode(new Date("2024-01-15T00:00:00.000Z"))).toBe("2024-01-15T00:00:00.000Z");
  });

  it("encode returns undefined for invalid date", () => {
    expect(date.encode(new Date(Number.NaN))).toBeUndefined();
  });
});

describe("presets.ymd", () => {
  it("base: defaultValue", () => {
    expect(ymd.defaultValue).toBe("0000-00-00");
  });

  it("decodes valid format", () => {
    expect(ymd.decode("2024-01-15")).toBe("2024-01-15");
  });

  it("throws on invalid format", () => {
    expect(() => ymd.decode("not-a-date")).toThrow();
    expect(() => ymd.decode("2024/01/15")).toThrow();
    expect(() => ymd.decode("24-01-15")).toThrow();
  });
});

describe("presets.hms", () => {
  it("base: defaultValue", () => {
    expect(hms.defaultValue).toBe("00:00:00");
  });

  it("decodes valid format", () => {
    expect(hms.decode("14:30:00")).toBe("14:30:00");
  });

  it("throws on invalid format", () => {
    expect(() => hms.decode("not-a-time")).toThrow();
    expect(() => hms.decode("14:30")).toThrow();
    expect(() => hms.decode("25:00:00")).toThrow();
  });
});
```

**Step 2: Run test to verify it fails**

**Step 3: Implement date, ymd, hms**

```ts
// presets.ts

const date = createPreset({
  decode: (value: unknown): Date => {
    const d = new Date(String(value));
    if (Number.isNaN(d.getTime())) throw new Error();
    return d;
  },
  defaultValue: new Date(Number.NaN),
  encode: (v) => {
    if (isNil(v) || Number.isNaN(v.getTime())) return undefined;
    return v.toISOString();
  },
});

const ymdPattern = /^\d{4}-\d{2}-\d{2}$/;
const ymd = createPreset({
  decode: (value: unknown): string => {
    const s = String(value);
    if (!ymdPattern.test(s)) throw new Error();
    return s;
  },
  defaultValue: "0000-00-00",
});

const hmsPattern = /^([01]\d|2[0-3]):[0-5]\d:[0-5]\d$/;
const hms = createPreset({
  decode: (value: unknown): string => {
    const s = String(value);
    if (!hmsPattern.test(s)) throw new Error();
    return s;
  },
  defaultValue: "00:00:00",
});

export { date, hms, ymd };
```

**Step 4: Run test to verify it passes**

**Step 5: Add type-level tests — `date` -> `Date`, `date.optional` -> `Date | undefined`, `ymd` -> `string`, `hms` -> `string`, etc.**

**Step 6: Run typecheck**

**Step 7: Commit**

```
feat(presets): add date, ymd, and hms presets
```

---

### Task 7: Built-in presets — enum

**Files:**

- Modify: `packages/nanostores-qs/src/presets.ts`
- Modify: `packages/nanostores-qs/src/presets.test.ts`
- Modify: `packages/nanostores-qs/src/presets.test-d.ts`

**Step 1: Write failing tests**

```ts
describe("presets.enum", () => {
  const sorting = presetEnum(["asc", "desc"] as const);

  it("base: decodes valid value", () => {
    expect(sorting.decode("asc")).toBe("asc");
    expect(sorting.decode("desc")).toBe("desc");
  });

  it("base: default is first element", () => {
    expect(sorting.defaultValue).toBe("asc");
  });

  it("throws on invalid", () => {
    expect(() => sorting.decode("invalid")).toThrow();
  });

  it("optional: no defaultValue", () => {
    expect("defaultValue" in sorting.optional).toBe(false);
  });

  it("array: filters invalid", () => {
    expect(sorting.array.decode(["asc", "invalid", "desc"])).toEqual(["asc", "desc"]);
  });
});
```

Note: export name is `enum` — reserved word in JS, but valid as a named export. Access via `presets.enum(...)` after `import * as presets`.

Because `enum` is a reserved word, the internal variable name must differ. Use a different name internally and export with `export { presetEnum as enum }`.

**Step 2: Run test to verify it fails**

**Step 3: Implement enum**

```ts
// presets.ts
// Note: "enum" is reserved — use different internal name, export renamed

function presetEnum<const TEnumArray extends ReadonlyArray<string>>(
  enumArray: TEnumArray,
): CreatePresetResult<TEnumArray[number], TEnumArray[0]> {
  return createPreset<TEnumArray[number], TEnumArray[0]>({
    decode: (value: unknown): TEnumArray[number] => {
      const s = String(value);
      if (!enumArray.includes(s)) throw new Error();
      return s;
    },
    defaultValue: enumArray[0],
  });
}

export { presetEnum as enum };
```

**Step 4: Run test to verify it passes**

**Step 5: Add type-level tests**

```ts
// presets.test-d.ts

// enum -> "asc" | "desc"
(() => {
  const s = qs.createSearchParamStore("sort", presets.enum(["asc", "desc"]));
  type Result = ReturnType<typeof s.$value.get>;
  type Expected = "asc" | "desc";
  anyObj as Result satisfies Expected;
  anyObj as Expected satisfies Result;
})();

// enum.optional -> "asc" | "desc" | undefined
(() => {
  const s = qs.createSearchParamStore("sort", presets.enum(["asc", "desc"]).optional);
  type Result = ReturnType<typeof s.$value.get>;
  type Expected = "asc" | "desc" | undefined;
  anyObj as Result satisfies Expected;
  anyObj as Expected satisfies Result;
})();

// enum.array -> Array<"asc" | "desc">
(() => {
  const s = qs.createSearchParamStore("sort", presets.enum(["asc", "desc"]).array);
  type Result = ReturnType<typeof s.$value.get>;
  type Expected = Array<"asc" | "desc">;
  anyObj as Result satisfies Expected;
  anyObj as Expected satisfies Result;
})();
```

**Step 6: Run typecheck**

**Step 7: Commit**

```
feat(presets): add enum preset
```

---

### Task 8: Built-in presets — tuple

**Files:**

- Modify: `packages/nanostores-qs/src/presets.ts`
- Modify: `packages/nanostores-qs/src/presets.test.ts`
- Modify: `packages/nanostores-qs/src/presets.test-d.ts`

**Step 1: Write failing tests**

```ts
describe("presets.tuple", () => {
  it("decodes comma-separated values", () => {
    const t = presetTuple([string, integer]);
    expect(t.decode("hello,42")).toEqual(["hello", 42]);
  });

  it("default value from element defaults", () => {
    const t = presetTuple([string, integer]);
    expect(t.defaultValue).toEqual(["", Number.NaN]);
  });

  it("encodes to comma-separated", () => {
    const t = presetTuple([string, integer]);
    expect(t.encode(["hello", 42])).toBe("hello,42");
  });

  it("custom separator", () => {
    const t = presetTuple([string, integer], { separator: ":" });
    expect(t.decode("hello:42")).toEqual(["hello", 42]);
    expect(t.encode(["hello", 42])).toBe("hello:42");
  });

  it("with optional elements", () => {
    const t = presetTuple([string.optional, integer.optional]);
    // optional elements decode throws -> undefined per element
    expect(t.defaultValue).toEqual([undefined, undefined]);
  });

  it("entire tuple falls back on decode error", () => {
    const t = presetTuple([string, integer]);
    // integer decode of "abc" throws -> entire tuple fails
    expect(() => t.decode("hello,abc")).toThrow();
  });

  it("no .optional or .array", () => {
    const t = presetTuple([string, integer]);
    expect("optional" in t).toBe(false);
    expect("array" in t).toBe(false);
  });
});
```

**Step 2: Run test to verify it fails**

**Step 3: Implement tuple**

The tuple config objects come from preset groups. Each element's config has `decode`, and may have `defaultValue`. Tuple uses these directly — no `createPreset` wrapper (no `.optional` / `.array`).

```ts
// presets.ts

// Types needed for tuple inference
type InferTupleType<TConfigs extends ReadonlyArray<unknown>> = {
  [K in keyof TConfigs]: createQsUtils.InferValueFromItemQueryParamConfig<TConfigs[K]>;
};

type InferTupleDefaults<TConfigs extends ReadonlyArray<unknown>> = {
  [K in keyof TConfigs]: TConfigs[K] extends { defaultValue: infer TDefaultValue }
    ? TDefaultValue
    : undefined;
};

interface TupleConfig {
  decode: (value: unknown) => unknown;
  defaultValue?: unknown;
  encode?: (value: any) => string | undefined;
}

function presetTuple<const TConfigs extends ReadonlyArray<TupleConfig>>(
  configs: TConfigs,
  options?: { separator?: string },
): {
  decode: (value: unknown) => InferTupleType<TConfigs>;
  defaultValue: InferTupleDefaults<TConfigs>;
  encode: (value: InferTupleType<TConfigs>) => string | undefined;
} {
  const separator = options?.separator ?? ",";

  const defaultValue = configs.map((c) =>
    "defaultValue" in c ? c.defaultValue : undefined,
  ) as InferTupleDefaults<TConfigs>;

  return {
    decode: (value: unknown): InferTupleType<TConfigs> => {
      const parts = String(value).split(separator);
      return configs.map((c, i) => c.decode(parts[i])) as InferTupleType<TConfigs>;
    },
    defaultValue,
    encode: (value: InferTupleType<TConfigs>): string | undefined => {
      const parts = (value as Array<unknown>).map((v, i) => {
        const encode = configs[i].encode ?? ((val: unknown) => String(val));
        return encode(v);
      });
      if (parts.every((p) => p == null)) return undefined;
      return parts.map((p) => p ?? "").join(separator);
    },
  };
}

export { presetTuple as tuple };
```

**Step 4: Run test to verify it passes**

**Step 5: Add type-level tests**

```ts
// tuple -> [string, number]
(() => {
  const t = presets.tuple([presets.string, presets.integer]);
  const s = qs.createSearchParamStore("t", t);
  type Result = ReturnType<typeof s.$value.get>;
  type Expected = [string, number];
  anyObj as Result satisfies Expected;
  anyObj as Expected satisfies Result;
})();

// tuple with optional elements -> [string | undefined, number | undefined]
(() => {
  const t = presets.tuple([presets.string.optional, presets.integer.optional]);
  const s = qs.createSearchParamStore("t", t);
  type Result = ReturnType<typeof s.$value.get>;
  type Expected = [string | undefined, number | undefined];
  anyObj as Result satisfies Expected;
  anyObj as Expected satisfies Result;
})();
```

**Step 6: Run typecheck**

**Step 7: Commit**

```
feat(presets): add tuple preset
```

---

### Task 9: Full CI verification

**Step 1: Run all tests**

Run: `pnpm test -- --run`
Expected: PASS

**Step 2: Run typecheck**

Run: `pnpm run checkTypes`
Expected: PASS

**Step 3: Run lint**

Run: `pnpm run lint`
Expected: PASS (fix any issues)

**Step 4: Run build**

Run: `pnpm run build`
Expected: PASS

**Step 5: Commit any lint fixes**

```
fix(presets): lint fixes
```

---

### Task 10: Update documentation — presets reference

**Files:**

- Rewrite: `packages/docs/src/content/docs/reference/presets-table.mdx`
- Rewrite: `packages/docs/src/content/docs/advanced/custom-presets.mdx`

Update presets-table.mdx to document the new grouped API with `import * as presets` pattern. Organize by preset name with `.optional` / `.array` variants in each table.

Update custom-presets.mdx to show `createPreset` as the advanced API, with examples for decimal.js and zod v4 integration:

```ts
// zod v4 example
import { z } from "zod";

const tabSchema = z.enum(["home", "settings", "profile"]);
const tab = qsUtils.createSearchParamStore("tab", {
  decode: (v) => tabSchema.parse(String(v)),
  defaultValue: "home" as z.infer<typeof tabSchema>,
});
```

**Step 1: Rewrite presets-table.mdx**

**Step 2: Rewrite custom-presets.mdx**

**Step 3: Run build to verify docs compile**

Run: `pnpm --filter docs build`
Expected: PASS

**Step 4: Commit**

```
docs: update presets reference and custom presets guide
```

---

### Task 11: Update documentation — quick-start and guides

**Files:**

- Modify: `packages/docs/src/content/docs/getting-started/quick-start.mdx`
- Modify: `packages/docs/src/content/docs/guides/single-param.mdx`
- Modify: `packages/docs/src/content/docs/guides/multi-param.mdx`
- Modify: `packages/docs/src/content/docs/advanced/inline-config.mdx`
- Modify: `packages/docs/src/content/docs/advanced/validation.mdx`

Replace all `presetInt`, `presetEnum(...)`, `presetBoolean` imports with `import * as presets` pattern. Use `presets.integer`, `presets.enum(["..."])`, `presets.boolean`.

Reframe inline config and validation pages as "advanced" alternatives to presets.

**Step 1: Update each file**

**Step 2: Run docs build**

Run: `pnpm --filter docs build`
Expected: PASS

**Step 3: Commit**

```
docs: update guides to use preset-first examples
```

---

### Task 12: Update README

**Files:**

- Modify: `README.md`

Update any preset references to use the new `import * as presets` pattern.

**Step 1: Update README**

**Step 2: Commit**

```
docs: update README with new preset API
```

---

### Task 13: Final verification

**Step 1: Run full CI pipeline**

```bash
pnpm run lint && pnpm run checkTypes && pnpm test -- --run && pnpm run build
```

Expected: All PASS

**Step 2: Verify docs build**

```bash
pnpm --filter docs build
```

Expected: PASS

**Step 3: Review exports**

```bash
pnpm exec tsgo --ignoreConfig --noEmit -c "import * as presets from './packages/nanostores-qs/dist/presets'; console.log(Object.keys(presets));"
```

Verify all expected names are exported: `boolean`, `createPreset`, `date`, `enum`, `float`, `hms`, `integer`, `string`, `tuple`, `ymd`.

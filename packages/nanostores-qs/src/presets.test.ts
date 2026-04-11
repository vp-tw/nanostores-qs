import { describe, expect, it } from "vitest";

import { createQsUtils } from "./main";

// --- Integration: presets through createSearchParamStore / createSearchParamsStore ---

import {
  boolean,
  createPreset,
  date,
  float,
  hms,
  integer,
  enum as presetEnum,
  string,
  tuple,
  ymd,
} from "./presets";

describe("createPreset", () => {
  const percentage = createPreset({
    decode: (value: unknown): number => {
      const n = Number(value);
      if (Number.isNaN(n)) throw new Error("invalid number");
      return n;
    },
    defaultValue: 0,
    encode: (v) => String(v),
  });

  describe("base (no options)", () => {
    it("has decode, defaultValue, and encode", () => {
      const config = percentage();
      expect(config.decode("42")).toBe(42);
      expect(config.defaultValue).toBe(0);
      expect(config.encode(42)).toBe("42");
    });

    it("decode throws on invalid input", () => {
      const config = percentage();
      expect(() => config.decode("abc")).toThrow("invalid number");
    });

    it("decode returns defaultValue for nil (absent param)", () => {
      const config = percentage();
      expect(config.decode(undefined)).toBe(0);
      expect(config.decode(null)).toBe(0);
    });
  });

  describe("optional", () => {
    it("has no defaultValue", () => {
      const config = percentage({ optional: true });
      expect("defaultValue" in config).toBe(false);
    });

    it("decode returns undefined for null", () => {
      const config = percentage({ optional: true });
      expect(config.decode(null)).toBeUndefined();
    });

    it("decode returns undefined for undefined", () => {
      const config = percentage({ optional: true });
      expect(config.decode(undefined)).toBeUndefined();
    });

    it("decode passes through non-nil values", () => {
      const config = percentage({ optional: true });
      expect(config.decode("42")).toBe(42);
    });

    it("encode returns undefined for null", () => {
      const config = percentage({ optional: true });
      expect(config.encode(null as any)).toBeUndefined();
    });

    it("encode returns undefined for undefined", () => {
      const config = percentage({ optional: true });
      expect(config.encode(undefined as any)).toBeUndefined();
    });

    it("encode passes through non-nil values", () => {
      const config = percentage({ optional: true });
      expect(config.encode(42)).toBe("42");
    });
  });

  describe("default", () => {
    it("decode returns custom default for nil (absent param)", () => {
      const config = percentage({ default: 50 });
      expect(config.decode(undefined)).toBe(50);
      expect(config.decode(null)).toBe(50);
    });

    it("overrides defaultValue", () => {
      const config = percentage({ default: 50 });
      expect(config.defaultValue).toBe(50);
    });

    it("keeps same decode and encode", () => {
      const config = percentage({ default: 50 });
      expect(config.decode("42")).toBe(42);
      expect(config.encode(42)).toBe("42");
    });
  });

  describe("array", () => {
    it("has isArray true", () => {
      const config = percentage({ array: true });
      expect(config.isArray).toBe(true);
    });

    it("decode maps valid items", () => {
      const config = percentage({ array: true });
      expect(config.decode(["1", "2", "3"])).toEqual([1, 2, 3]);
    });

    it("decode filters out invalid items via try-catch", () => {
      const config = percentage({ array: true });
      expect(config.decode(["1", "abc", "3"])).toEqual([1, 3]);
    });

    it("encode maps items to strings", () => {
      const config = percentage({ array: true });
      expect(config.encode([1, 2, 3])).toEqual(["1", "2", "3"]);
    });

    it("encode filters out nil values", () => {
      const config = percentage({ array: true });
      expect(config.encode([1, null as any, 3])).toEqual(["1", "3"]);
    });
  });

  describe("array with maxItems", () => {
    it("slices decoded result to maxItems", () => {
      const config = percentage({ array: true, maxItems: 2 });
      expect(config.decode(["1", "2", "3", "4"])).toEqual([1, 2]);
    });

    it("does not pad when fewer items than maxItems", () => {
      const config = percentage({ array: true, maxItems: 5 });
      expect(config.decode(["1"])).toEqual([1]);
    });
  });

  describe("default encode fallback", () => {
    const noEncode = createPreset({
      decode: (v: unknown) => String(v),
      defaultValue: "",
    });

    it("falls back to String() when encode not provided", () => {
      const config = noEncode();
      expect(config.encode(42 as any)).toBe("42");
    });

    it("fallback encode works in optional mode", () => {
      const config = noEncode({ optional: true });
      expect(config.encode("hello")).toBe("hello");
      expect(config.encode(undefined as any)).toBeUndefined();
    });

    it("fallback encode works in array mode", () => {
      const config = noEncode({ array: true });
      expect(config.encode(["a", "b"])).toEqual(["a", "b"]);
    });
  });

  describe("with resolve", () => {
    const ratio = createPreset<string, string, number>({
      decode: (v) => {
        const s = String(v);
        if (!/^\d+:\d+$/.test(s)) throw new Error("invalid ratio");
        return s;
      },
      defaultValue: "16:9",
      resolve: (v) => {
        const parts = v.split(":").map(Number);
        return (parts[0] ?? 0) / (parts[1] ?? 1);
      },
    });

    it("base: includes resolve", () => {
      const config = ratio();
      expect(config.resolve("16:9")).toBeCloseTo(16 / 9);
      expect(config.resolve("4:3")).toBeCloseTo(4 / 3);
    });

    it("default: includes resolve", () => {
      const config = ratio({ default: "4:3" });
      expect(config.resolve("16:9")).toBeCloseTo(16 / 9);
      expect(config.defaultValue).toBe("4:3");
    });

    it("optional: resolve wraps nil → undefined", () => {
      const config = ratio({ optional: true });
      expect(config.resolve("16:9")).toBeCloseTo(16 / 9);
      expect(config.resolve(undefined as any)).toBeUndefined();
    });

    it("array: resolve maps each element", () => {
      const config = ratio({ array: true });
      const result = config.resolve(["16:9", "4:3"]);
      expect(result[0]).toBeCloseTo(16 / 9);
      expect(result[1]).toBeCloseTo(4 / 3);
    });
  });
});

describe("integer", () => {
  describe("base (no options)", () => {
    it("has decode, defaultValue NaN, and encode", () => {
      const config = integer();
      expect(config.decode("42")).toBe(42);
      expect(config.defaultValue).toBeNaN();
      expect(config.encode(42)).toBe("42");
    });

    it("decode rounds by default: '3.7' → 4, '3.2' → 3", () => {
      const config = integer();
      expect(config.decode("3.7")).toBe(4);
      expect(config.decode("3.2")).toBe(3);
    });

    it("throws on invalid input", () => {
      const config = integer();
      expect(() => config.decode("abc")).toThrow();
    });

    it("encode: NaN → undefined, 42 → '42'", () => {
      const config = integer();
      expect(config.encode(Number.NaN)).toBeUndefined();
      expect(config.encode(42)).toBe("42");
    });
  });

  describe("round: 'ceil'", () => {
    it("rounds up: '3.2' → 4, '-1.5' → -1", () => {
      const config = integer({ round: "ceil" });
      expect(config.decode("3.2")).toBe(4);
      expect(config.decode("-1.5")).toBe(-1);
    });
  });

  describe("round: 'floor'", () => {
    it("rounds down: '3.7' → 3, '-1.5' → -2", () => {
      const config = integer({ round: "floor" });
      expect(config.decode("3.7")).toBe(3);
      expect(config.decode("-1.5")).toBe(-2);
    });
  });

  describe("round: 'parse'", () => {
    it("uses parseInt truncation: '3.7' → 3", () => {
      const config = integer({ round: "parse" });
      expect(config.decode("3.7")).toBe(3);
    });
  });

  describe("default min/max are safe integers", () => {
    it("clamps values beyond safe integer range", () => {
      const config = integer();
      expect(config.decode("1e20")).toBe(Number.MAX_SAFE_INTEGER);
      expect(config.decode("-1e20")).toBe(Number.MIN_SAFE_INTEGER);
    });
  });

  describe("min/max with clamp (default)", () => {
    it("clamps to range", () => {
      const config = integer({ min: 0, max: 100 });
      expect(config.decode("-5")).toBe(0);
      expect(config.decode("200")).toBe(100);
      expect(config.decode("50")).toBe(50);
    });
  });

  describe("min/max with reject", () => {
    it("throws on out of range", () => {
      const config = integer({ min: 0, max: 100, outOfRange: "reject" });
      expect(() => config.decode("-5")).toThrow();
      expect(() => config.decode("200")).toThrow();
      expect(config.decode("50")).toBe(50);
    });
  });

  describe("optional", () => {
    it("has no defaultValue, nil-safe decode/encode", () => {
      const config = integer({ optional: true });
      expect("defaultValue" in config).toBe(false);
      expect(config.decode(null)).toBeUndefined();
      expect(config.decode(undefined)).toBeUndefined();
      expect(config.decode("42")).toBe(42);
      expect(config.encode(undefined as any)).toBeUndefined();
      expect(config.encode(42)).toBe("42");
    });
  });

  describe("default", () => {
    it("uses provided defaultValue", () => {
      const config = integer({ default: 1 });
      expect(config.defaultValue).toBe(1);
    });
  });

  describe("array", () => {
    it("isArray true, filters invalid items", () => {
      const config = integer({ array: true });
      expect(config.isArray).toBe(true);
      expect(config.decode(["1", "abc", "3"])).toEqual([1, 3]);
    });
  });

  describe("array with maxItems", () => {
    it("slices to maxItems", () => {
      const config = integer({ array: true, maxItems: 3 });
      expect(config.decode(["1", "2", "3", "4", "5"])).toEqual([1, 2, 3]);
    });
  });

  describe("combined options", () => {
    it("round + min + default work together", () => {
      const config = integer({ round: "ceil", min: 0, default: 0 });
      expect(config.decode("3.2")).toBe(4);
      expect(config.decode("-5.5")).toBe(0);
      expect(config.defaultValue).toBe(0);
    });
  });

  describe("numInput", () => {
    it("decode: raw string passthrough", () => {
      const config = integer({ numInput: true, default: 1 });
      expect(config.decode("42")).toBe("42");
      expect(config.decode("3.2")).toBe("3.2");
    });

    it("decode: nil → empty string", () => {
      const config = integer({ numInput: true, default: 1 });
      expect(config.decode(undefined)).toBe("");
      expect(config.decode(null)).toBe("");
    });

    it("defaultValue is empty string", () => {
      const config = integer({ numInput: true, default: 1 });
      expect(config.defaultValue).toBe("");
    });

    it("encode: empty string → undefined", () => {
      const config = integer({ numInput: true, default: 1 });
      expect(config.encode("")).toBeUndefined();
    });

    it("encode: raw string passthrough (no normalization)", () => {
      const config = integer({ numInput: true, default: 1, min: 1, max: 100 });
      expect(config.encode("42")).toBe("42");
      expect(config.encode("0")).toBe("0");
      expect(config.encode("200")).toBe("200");
    });

    it("resolve: empty string → default number", () => {
      const config = integer({ numInput: true, default: 1 });
      expect(config.resolve("")).toBe(1);
    });

    it("resolve: number string → parsed and clamped", () => {
      const config = integer({ numInput: true, default: 1, min: 1, max: 100 });
      expect(config.resolve("42")).toBe(42);
      expect(config.resolve("0")).toBe(1);
      expect(config.resolve("200")).toBe(100);
    });

    it("resolve: applies round", () => {
      const config = integer({ numInput: true, default: 1, round: "ceil", min: 0, max: 100 });
      expect(config.resolve("3.2")).toBe(4);
    });

    it("resolve: invalid string → default", () => {
      const config = integer({ numInput: true, default: 1 });
      expect(config.resolve("abc" as any)).toBe(1);
    });

    it("has resolve function in config", () => {
      const config = integer({ numInput: true, default: 1 });
      expect(typeof config.resolve).toBe("function");
    });
  });
});

describe("float", () => {
  describe("base (no options)", () => {
    it("decodes '3.14' → 3.14, defaultValue NaN", () => {
      const config = float();
      expect(config.decode("3.14")).toBe(3.14);
      expect(config.defaultValue).toBeNaN();
    });

    it("throws on invalid input", () => {
      const config = float();
      expect(() => config.decode("abc")).toThrow();
    });

    it("encode: NaN → undefined, 3.14 → '3.14'", () => {
      const config = float();
      expect(config.encode(Number.NaN)).toBeUndefined();
      expect(config.encode(3.14)).toBe("3.14");
    });
  });

  describe("fixed", () => {
    it("decode rounds to fixed decimals: '3.14159' → 3.14", () => {
      const config = float({ fixed: 2 });
      expect(config.decode("3.14159")).toBe(3.14);
    });

    it("encode pads to fixed decimals: 3.1 → '3.10'", () => {
      const config = float({ fixed: 2 });
      expect(config.encode(3.1)).toBe("3.10");
    });
  });

  describe("min/max with fixed", () => {
    it("clamps after fixed rounding", () => {
      const config = float({ min: 0, max: 1, fixed: 2 });
      expect(config.decode("-0.5")).toBe(0);
      expect(config.decode("1.5")).toBe(1);
      expect(config.decode("0.456")).toBe(0.46);
    });
  });

  describe("outOfRange: reject", () => {
    it("throws on out-of-range values", () => {
      const config = float({ min: 0, max: 10, outOfRange: "reject" });
      expect(() => config.decode("-1")).toThrow("out of range");
      expect(() => config.decode("11")).toThrow("out of range");
    });

    it("passes in-range values", () => {
      const config = float({ min: 0, max: 10, outOfRange: "reject" });
      expect(config.decode("5")).toBe(5);
      expect(config.decode("0")).toBe(0);
      expect(config.decode("10")).toBe(10);
    });
  });

  describe("default", () => {
    it("uses custom default for nil", () => {
      const config = float({ default: 0.5 });
      expect(config.defaultValue).toBe(0.5);
      expect(config.decode(undefined)).toBe(0.5);
      expect(config.decode(null)).toBe(0.5);
    });

    it("decodes valid values normally", () => {
      const config = float({ default: 0.5 });
      expect(config.decode("3.14")).toBe(3.14);
    });
  });

  describe("optional", () => {
    it("has no defaultValue", () => {
      const config = float({ optional: true });
      expect("defaultValue" in config).toBe(false);
      expect(config.decode(null)).toBeUndefined();
      expect(config.decode("3.14")).toBe(3.14);
    });
  });

  describe("array", () => {
    it("filters invalid items", () => {
      const config = float({ array: true });
      expect(config.isArray).toBe(true);
      expect(config.decode(["1.1", "abc", "3.3"])).toEqual([1.1, 3.3]);
    });
  });

  describe("numInput", () => {
    it("decode: raw string passthrough", () => {
      const config = float({ numInput: true, default: 0 });
      expect(config.decode("3.14")).toBe("3.14");
      expect(config.decode("1.")).toBe("1.");
    });

    it("decode: nil → empty string", () => {
      const config = float({ numInput: true, default: 0 });
      expect(config.decode(undefined)).toBe("");
      expect(config.decode(null)).toBe("");
    });

    it("encode: empty string → undefined", () => {
      const config = float({ numInput: true, default: 0 });
      expect(config.encode("")).toBeUndefined();
    });

    it("encode: raw string passthrough (no normalization)", () => {
      const config = float({ numInput: true, default: 0, min: 0, max: 1 });
      expect(config.encode("3.14")).toBe("3.14");
      expect(config.encode("1.")).toBe("1.");
      expect(config.encode("-0.5")).toBe("-0.5");
      expect(config.encode("1.5")).toBe("1.5");
    });

    it("resolve: empty string → default", () => {
      const config = float({ numInput: true, default: 0.5 });
      expect(config.resolve("")).toBe(0.5);
    });

    it("resolve: number string → parsed and clamped", () => {
      const config = float({ numInput: true, default: 0, min: 0, max: 1 });
      expect(config.resolve("0.5")).toBe(0.5);
      expect(config.resolve("1.5")).toBe(1);
      expect(config.resolve("-0.5")).toBe(0);
    });

    it("resolve: applies fixed", () => {
      const config = float({ numInput: true, default: 0, fixed: 2 });
      expect(config.resolve("3.14159")).toBe(3.14);
    });

    it("resolve: invalid string → default", () => {
      const config = float({ numInput: true, default: 0 });
      expect(config.resolve("abc" as any)).toBe(0);
    });
  });
});

describe("string", () => {
  describe("base (no options)", () => {
    it("has decode, defaultValue '', and encode", () => {
      const config = string();
      expect(config.decode("hello")).toBe("hello");
      expect(config.defaultValue).toBe("");
      expect(config.encode("hello")).toBe("hello");
    });

    it("decode coerces non-string values", () => {
      const config = string();
      expect(config.decode(42)).toBe("42");
      expect(config.decode(true)).toBe("true");
    });

    it("decode returns '' for nil (absent param), not 'undefined'", () => {
      const config = string();
      expect(config.decode(undefined)).toBe("");
      expect(config.decode(null)).toBe("");
    });
  });

  describe("maxLength with clamp (default)", () => {
    it("truncates strings exceeding maxLength", () => {
      const config = string({ maxLength: 5 });
      expect(config.decode("hello world")).toBe("hello");
    });

    it("does not truncate strings within maxLength", () => {
      const config = string({ maxLength: 5 });
      expect(config.decode("hi")).toBe("hi");
    });
  });

  describe("maxLength with reject", () => {
    it("throws on strings exceeding maxLength", () => {
      const config = string({ maxLength: 5, outOfRange: "reject" });
      expect(() => config.decode("hello world")).toThrow();
    });

    it("accepts strings within maxLength", () => {
      const config = string({ maxLength: 5, outOfRange: "reject" });
      expect(config.decode("hello")).toBe("hello");
    });
  });

  describe("optional", () => {
    it("has no defaultValue", () => {
      const config = string({ optional: true });
      expect("defaultValue" in config).toBe(false);
    });

    it("decode returns undefined for nil", () => {
      const config = string({ optional: true });
      expect(config.decode(null)).toBeUndefined();
      expect(config.decode(undefined)).toBeUndefined();
    });

    it("decode passes through non-nil values", () => {
      const config = string({ optional: true });
      expect(config.decode("hello")).toBe("hello");
    });

    it("encode returns undefined for nil", () => {
      const config = string({ optional: true });
      expect(config.encode(undefined as any)).toBeUndefined();
    });
  });

  describe("default", () => {
    it("uses provided defaultValue", () => {
      const config = string({ default: "all" });
      expect(config.defaultValue).toBe("all");
    });
  });

  describe("array", () => {
    it("isArray true, filters nil items", () => {
      const config = string({ array: true });
      expect(config.isArray).toBe(true);
      expect(config.decode(["a", "b", "c"])).toEqual(["a", "b", "c"]);
    });
  });

  describe("array with maxItems", () => {
    it("slices to maxItems", () => {
      const config = string({ array: true, maxItems: 3 });
      expect(config.decode(["a", "b", "c", "d", "e"])).toEqual(["a", "b", "c"]);
    });
  });
});

describe("boolean", () => {
  describe("base (no options)", () => {
    it("decode: 'true' → true", () => {
      const config = boolean();
      expect(config.decode("true")).toBe(true);
    });

    it("decode: 'false' → false", () => {
      const config = boolean();
      expect(config.decode("false")).toBe(false);
    });

    it("decode: invalid value → throws", () => {
      const config = boolean();
      expect(() => config.decode("anything")).toThrow("invalid boolean");
      expect(() => config.decode("")).toThrow("invalid boolean");
      expect(() => config.decode("1")).toThrow("invalid boolean");
    });

    it("decode: nil → defaultValue (false)", () => {
      const config = boolean();
      expect(config.decode(undefined)).toBe(false);
      expect(config.decode(null)).toBe(false);
    });

    it("defaultValue is false", () => {
      const config = boolean();
      expect(config.defaultValue).toBe(false);
    });

    it("encode: true → 'true', false → undefined (omit default)", () => {
      const config = boolean();
      expect(config.encode(true)).toBe("true");
      expect(config.encode(false)).toBeUndefined();
    });
  });

  describe("default: true", () => {
    it("defaultValue is true", () => {
      const config = boolean({ default: true });
      expect(config.defaultValue).toBe(true);
    });

    it("decode: nil → true (defaultValue)", () => {
      const config = boolean({ default: true });
      expect(config.decode(undefined)).toBe(true);
      expect(config.decode(null)).toBe(true);
    });

    it("decode: 'true' → true, 'false' → false", () => {
      const config = boolean({ default: true });
      expect(config.decode("true")).toBe(true);
      expect(config.decode("false")).toBe(false);
    });

    it("decode: invalid → throws (falls back to true via main.ts catch)", () => {
      const config = boolean({ default: true });
      expect(() => config.decode("foo")).toThrow("invalid boolean");
      expect(() => config.decode("1")).toThrow("invalid boolean");
    });

    it("encode: false → 'false', true → undefined (omit default)", () => {
      const config = boolean({ default: true });
      expect(config.encode(false)).toBe("false");
      expect(config.encode(true)).toBeUndefined();
    });
  });

  describe("optional", () => {
    it("has no defaultValue", () => {
      const config = boolean({ optional: true });
      expect("defaultValue" in config).toBe(false);
    });

    it("decode: 'true' → true", () => {
      const config = boolean({ optional: true });
      expect(config.decode("true")).toBe(true);
    });

    it("decode: 'false' → false", () => {
      const config = boolean({ optional: true });
      expect(config.decode("false")).toBe(false);
    });

    it("decode: 'anything' → throw (strict)", () => {
      const config = boolean({ optional: true });
      expect(() => config.decode("anything")).toThrow();
    });

    it("decode: nil → undefined", () => {
      const config = boolean({ optional: true });
      expect(config.decode(null)).toBeUndefined();
      expect(config.decode(undefined)).toBeUndefined();
    });

    it("encode: true → 'true', false → 'false', undefined → undefined", () => {
      const config = boolean({ optional: true });
      expect(config.encode(true)).toBe("true");
      expect(config.encode(false)).toBe("false");
      expect(config.encode(undefined as any)).toBeUndefined();
    });
  });

  describe("array", () => {
    it("isArray true, strict decode filters invalid", () => {
      const config = boolean({ array: true });
      expect(config.isArray).toBe(true);
      expect(config.decode(["true", "false", "anything", "true"])).toEqual([true, false, true]);
    });
  });

  describe("array with maxItems", () => {
    it("slices to maxItems", () => {
      const config = boolean({ array: true, maxItems: 2 });
      expect(config.decode(["true", "false", "true"])).toEqual([true, false]);
    });
  });
});

describe("date", () => {
  describe("base (no options)", () => {
    it("decodes ISO string to Date", () => {
      const config = date();
      const d = config.decode("2024-01-15T10:30:00.000Z");
      expect(d).toBeInstanceOf(Date);
      expect(d.toISOString()).toBe("2024-01-15T10:30:00.000Z");
    });

    it("defaultValue is Invalid Date", () => {
      const config = date();
      expect(config.defaultValue).toBeInstanceOf(Date);
      expect(Number.isNaN(config.defaultValue.getTime())).toBe(true);
    });

    it("encode returns ISO string", () => {
      const config = date();
      const d = new Date("2024-01-15T10:30:00.000Z");
      expect(config.encode(d)).toBe("2024-01-15T10:30:00.000Z");
    });
  });

  describe("decode throws on invalid", () => {
    it("throws on 'not-a-date'", () => {
      const config = date();
      expect(() => config.decode("not-a-date")).toThrow("invalid date");
    });
  });

  describe("encode guards against Invalid Date", () => {
    it("invalid Date → undefined (not RangeError)", () => {
      const config = date();
      expect(config.encode(new Date(Number.NaN))).toBeUndefined();
    });

    it("nil → undefined", () => {
      const config = date();
      expect(config.encode(null as any)).toBeUndefined();
      expect(config.encode(undefined as any)).toBeUndefined();
    });
  });

  describe("optional", () => {
    it("has no defaultValue, nil-safe", () => {
      const config = date({ optional: true });
      expect("defaultValue" in config).toBe(false);
      expect(config.decode(null)).toBeUndefined();
      expect(config.decode(undefined)).toBeUndefined();
    });

    it("decodes valid value", () => {
      const config = date({ optional: true });
      const d = config.decode("2024-01-15T10:30:00.000Z");
      expect(d).toBeInstanceOf(Date);
      expect(d!.toISOString()).toBe("2024-01-15T10:30:00.000Z");
    });
  });

  describe("default", () => {
    it("uses provided default Date", () => {
      const d = new Date("2024-01-01T00:00:00.000Z");
      const config = date({ default: d });
      expect(config.defaultValue).toBe(d);
    });

    it("nil → default Date", () => {
      const d = new Date("2024-01-01T00:00:00.000Z");
      const config = date({ default: d });
      expect(config.decode(undefined)).toBe(d);
      expect(config.decode(null)).toBe(d);
    });
  });

  describe("array", () => {
    it("filters invalid dates", () => {
      const config = date({ array: true });
      expect(config.isArray).toBe(true);
      const result = config.decode([
        "2024-01-15T10:30:00.000Z",
        "not-a-date",
        "2024-06-01T00:00:00.000Z",
      ]);
      expect(result).toHaveLength(2);
      expect(result[0]!.toISOString()).toBe("2024-01-15T10:30:00.000Z");
      expect(result[1]!.toISOString()).toBe("2024-06-01T00:00:00.000Z");
    });
  });
});

describe("ymd", () => {
  describe("base (no options)", () => {
    it("decodes '2024-01-15' → '2024-01-15'", () => {
      const config = ymd();
      expect(config.decode("2024-01-15")).toBe("2024-01-15");
    });

    it("defaultValue is '0000-00-00'", () => {
      const config = ymd();
      expect(config.defaultValue).toBe("0000-00-00");
    });
  });

  describe("decode throws on invalid format", () => {
    it("throws on 'not-a-date'", () => {
      const config = ymd();
      expect(() => config.decode("not-a-date")).toThrow("invalid ymd format");
    });

    it("throws on '2024/01/15'", () => {
      const config = ymd();
      expect(() => config.decode("2024/01/15")).toThrow("invalid ymd format");
    });

    it("throws on '24-01-15'", () => {
      const config = ymd();
      expect(() => config.decode("24-01-15")).toThrow("invalid ymd format");
    });
  });

  describe("decode throws on semantically invalid dates", () => {
    it("throws on '2024-13-01' (month 13)", () => {
      const config = ymd();
      expect(() => config.decode("2024-13-01")).toThrow("invalid ymd date");
    });

    it("throws on '2024-02-30' (Feb 30)", () => {
      const config = ymd();
      expect(() => config.decode("2024-02-30")).toThrow("invalid ymd date");
    });

    it("throws on '2023-02-29' (non-leap year)", () => {
      const config = ymd();
      expect(() => config.decode("2023-02-29")).toThrow("invalid ymd date");
    });

    it("accepts '2024-02-29' (leap year)", () => {
      const config = ymd();
      expect(config.decode("2024-02-29")).toBe("2024-02-29");
    });
  });

  describe("optional", () => {
    it("has no defaultValue", () => {
      const config = ymd({ optional: true });
      expect("defaultValue" in config).toBe(false);
      expect(config.decode(null)).toBeUndefined();
      expect(config.decode(undefined)).toBeUndefined();
    });
  });

  describe("default", () => {
    it("uses custom default", () => {
      const config = ymd({ default: "2024-01-01" });
      expect(config.defaultValue).toBe("2024-01-01");
    });
  });

  describe("array", () => {
    it("filters invalid formats", () => {
      const config = ymd({ array: true });
      expect(config.isArray).toBe(true);
      expect(config.decode(["2024-01-15", "not-a-date", "2024-06-01"])).toEqual([
        "2024-01-15",
        "2024-06-01",
      ]);
    });
  });
});

describe("hms", () => {
  describe("base (no options)", () => {
    it("decodes '14:30:00' → '14:30:00'", () => {
      const config = hms();
      expect(config.decode("14:30:00")).toBe("14:30:00");
    });

    it("defaultValue is '00:00:00'", () => {
      const config = hms();
      expect(config.defaultValue).toBe("00:00:00");
    });
  });

  describe("valid edge cases", () => {
    it("accepts '00:00:00'", () => {
      const config = hms();
      expect(config.decode("00:00:00")).toBe("00:00:00");
    });

    it("accepts '23:59:59'", () => {
      const config = hms();
      expect(config.decode("23:59:59")).toBe("23:59:59");
    });
  });

  describe("decode throws on invalid", () => {
    it("throws on 'not-a-time'", () => {
      const config = hms();
      expect(() => config.decode("not-a-time")).toThrow("invalid hms format");
    });

    it("throws on '14:30' (missing seconds)", () => {
      const config = hms();
      expect(() => config.decode("14:30")).toThrow("invalid hms format");
    });

    it("throws on '25:00:00' (invalid hour)", () => {
      const config = hms();
      expect(() => config.decode("25:00:00")).toThrow("invalid hms format");
    });

    it("rejects '24:00:00' (ISO 8601 end-of-day — not supported)", () => {
      const config = hms();
      expect(() => config.decode("24:00:00")).toThrow("invalid hms format");
    });
  });

  describe("optional", () => {
    it("has no defaultValue", () => {
      const config = hms({ optional: true });
      expect("defaultValue" in config).toBe(false);
      expect(config.decode(null)).toBeUndefined();
      expect(config.decode(undefined)).toBeUndefined();
    });
  });

  describe("default", () => {
    it("uses custom default", () => {
      const config = hms({ default: "08:00:00" });
      expect(config.defaultValue).toBe("08:00:00");
    });
  });

  describe("array", () => {
    it("filters invalid formats", () => {
      const config = hms({ array: true });
      expect(config.isArray).toBe(true);
      expect(config.decode(["14:30:00", "not-a-time", "08:00:00"])).toEqual([
        "14:30:00",
        "08:00:00",
      ]);
    });
  });
});

describe("enum", () => {
  describe("base (no options)", () => {
    it("decodes valid enum value", () => {
      const config = presetEnum(["asc", "desc"]);
      expect(config.decode("asc")).toBe("asc");
      expect(config.decode("desc")).toBe("desc");
    });

    it("defaultValue is first element", () => {
      const config = presetEnum(["asc", "desc"]);
      expect(config.defaultValue).toBe("asc");
    });

    it("encode returns the value as-is", () => {
      const config = presetEnum(["asc", "desc"]);
      expect(config.encode("asc")).toBe("asc");
    });
  });

  describe("decode throws on invalid", () => {
    it("throws on value not in enum", () => {
      const config = presetEnum(["asc", "desc"]);
      expect(() => config.decode("invalid")).toThrow("invalid enum value");
    });
  });

  describe("optional", () => {
    it("has no defaultValue", () => {
      const config = presetEnum(["asc", "desc"], { optional: true });
      expect("defaultValue" in config).toBe(false);
    });

    it("decode returns undefined for nil", () => {
      const config = presetEnum(["asc", "desc"], { optional: true });
      expect(config.decode(null)).toBeUndefined();
      expect(config.decode(undefined)).toBeUndefined();
    });

    it("decode returns value for valid enum", () => {
      const config = presetEnum(["asc", "desc"], { optional: true });
      expect(config.decode("asc")).toBe("asc");
    });
  });

  describe("default", () => {
    it("uses provided default", () => {
      const config = presetEnum(["asc", "desc"], { default: "desc" });
      expect(config.defaultValue).toBe("desc");
    });
  });

  describe("array", () => {
    it("isArray true, filters invalid values", () => {
      const config = presetEnum(["asc", "desc"], { array: true });
      expect(config.isArray).toBe(true);
      expect(config.decode(["asc", "invalid", "desc"])).toEqual(["asc", "desc"]);
    });
  });

  describe("array with maxItems", () => {
    it("slices to maxItems", () => {
      const config = presetEnum(["asc", "desc"], { array: true, maxItems: 2 });
      expect(config.decode(["asc", "desc", "asc"])).toEqual(["asc", "desc"]);
    });
  });
});

describe("tuple", () => {
  describe("basic [string, integer]", () => {
    it("decode from array", () => {
      const config = tuple([string(), integer()]);
      expect(config.decode(["hello", "42"])).toEqual(["hello", 42]);
    });

    it("defaultValue is combined defaults", () => {
      const config = tuple([string(), integer()]);
      expect(config.defaultValue[0]).toBe("");
      expect(config.defaultValue[1]).toBeNaN();
    });

    it("encode maps each element", () => {
      const config = tuple([string(), integer()]);
      expect(config.encode(["hello", 42])).toEqual(["hello", "42"]);
    });

    it("isArray is true", () => {
      const config = tuple([string(), integer()]);
      expect(config.isArray).toBe(true);
    });
  });

  describe("with optional elements", () => {
    it("defaultValue is [undefined, undefined]", () => {
      const config = tuple([string({ optional: true }), integer({ optional: true })]);
      expect(config.defaultValue).toEqual([undefined, undefined]);
    });
  });

  describe("decode per-element fallback", () => {
    it("invalid element falls back to its defaultValue, not entire tuple", () => {
      const config = tuple([string(), integer()]);
      // "abc" causes integer decode to throw → falls back to NaN for that position
      const result = config.decode(["hello", "abc"]);
      expect(result[0]).toBe("hello");
      expect(Number.isNaN(result[1])).toBe(true);
    });

    it("missing element falls back to defaultValue", () => {
      const config = tuple([float(), float()]);
      const result = config.decode(["1.5"]);
      expect(result[0]).toBe(1.5);
      expect(Number.isNaN(result[1])).toBe(true);
    });

    it("extra elements are ignored", () => {
      const config = tuple([float(), float()]);
      const result = config.decode(["1.5", "2.3", "99"]);
      expect(result).toEqual([1.5, 2.3]);
    });
  });

  describe("encode preserves positions", () => {
    it("uses empty string sentinel for undefined encoded values", () => {
      const config = tuple([string(), integer()]);
      // NaN encodes to undefined for integer, replaced with "" to preserve position
      expect(config.encode(["hello", Number.NaN])).toEqual(["hello", ""]);
    });

    it("preserves all positions in a 3-element tuple", () => {
      const config = tuple([integer(), string(), integer()]);
      // First integer is NaN, but position is preserved
      expect(config.encode([Number.NaN, "world", 42])).toEqual(["", "world", "42"]);
    });

    it("element without encode falls back to String(val)", () => {
      const bareConfig = { decode: (v: unknown) => Number(v), defaultValue: 0 };
      const config = tuple([bareConfig, string()]);
      expect(config.encode([42, "hello"])).toEqual(["42", "hello"]);
    });

    it("element without encode: nil value falls back to String(val)", () => {
      const bareConfig = { decode: (v: unknown) => Number(v), defaultValue: 0 };
      const config = tuple([bareConfig]);
      // String(undefined) → "undefined" — no special nil handling in fallback encode
      expect(config.encode([undefined as any])).toEqual(["undefined"]);
    });
  });

  describe("no .optional or .array on result", () => {
    it("result has no optional or array properties", () => {
      const config = tuple([string(), integer()]);
      expect("optional" in config).toBe(false);
      expect("array" in config).toBe(false);
    });
  });

  describe("resolve composition", () => {
    it("no resolve when no element has resolve", () => {
      const config = tuple([string(), integer()]);
      expect("resolve" in config).toBe(false);
    });

    it("composes resolve from elements with resolve", () => {
      const numInputConfig = integer({ numInput: true, default: 1 });
      const config = tuple([string(), numInputConfig]);
      expect("resolve" in config).toBe(true);
      const resolved = config.resolve(["hello", "42"]);
      expect(resolved[0]).toBe("hello");
      expect(resolved[1]).toBe(42);
    });

    it("resolve passes through elements without resolve", () => {
      const numInputConfig = integer({ numInput: true, default: 0 });
      const config = tuple([string(), numInputConfig, boolean()]);
      expect("resolve" in config).toBe(true);
      const resolved = config.resolve(["hello", "5", true]);
      expect(resolved[0]).toBe("hello");
      expect(resolved[1]).toBe(5);
      expect(resolved[2]).toBe(true);
    });

    it("resolve handles empty numInput string", () => {
      const numInputConfig = integer({ numInput: true, default: 1 });
      const config = tuple([string(), numInputConfig]);
      const resolved = config.resolve(["hello", ""]);
      expect(resolved[0]).toBe("hello");
      expect(resolved[1]).toBe(1);
    });
  });
});

describe("integration: presets + stores", () => {
  function makeQs(search: string) {
    const qsUtils = createQsUtils();
    // Simulate URL
    qsUtils._$internalSearch.set(search);
    return qsUtils;
  }

  describe("integer({ default: 1 }) through store", () => {
    it("absent → $value is 1 (default)", () => {
      const qs = makeQs("");
      const store = qs.createSearchParamStore("page", integer({ default: 1, min: 1 }));
      expect(store.$value.get()).toBe(1);
    });

    it("?page=abc → decode throws → fallback to 1", () => {
      const qs = makeQs("?page=abc");
      const store = qs.createSearchParamStore("page", integer({ default: 1, min: 1 }));
      expect(store.$value.get()).toBe(1);
    });

    it("?page=5 → $value is 5", () => {
      const qs = makeQs("?page=5");
      const store = qs.createSearchParamStore("page", integer({ default: 1, min: 1 }));
      expect(store.$value.get()).toBe(5);
    });

    it("?page=0 → clamped to 1", () => {
      const qs = makeQs("?page=0");
      const store = qs.createSearchParamStore("page", integer({ default: 1, min: 1 }));
      expect(store.$value.get()).toBe(1);
    });
  });

  describe("numInput through store", () => {
    it("absent → $value is '', $resolved is default", () => {
      const qs = makeQs("");
      const store = qs.createSearchParamStore(
        "page",
        integer({ numInput: true, default: 1, min: 1 }),
      );
      expect(store.$value.get()).toBe("");
      expect(store.$resolved.get()).toBe(1);
    });

    it("?page=42 → $value is '42', $resolved is 42", () => {
      const qs = makeQs("?page=42");
      const store = qs.createSearchParamStore(
        "page",
        integer({ numInput: true, default: 1, min: 1 }),
      );
      expect(store.$value.get()).toBe("42");
      expect(store.$resolved.get()).toBe(42);
    });

    it("?page=abc → $value is 'abc' (raw), $resolved falls back to 1", () => {
      const qs = makeQs("?page=abc");
      const store = qs.createSearchParamStore(
        "page",
        integer({ numInput: true, default: 1, min: 1 }),
      );
      expect(store.$value.get()).toBe("abc");
      expect(store.$resolved.get()).toBe(1);
    });
  });

  describe("$resolved identity", () => {
    it("no resolve → $resolved === $value (same reference)", () => {
      const qs = makeQs("");
      const store = qs.createSearchParamStore("q", string());
      expect(store.$resolved).toBe(store.$value);
    });

    it("with resolve → $resolved !== $value", () => {
      const qs = makeQs("");
      const store = qs.createSearchParamStore("page", integer({ numInput: true, default: 1 }));
      expect(store.$resolved).not.toBe(store.$value);
    });
  });

  describe("multi-param store with mixed resolve", () => {
    it("$resolved maps numInput to number, passes through others", () => {
      const qs = makeQs("?page=3&q=hello");
      const store = qs.createSearchParamsStore({
        page: integer({ numInput: true, default: 1, min: 1 }),
        q: string(),
      });
      const values = store.$values.get();
      const resolved = store.$resolved.get();

      expect(values.page).toBe("3");
      expect(values.q).toBe("hello");
      expect(resolved.page).toBe(3);
      expect(resolved.q).toBe("hello");
    });

    it("no resolve configs → $resolved === $values", () => {
      const qs = makeQs("");
      const store = qs.createSearchParamsStore({
        q: string(),
        sort: presetEnum(["asc", "desc"]),
      });
      expect(store.$resolved).toBe(store.$values);
    });
  });

  describe("boolean({ default: true }) through store", () => {
    it("absent → true", () => {
      const qs = makeQs("");
      const store = qs.createSearchParamStore("archived", boolean({ default: true }));
      expect(store.$value.get()).toBe(true);
    });

    it("?archived=false → false", () => {
      const qs = makeQs("?archived=false");
      const store = qs.createSearchParamStore("archived", boolean({ default: true }));
      expect(store.$value.get()).toBe(false);
    });

    it("?archived=foo → throws → fallback to true", () => {
      const qs = makeQs("?archived=foo");
      const store = qs.createSearchParamStore("archived", boolean({ default: true }));
      expect(store.$value.get()).toBe(true);
    });
  });

  describe("encode/decode round-trip consistency", () => {
    it("integer encode clamps like decode (C-3)", () => {
      const config = integer({ default: 0, min: 1, max: 10 });
      // encode should clamp 15 → 10, not pass through as "15"
      expect(config.encode(15 as any)).toBe("10");
      expect(config.encode(0 as any)).toBe("1");
    });

    it("float encode clamps like decode (C-3)", () => {
      const config = float({ default: 0, min: 0, max: 1, fixed: 2 });
      expect(config.encode(1.5 as any)).toBe("1.00");
      expect(config.encode(-0.5 as any)).toBe("0.00");
    });

    it("string encode enforces maxLength like decode (C-3)", () => {
      const config = string({ maxLength: 3, default: "" });
      expect(config.encode("abcdef")).toBe("abc");
    });

    it("string encode with outOfRange reject returns undefined (C-3)", () => {
      const config = string({ maxLength: 3, outOfRange: "reject", default: "" });
      expect(config.encode("abcdef")).toBeUndefined();
    });
  });

  describe("array maxItems in encode (I-2)", () => {
    it("integer array encode caps to maxItems", () => {
      const config = integer({ array: true, maxItems: 2 });
      expect(config.encode([1, 2, 3])).toEqual(["1", "2"]);
    });

    it("boolean array encode caps to maxItems", () => {
      const config = boolean({ array: true, maxItems: 1 });
      expect(config.encode([true, false, true])).toEqual(["true"]);
    });
  });

  describe("enum empty array guard (I-3)", () => {
    it("throws on empty enum array", () => {
      expect(() => presetEnum([])).toThrow("enum array must not be empty");
    });
  });
});

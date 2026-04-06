import { describe, expect, it } from "vitest";

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

    it("decode: 'anything' → false (lenient)", () => {
      const config = boolean();
      expect(config.decode("anything")).toBe(false);
    });

    it("decode: '' → false", () => {
      const config = boolean();
      expect(config.decode("")).toBe(false);
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

  describe("decode error propagation", () => {
    it("any element throw causes entire tuple to throw", () => {
      const config = tuple([string(), integer()]);
      // "abc" will cause integer decode to throw
      expect(() => config.decode(["hello", "abc"])).toThrow();
    });
  });

  describe("encode skips nil values", () => {
    it("filters out undefined encoded values", () => {
      const config = tuple([string(), integer()]);
      // NaN encodes to undefined for integer, so it gets filtered
      expect(config.encode(["hello", Number.NaN])).toEqual(["hello"]);
    });
  });

  describe("no .optional or .array on result", () => {
    it("result has no optional or array properties", () => {
      const config = tuple([string(), integer()]);
      expect("optional" in config).toBe(false);
      expect("array" in config).toBe(false);
    });
  });
});

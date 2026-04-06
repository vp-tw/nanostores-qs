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
  ymd,
} from "./presets";
import * as presets from "./presets";

describe("createPreset", () => {
  const preset = createPreset({
    decode: (value: unknown): number => {
      const n = Number(value);
      if (Number.isNaN(n)) throw new Error("invalid number");
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

  describe("default encode (no custom encode)", () => {
    const noEncode = createPreset({
      decode: (v: unknown) => String(v),
      defaultValue: "",
    });

    it("falls back to String()", () => {
      expect(noEncode.encode(42 as any)).toBe("42");
    });
  });

  describe("default", () => {
    it("returns config with custom defaultValue", () => {
      const withDefault = preset.default(42);
      expect(withDefault.defaultValue).toBe(42);
      expect(withDefault.decode("10")).toBe(10);
      expect(withDefault.encode(10)).toBe("10");
    });

    it("has no .optional or .array", () => {
      const withDefault = preset.default(0);
      expect("optional" in withDefault).toBe(false);
      expect("array" in withDefault).toBe(false);
    });
  });
});

describe("preset .default() on built-ins", () => {
  it("integer.default(1)", () => {
    const d = integer.default(1);
    expect(d.defaultValue).toBe(1);
    expect(d.decode("5")).toBe(5);
  });

  it("integer.ceil.default(0)", () => {
    const d = integer.ceil.default(0);
    expect(d.defaultValue).toBe(0);
    expect(d.decode("3.2")).toBe(4);
  });

  it("float.fixed(2).default(0)", () => {
    const d = float.fixed(2).default(0);
    expect(d.defaultValue).toBe(0);
    expect(d.decode("3.14")).toBe(3.14);
  });

  it("string.default('all')", () => {
    const d = string.default("all");
    expect(d.defaultValue).toBe("all");
  });
});

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

  it("optional: no defaultValue", () => {
    expect("defaultValue" in float.optional).toBe(false);
  });

  it("array: filters invalid", () => {
    expect(float.array.decode(["1.5", "abc", "2.7"])).toEqual([1.5, 2.7]);
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

  it("optional: no defaultValue", () => {
    expect("defaultValue" in date.optional).toBe(false);
  });

  it("array: filters invalid", () => {
    const result = date.array.decode([
      "2024-01-15T00:00:00.000Z",
      "invalid",
      "2024-06-01T00:00:00.000Z",
    ]);
    expect(result).toHaveLength(2);
    expect(result[0]!.toISOString()).toBe("2024-01-15T00:00:00.000Z");
    expect(result[1]!.toISOString()).toBe("2024-06-01T00:00:00.000Z");
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

  it("optional: no defaultValue", () => {
    expect("defaultValue" in ymd.optional).toBe(false);
  });

  it("array: filters invalid", () => {
    expect(ymd.array.decode(["2024-01-15", "invalid", "2024-06-01"])).toEqual([
      "2024-01-15",
      "2024-06-01",
    ]);
  });
});

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

  it("encodes value as-is", () => {
    expect(sorting.encode("asc")).toBe("asc");
    expect(sorting.encode("desc")).toBe("desc");
  });

  it("optional: no defaultValue", () => {
    expect("defaultValue" in sorting.optional).toBe(false);
  });

  it("array: filters invalid", () => {
    expect(sorting.array.decode(["asc", "invalid", "desc"])).toEqual(["asc", "desc"]);
  });
});

describe("presets.hms", () => {
  it("base: defaultValue", () => {
    expect(hms.defaultValue).toBe("00:00:00");
  });

  it("decodes valid format", () => {
    expect(hms.decode("14:30:00")).toBe("14:30:00");
    expect(hms.decode("00:00:00")).toBe("00:00:00");
    expect(hms.decode("23:59:59")).toBe("23:59:59");
  });

  it("throws on invalid format", () => {
    expect(() => hms.decode("not-a-time")).toThrow();
    expect(() => hms.decode("14:30")).toThrow();
    expect(() => hms.decode("25:00:00")).toThrow();
  });

  it("optional: no defaultValue", () => {
    expect("defaultValue" in hms.optional).toBe(false);
  });

  it("array: filters invalid", () => {
    expect(hms.array.decode(["14:30:00", "invalid", "08:00:00"])).toEqual(["14:30:00", "08:00:00"]);
  });
});

describe("presets.tuple", () => {
  it("decodes comma-separated values", () => {
    const t = presets.tuple([presets.string, presets.integer]);
    expect(t.decode("hello,42")).toEqual(["hello", 42]);
  });

  it("default value from element defaults", () => {
    const t = presets.tuple([presets.string, presets.integer]);
    expect(t.defaultValue[0]).toBe("");
    expect(Number.isNaN(t.defaultValue[1])).toBe(true);
  });

  it("encodes to comma-separated", () => {
    const t = presets.tuple([presets.string, presets.integer]);
    expect(t.encode(["hello", 42])).toBe("hello,42");
  });

  it("custom separator", () => {
    const t = presets.tuple([presets.string, presets.integer], { separator: ":" });
    expect(t.decode("hello:42")).toEqual(["hello", 42]);
    expect(t.encode(["hello", 42])).toBe("hello:42");
  });

  it("with optional elements", () => {
    const t = presets.tuple([presets.string.optional, presets.integer.optional]);
    expect(t.defaultValue).toEqual([undefined, undefined]);
  });

  it("entire tuple falls back on decode error", () => {
    const t = presets.tuple([presets.string, presets.integer]);
    // integer decode of "abc" throws -> entire tuple fails
    expect(() => t.decode("hello,abc")).toThrow();
  });

  it("no .optional or .array", () => {
    const t = presets.tuple([presets.string, presets.integer]);
    expect("optional" in t).toBe(false);
    expect("array" in t).toBe(false);
  });
});

import { describe, expect, it } from "vitest";

import { boolean, createPreset, integer, string } from "./presets";

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

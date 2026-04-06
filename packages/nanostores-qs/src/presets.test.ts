import { describe, expect, it } from "vitest";

import { createPreset } from "./presets";

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

import { describe, expect, it } from "vitest";

import { createPreset } from "./presets";

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

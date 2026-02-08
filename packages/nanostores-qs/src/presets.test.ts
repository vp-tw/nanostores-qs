import { isNil } from "es-toolkit";
import { beforeEach, describe, expect, it } from "vitest";

import { defineSearchParam } from "./defineSearchParam";
import { createQsUtils } from "./main";
import {
  presetBoolean,
  presetBooleanOptional,
  presetDate,
  presetDateArray,
  presetDateOptional,
  presetEnum,
  presetEnumArray,
  presetEnumOptional,
  presetFloat,
  presetFloatArray,
  presetFloatOptional,
  presetInt,
  presetIntArray,
  presetIntOptional,
  presetString,
  presetStringArray,
  presetStringOptional,
} from "./presets";

// Helper: `setEncode` returns `TConfig` at the type level (for inference),
// but the runtime object has an `encode` property. Cast to access it in tests.
const encode = (preset: any) => preset.encode as (...args: Array<any>) => any;

// ──────────────────────────────────────────────
// Part A: Pure unit tests (decode / encode)
// ──────────────────────────────────────────────

describe("pure unit tests", () => {
  describe("presetString", () => {
    it("has defaultValue of empty string", () => {
      expect(presetString.defaultValue).toBe("");
    });
  });

  describe("presetStringOptional", () => {
    it("is undefined", () => {
      expect(presetStringOptional).toBeUndefined();
    });
  });

  describe("presetInt decode", () => {
    it("decodes valid integers", () => {
      expect(presetInt.decode("42")).toBe(42);
      expect(presetInt.decode("0")).toBe(0);
      expect(presetInt.decode("-5")).toBe(-5);
    });

    it("decodes invalid values as NaN", () => {
      expect(Number.isNaN(presetInt.decode("abc"))).toBe(true);
      expect(Number.isNaN(presetInt.decode(""))).toBe(true);
      expect(Number.isNaN(presetInt.decode("NaN"))).toBe(true);
    });

    it("truncates floats", () => {
      expect(presetInt.decode("3.7")).toBe(3);
    });
  });

  describe("presetInt encode", () => {
    it("encodes numbers to strings", () => {
      expect(encode(presetInt)(5)).toBe("5");
      expect(encode(presetInt)(0)).toBe("0");
      expect(encode(presetInt)(-3)).toBe("-3");
    });

    it("encodes NaN as undefined", () => {
      expect(encode(presetInt)(Number.NaN)).toBeUndefined();
    });

    it("encodes nil as undefined", () => {
      expect(encode(presetInt)(undefined)).toBeUndefined();
      expect(encode(presetInt)(null)).toBeUndefined();
    });
  });

  describe("presetIntOptional decode", () => {
    it("decodes valid integers", () => {
      expect(presetIntOptional.decode("20")).toBe(20);
    });

    it("decodes invalid as undefined", () => {
      expect(presetIntOptional.decode("abc")).toBeUndefined();
      expect(presetIntOptional.decode("NaN")).toBeUndefined();
    });
  });

  describe("presetIntArray decode", () => {
    it("filters invalid integers", () => {
      expect(presetIntArray.decode(["1", "abc", "2", "", "3"])).toEqual([1, 2, 3]);
    });

    it("returns empty for all invalid", () => {
      expect(presetIntArray.decode(["abc", ""])).toEqual([]);
    });
  });

  describe("presetIntArray encode", () => {
    it("encodes valid numbers", () => {
      expect(encode(presetIntArray)([1, 2, 3])).toEqual(["1", "2", "3"]);
    });

    it("filters NaN values", () => {
      expect(encode(presetIntArray)([1, Number.NaN, 2])).toEqual(["1", "2"]);
    });
  });

  describe("presetFloat decode", () => {
    it("decodes valid floats", () => {
      expect(presetFloat.decode("1.5")).toBe(1.5);
      expect(presetFloat.decode("0")).toBe(0);
      expect(presetFloat.decode("-2.3")).toBe(-2.3);
    });

    it("decodes invalid as NaN", () => {
      expect(Number.isNaN(presetFloat.decode("abc"))).toBe(true);
      expect(Number.isNaN(presetFloat.decode(""))).toBe(true);
    });
  });

  describe("presetFloat encode", () => {
    it("encodes numbers to strings", () => {
      expect(encode(presetFloat)(1.5)).toBe("1.5");
    });

    it("encodes NaN as undefined", () => {
      expect(encode(presetFloat)(Number.NaN)).toBeUndefined();
    });
  });

  describe("presetFloatOptional decode", () => {
    it("decodes valid floats", () => {
      expect(presetFloatOptional.decode("1.2")).toBe(1.2);
    });

    it("decodes invalid as undefined", () => {
      expect(presetFloatOptional.decode("abc")).toBeUndefined();
    });
  });

  describe("presetFloatArray decode", () => {
    it("filters invalid floats", () => {
      expect(presetFloatArray.decode(["1.5", "abc", "2.7", "", "NaN", "3.14"])).toEqual([
        1.5, 2.7, 3.14,
      ]);
    });
  });

  describe("presetFloatArray encode", () => {
    it("encodes valid numbers and skips NaN", () => {
      expect(encode(presetFloatArray)([0.1, 0.2, Number.NaN])).toEqual(["0.1", "0.2"]);
    });
  });

  describe("presetBoolean decode", () => {
    it("decodes truthy values as true", () => {
      expect(presetBoolean.decode("true")).toBe(true);
      expect(presetBoolean.decode("1")).toBe(true);
      expect(presetBoolean.decode("anything")).toBe(true);
    });

    it("decodes falsy values as false", () => {
      expect(presetBoolean.decode("")).toBe(false);
      expect(presetBoolean.decode(undefined)).toBe(false);
    });
  });

  describe("presetBoolean encode", () => {
    it("encodes true as 'true'", () => {
      expect(encode(presetBoolean)(true)).toBe("true");
    });

    it("encodes false as undefined (omit)", () => {
      expect(encode(presetBoolean)(false)).toBeUndefined();
    });
  });

  describe("presetBooleanOptional decode", () => {
    it("decodes 'true' as true", () => {
      expect(presetBooleanOptional.decode("true")).toBe(true);
    });

    it("decodes 'false' as false", () => {
      expect(presetBooleanOptional.decode("false")).toBe(false);
    });

    it("decodes other values as undefined", () => {
      expect(presetBooleanOptional.decode("abc")).toBeUndefined();
      expect(presetBooleanOptional.decode("1")).toBeUndefined();
      expect(presetBooleanOptional.decode("")).toBeUndefined();
    });
  });

  describe("presetBooleanOptional encode", () => {
    it("encodes true as 'true'", () => {
      expect(encode(presetBooleanOptional)(true)).toBe("true");
    });

    it("encodes false as 'false'", () => {
      expect(encode(presetBooleanOptional)(false)).toBe("false");
    });

    it("encodes undefined as undefined", () => {
      expect(encode(presetBooleanOptional)(undefined)).toBeUndefined();
    });
  });

  describe("presetEnum decode", () => {
    const colors = ["red", "green", "blue"] as const;
    const preset = presetEnum(colors);

    it("decodes valid enum values", () => {
      expect(preset.decode("green")).toBe("green");
    });

    it("falls back to first for invalid", () => {
      expect(preset.decode("yellow")).toBe("red");
      expect(preset.decode("")).toBe("red");
    });

    it("has defaultValue of first element", () => {
      expect(preset.defaultValue).toBe("red");
    });
  });

  describe("presetEnumOptional decode", () => {
    const colors = ["red", "green", "blue"] as const;
    const preset = presetEnumOptional(colors);

    it("decodes valid enum values", () => {
      expect(preset.decode("blue")).toBe("blue");
    });

    it("returns undefined for invalid", () => {
      expect(preset.decode("yellow")).toBeUndefined();
    });
  });

  describe("presetEnumArray decode", () => {
    const colors = ["red", "green", "blue"] as const;
    const preset = presetEnumArray(colors);

    it("filters invalid enum values", () => {
      expect(preset.decode(["red", "yellow", "blue"])).toEqual(["red", "blue"]);
    });

    it("returns empty for all invalid", () => {
      expect(preset.decode(["yellow", "purple"])).toEqual([]);
    });
  });

  describe("presetDate decode", () => {
    it("decodes valid ISO string", () => {
      const date = presetDate.decode("2023-01-02T03:04:05.000Z");
      expect(date.getTime()).toBe(new Date("2023-01-02T03:04:05.000Z").getTime());
    });

    it("returns invalid date for invalid string", () => {
      const date = presetDate.decode("invalid");
      expect(Number.isNaN(date.getTime())).toBe(true);
    });
  });

  describe("presetDate encode", () => {
    it("encodes valid date as ISO string", () => {
      const date = new Date("2023-01-02T03:04:05.000Z");
      expect(encode(presetDate)(date)).toBe("2023-01-02T03:04:05.000Z");
    });

    it("encodes invalid date as undefined", () => {
      expect(encode(presetDate)(new Date("invalid"))).toBeUndefined();
    });

    it("encodes nil as undefined", () => {
      expect(encode(presetDate)(undefined)).toBeUndefined();
      expect(encode(presetDate)(null)).toBeUndefined();
    });
  });

  describe("presetDateOptional decode", () => {
    it("decodes valid ISO string", () => {
      const date = presetDateOptional.decode("2023-01-02T03:04:05.000Z");
      expect(date!.getTime()).toBe(new Date("2023-01-02T03:04:05.000Z").getTime());
    });

    it("returns undefined for invalid string", () => {
      expect(presetDateOptional.decode("invalid")).toBeUndefined();
    });
  });

  describe("presetDateArray decode", () => {
    it("filters invalid dates", () => {
      const result = presetDateArray.decode([
        "2024-01-01T00:00:00.000Z",
        "invalid",
        "2024-06-01T12:00:00.000Z",
      ]);
      expect(result).toEqual([
        new Date("2024-01-01T00:00:00.000Z"),
        new Date("2024-06-01T12:00:00.000Z"),
      ]);
    });
  });

  describe("presetDateArray encode", () => {
    it("encodes valid dates and skips invalid", () => {
      const date1 = new Date("2024-01-01T00:00:00.000Z");
      const date2 = new Date("invalid");
      expect(encode(presetDateArray)([date1, date2])).toEqual(["2024-01-01T00:00:00.000Z"]);
    });
  });
});

// ──────────────────────────────────────────────
// Part B: Integration tests (decode via _$internalSearch, encode via .dry)
// ──────────────────────────────────────────────

describe("presetString integration", () => {
  const qsUtils = createQsUtils();
  beforeEach(() => qsUtils._$internalSearch.set(""));
  it("decodes from URL and encodes via dry", () => {
    const store = qsUtils.createSearchParamStore("q", presetString);
    expect(store.$value.get()).toBeUndefined();
    expect(store.update.dry("hello")).toBe("?q=hello");
    expect(store.update.dry("")).toBe("");
  });
});

describe("presetStringArray integration", () => {
  const qsUtils = createQsUtils();
  beforeEach(() => qsUtils._$internalSearch.set(""));
  it("encodes array via dry and removes when empty", () => {
    const store = qsUtils.createSearchParamStore("tag", presetStringArray);
    expect(store.update.dry(["a", "b"])).toBe("?tag=a&tag=b");
    expect(store.update.dry([])).toBe("");
  });
});

describe("presetBoolean integration", () => {
  const qsUtils = createQsUtils();
  beforeEach(() => qsUtils._$internalSearch.set(""));
  it("encodes true as 'true' and omits false", () => {
    const store = qsUtils.createSearchParamStore("b", presetBoolean);
    expect(store.$value.get()).toBe(false); // default
    expect(store.update.dry(true)).toBe("?b=true");
    expect(store.update.dry(false)).toBe("");
  });
});

describe("presetBooleanOptional integration", () => {
  const qsUtils = createQsUtils();
  beforeEach(() => qsUtils._$internalSearch.set(""));
  it("handles true/false/undefined", () => {
    const store = qsUtils.createSearchParamStore("b", presetBooleanOptional);
    expect(store.$value.get()).toBeUndefined();
    qsUtils._$internalSearch.set("?b=true");
    expect(store.$value.get()).toBe(true);
    qsUtils._$internalSearch.set("?b=false");
    expect(store.$value.get()).toBe(false);
    qsUtils._$internalSearch.set("?b=abc");
    expect(store.$value.get()).toBeUndefined();
    qsUtils._$internalSearch.set("");
    expect(store.update.dry(true)).toBe("?b=true");
    expect(store.update.dry(false)).toBe("?b=false");
    expect(store.update.dry(undefined)).toBe("");
  });
});

describe("presetInt integration", () => {
  const qsUtils = createQsUtils();
  beforeEach(() => qsUtils._$internalSearch.set(""));
  it("decodes invalid to NaN and removes when NaN", () => {
    const store = qsUtils.createSearchParamStore("n", presetInt);
    qsUtils._$internalSearch.set("?n=10");
    expect(store.$value.get()).toBe(10);
    qsUtils._$internalSearch.set("?n=abc");
    expect(Number.isNaN(store.$value.get())).toBe(true);
    qsUtils._$internalSearch.set("");
    expect(store.update.dry(5)).toBe("?n=5");
    expect(store.update.dry(Number.NaN)).toBe("");
  });
});

describe("presetIntOptional integration", () => {
  const qsUtils = createQsUtils();
  beforeEach(() => qsUtils._$internalSearch.set(""));
  it("treats invalid as undefined and removes undefined", () => {
    const store = qsUtils.createSearchParamStore("n", presetIntOptional);
    expect(store.$value.get()).toBeUndefined();
    qsUtils._$internalSearch.set("?n=20");
    expect(store.$value.get()).toBe(20);
    qsUtils._$internalSearch.set("?n=NaN");
    expect(store.$value.get()).toBeUndefined();
    qsUtils._$internalSearch.set("");
    expect(store.update.dry(30)).toBe("?n=30");
    expect(store.update.dry(undefined)).toBe("");
  });
});

describe("presetIntArray integration", () => {
  const qsUtils = createQsUtils();
  beforeEach(() => qsUtils._$internalSearch.set(""));
  it("filters invalid integers on decode and encodes via dry", () => {
    const store = qsUtils.createSearchParamStore("n", presetIntArray);
    qsUtils._$internalSearch.set("?n=1&n=abc&n=2&n=&n=3");
    expect(store.$value.get()).toEqual([1, 2, 3]);
    expect(store.update.dry([4, 5])).toBe("?n=4&n=5");
    expect(store.update.dry([4, Number.NaN])).toBe("?n=4");
  });
});

describe("presetFloat integration", () => {
  const qsUtils = createQsUtils();
  beforeEach(() => qsUtils._$internalSearch.set(""));
  it("decodes, encodes and removes float param", () => {
    const store = qsUtils.createSearchParamStore("v", presetFloat);
    qsUtils._$internalSearch.set("?v=1.5");
    expect(store.$value.get()).toEqual(1.5);
    expect(store.update.dry(2.7)).toBe("?v=2.7");
    expect(store.update.dry(Number.NaN)).toBe("");
  });
});

describe("presetFloatOptional integration", () => {
  const qsUtils = createQsUtils();
  beforeEach(() => qsUtils._$internalSearch.set(""));
  it("treats invalid float as undefined", () => {
    const store = qsUtils.createSearchParamStore("f", presetFloatOptional);
    qsUtils._$internalSearch.set("?f=1.2");
    expect(store.$value.get()).toBe(1.2);
    qsUtils._$internalSearch.set("?f=abc");
    expect(store.$value.get()).toBeUndefined();
    qsUtils._$internalSearch.set("");
    expect(store.update.dry(3.4)).toBe("?f=3.4");
    expect(store.update.dry(undefined)).toBe("");
  });
});

describe("presetFloatArray integration", () => {
  const qsUtils = createQsUtils();
  beforeEach(() => qsUtils._$internalSearch.set(""));
  it("filters invalid, encodes array and skips NaN items", () => {
    const store = qsUtils.createSearchParamStore("v", presetFloatArray);
    qsUtils._$internalSearch.set("?v=1.5&v=abc&v=2.7&v=&v=NaN&v=3.14");
    expect(store.$value.get()).toEqual([1.5, 2.7, 3.14]);
    expect(store.update.dry([0.1, 0.2])).toBe("?v=0.1&v=0.2");
    expect(store.update.dry([0.1, 0.2, Number.NaN])).toBe("?v=0.1&v=0.2");
  });
});

describe("presetEnum & presetEnumOptional & presetEnumArray integration", () => {
  const colors = ["red", "green", "blue"] as ["red", "green", "blue"];
  const enumPreset = presetEnum(colors);
  const enumOptPreset = presetEnumOptional(colors);
  const enumArrPreset = presetEnumArray(colors);
  const qsUtils = createQsUtils();
  beforeEach(() => qsUtils._$internalSearch.set(""));
  it("enum falls back to first value for invalid", () => {
    const store = qsUtils.createSearchParamStore("c", enumPreset);
    expect(store.$value.get()).toBe("red");
    qsUtils._$internalSearch.set("?c=green");
    expect(store.$value.get()).toBe("green");
    qsUtils._$internalSearch.set("?c=yellow");
    expect(store.$value.get()).toBe("red");
  });
  it("optional enum returns undefined for invalid", () => {
    const store = qsUtils.createSearchParamStore("co", enumOptPreset);
    expect(store.$value.get()).toBeUndefined();
    qsUtils._$internalSearch.set("?co=blue");
    expect(store.$value.get()).toBe("blue");
    qsUtils._$internalSearch.set("?co=yellow");
    expect(store.$value.get()).toBeUndefined();
  });
  it("enum array encodes and decodes", () => {
    const store = qsUtils.createSearchParamStore("ca", enumArrPreset);
    qsUtils._$internalSearch.set("?ca=red&ca=yellow&ca=blue");
    expect(store.$value.get()).toEqual(["red", "blue"]);
    expect(store.update.dry(["green", "blue"])).toBe("?ca=green&ca=blue");
    expect(store.update.dry([])).toBe("");
  });
});

describe("presetDate integration", () => {
  const qsUtils = createQsUtils();
  beforeEach(() => qsUtils._$internalSearch.set(""));
  it("parses valid ISO; invalid yields invalid date; encodes via dry", () => {
    const store = qsUtils.createSearchParamStore("d", presetDate);
    const date = new Date("2023-01-02T03:04:05.000Z");
    expect(store.update.dry(date)).toBe(`?d=${encodeURIComponent("2023-01-02T03:04:05.000Z")}`);
    qsUtils._$internalSearch.set("?d=invalid");
    const storedDate = store.$value.get();
    expect(storedDate instanceof Date).toBe(true);
    expect(Number.isNaN(storedDate.getTime())).toBe(true);
    expect(store.update.dry(new Date("2024-05-06T07:08:09.000Z"))).toBe(
      `?d=${encodeURIComponent("2024-05-06T07:08:09.000Z")}`,
    );
    qsUtils._$internalSearch.set("");
    expect(store.update.dry(new Date("invalid"))).toBe("");
  });
});

describe("presetDateOptional integration", () => {
  const qsUtils = createQsUtils();
  beforeEach(() => qsUtils._$internalSearch.set(""));
  it("parses valid ISO; invalid yields undefined", () => {
    const store = qsUtils.createSearchParamStore("d", presetDateOptional);
    const date = new Date("2023-01-02T03:04:05.000Z");
    expect(store.update.dry(date)).toBe(`?d=${encodeURIComponent("2023-01-02T03:04:05.000Z")}`);
    qsUtils._$internalSearch.set("?d=invalid");
    expect(store.$value.get()).toBeUndefined();
    expect(store.update.dry(undefined)).toBe("");
  });
});

describe("presetDateArray integration", () => {
  const qsUtils = createQsUtils();
  beforeEach(() => qsUtils._$internalSearch.set(""));
  it("filters invalid dates on decode and encodes ISO strings via dry", () => {
    const store = qsUtils.createSearchParamStore("d", presetDateArray);
    const date1 = new Date("2024-01-01T00:00:00.000Z");
    const date2 = new Date("2024-06-01T12:00:00.000Z");
    const search = store.update.dry([date1, date2]);
    expect((search.match(/d=/g) ?? []).length).toBe(2);
    qsUtils._$internalSearch.set(
      `?d=${encodeURIComponent(date1.toISOString())}&d=invalid&d=${encodeURIComponent(date2.toISOString())}`,
    );
    expect(store.$value.get()).toEqual([date1, date2]);
    expect(store.update.dry([date1])).toBe(`?d=${encodeURIComponent("2024-01-01T00:00:00.000Z")}`);
    expect(store.update.dry([])).toBe("");
  });
});

// ──────────────────────────────────────────────
// Part C: Custom preset tests
// ──────────────────────────────────────────────

describe("custom presets", () => {
  describe("bounded int (min/max)", () => {
    const presetBoundedInt = (min: number, max: number) =>
      defineSearchParam({
        decode: (value) => {
          const int = Number.parseInt(String(value), 10);
          if (Number.isNaN(int)) return undefined;
          return Math.max(min, Math.min(max, int));
        },
      }).setEncode((value) => {
        if (isNil(value)) return undefined;
        return String(Math.max(min, Math.min(max, value)));
      });

    it("clamps values within range", () => {
      const preset = presetBoundedInt(1, 100);
      expect(preset.decode("50")).toBe(50);
      expect(preset.decode("0")).toBe(1);
      expect(preset.decode("200")).toBe(100);
      expect(preset.decode("1")).toBe(1);
      expect(preset.decode("100")).toBe(100);
    });

    it("returns undefined for NaN", () => {
      const preset = presetBoundedInt(1, 100);
      expect(preset.decode("abc")).toBeUndefined();
    });

    it("clamps on encode", () => {
      const preset = presetBoundedInt(1, 100);
      expect(encode(preset)(50)).toBe("50");
      expect(encode(preset)(0)).toBe("1");
      expect(encode(preset)(200)).toBe("100");
    });

    it("roundtrips via integration", () => {
      const qsUtils = createQsUtils();
      qsUtils._$internalSearch.set("");
      const store = qsUtils.createSearchParamStore("page", presetBoundedInt(1, 100));
      expect(store.update.dry(50)).toBe("?page=50");
      qsUtils._$internalSearch.set("?page=50");
      expect(store.$value.get()).toBe(50);
      qsUtils._$internalSearch.set("?page=200");
      expect(store.$value.get()).toBe(100);
      qsUtils._$internalSearch.set("?page=abc");
      expect(store.$value.get()).toBeUndefined();
    });
  });

  describe("comma-separated array", () => {
    const presetCommaSeparated = defineSearchParam({
      decode: (value) =>
        String(value)
          .split(",")
          .filter((s) => s.length > 0),
      defaultValue: [] as Array<string>,
    }).setEncode((value) => (value.length === 0 ? undefined : value.join(",")));

    it("splits comma-separated values", () => {
      expect(presetCommaSeparated.decode("a,b,c")).toEqual(["a", "b", "c"]);
    });

    it("handles empty string", () => {
      expect(presetCommaSeparated.decode("")).toEqual([]);
    });

    it("encodes array to comma-separated string", () => {
      expect(encode(presetCommaSeparated)(["a", "b"])).toBe("a,b");
    });

    it("encodes empty array as undefined (omit)", () => {
      expect(encode(presetCommaSeparated)([])).toBeUndefined();
    });

    it("roundtrips via integration", () => {
      const qsUtils = createQsUtils();
      qsUtils._$internalSearch.set("");
      const store = qsUtils.createSearchParamStore("tags", presetCommaSeparated);
      // cspell:disable-next-line
      expect(store.update.dry(["react", "typescript"])).toBe("?tags=react%2Ctypescript");
      // cspell:disable-next-line
      qsUtils._$internalSearch.set("?tags=react%2Ctypescript");
      expect(store.$value.get()).toEqual(["react", "typescript"]);
      expect(store.update.dry([])).toBe("");
    });
  });

  describe("jSON object", () => {
    const presetJson = <T>(defaultValue: T) =>
      defineSearchParam({
        decode: (value) => {
          try {
            return JSON.parse(String(value)) as T;
          } catch {
            return defaultValue;
          }
        },
        defaultValue,
      }).setEncode((value) => JSON.stringify(value));

    it("parses valid JSON", () => {
      const preset = presetJson({ status: "active" });
      expect(preset.decode('{"status":"pending"}')).toEqual({ status: "pending" });
    });

    it("falls back to default for invalid JSON", () => {
      const preset = presetJson({ status: "active" });
      expect(preset.decode("not-json")).toEqual({ status: "active" });
    });

    it("encodes to JSON string", () => {
      const preset = presetJson({ status: "active" });
      expect(encode(preset)({ status: "pending" })).toBe('{"status":"pending"}');
    });

    it("roundtrips via integration", () => {
      const qsUtils = createQsUtils();
      qsUtils._$internalSearch.set("");
      const store = qsUtils.createSearchParamStore("filter", presetJson({ status: "active" }));
      const search = store.update.dry({ status: "pending" });
      qsUtils._$internalSearch.set(search);
      expect(store.$value.get()).toEqual({ status: "pending" });
      // default value gets omitted from URL
      expect(store.update.dry({ status: "active" })).toBe("");
    });
  });
});

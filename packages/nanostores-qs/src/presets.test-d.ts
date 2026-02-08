import { defineSearchParam } from "./defineSearchParam";
import { createQsUtils } from "./main";
import * as presets from "./presets";

// This file relies on TypeScript assignability checks.
// If types are incorrect, it should fail to type-check.

const anyObj: any = {};

const qs = createQsUtils();

// Float array should be Array<number>
(() => {
  const floatArrayStore = qs.createSearchParamStore("fa", presets.presetFloatArray);
  type Result = ReturnType<typeof floatArrayStore.$value.get>;
  type Expected = Array<number>;
  anyObj as Result satisfies Expected;
  anyObj as Expected satisfies Result;
})();

// String preset should be string (not string | undefined)
(() => {
  const s = qs.createSearchParamStore("s", presets.presetString);
  type Result = ReturnType<typeof s.$value.get>;
  type Expected = string;
  anyObj as Result satisfies Expected;
  anyObj as Expected satisfies Result;
})();

// Optional string should be string | undefined
(() => {
  const s = qs.createSearchParamStore("os", presets.presetStringOptional);
  type Result = ReturnType<typeof s.$value.get>;
  type Expected = string | undefined;
  anyObj as Result satisfies Expected;
  anyObj as Expected satisfies Result;
})();

// Int preset should be number
(() => {
  const s = qs.createSearchParamStore("i", presets.presetInt);
  type Result = ReturnType<typeof s.$value.get>;
  type Expected = number;
  anyObj as Result satisfies Expected;
  anyObj as Expected satisfies Result;
})();

// Optional int should be number | undefined
(() => {
  const s = qs.createSearchParamStore("io", presets.presetIntOptional);
  type Result = ReturnType<typeof s.$value.get>;
  type Expected = number | undefined;
  anyObj as Result satisfies Expected;
  anyObj as Expected satisfies Result;
})();

// Int array should be Array<number>
(() => {
  const s = qs.createSearchParamStore("ia", presets.presetIntArray);
  type Result = ReturnType<typeof s.$value.get>;
  type Expected = Array<number>;
  anyObj as Result satisfies Expected;
  anyObj as Expected satisfies Result;
})();

// Float preset should be number
(() => {
  const s = qs.createSearchParamStore("f", presets.presetFloat);
  type Result = ReturnType<typeof s.$value.get>;
  type Expected = number;
  anyObj as Result satisfies Expected;
  anyObj as Expected satisfies Result;
})();

// Optional float should be number | undefined
(() => {
  const s = qs.createSearchParamStore("fo", presets.presetFloatOptional);
  type Result = ReturnType<typeof s.$value.get>;
  type Expected = number | undefined;
  anyObj as Result satisfies Expected;
  anyObj as Expected satisfies Result;
})();

// Boolean preset should be boolean
(() => {
  const s = qs.createSearchParamStore("b", presets.presetBoolean);
  type Result = ReturnType<typeof s.$value.get>;
  type Expected = boolean;
  anyObj as Result satisfies Expected;
  anyObj as Expected satisfies Result;
})();

// Optional boolean should be boolean | undefined
(() => {
  const s = qs.createSearchParamStore("b", presets.presetBooleanOptional);
  type Result = ReturnType<typeof s.$value.get>;
  type Expected = boolean | undefined;
  anyObj as Result satisfies Expected;
  anyObj as Expected satisfies Result;
})();

// Enum array should be Array<'a' | 'b' | 'c'>
(() => {
  const e = qs.createSearchParamStore("e", presets.presetEnumArray(["a", "b", "c"] as const));
  type Result = ReturnType<typeof e.$value.get>;
  type Expected = Array<"a" | "b" | "c">;
  anyObj as Result satisfies Expected;
  anyObj as Expected satisfies Result;
})();

// Date array should be Array<Date>
(() => {
  const s = qs.createSearchParamStore("d", presets.presetDateArray);
  type Result = ReturnType<typeof s.$value.get>;
  type Expected = Array<Date>;
  anyObj as Result satisfies Expected;
  anyObj as Expected satisfies Result;
})();

// Date preset should be Date
(() => {
  const s = qs.createSearchParamStore("d", presets.presetDate);
  type Result = ReturnType<typeof s.$value.get>;
  type Expected = Date;
  anyObj as Result satisfies Expected;
  anyObj as Expected satisfies Result;
})();

// Optional date should be Date | undefined
(() => {
  const s = qs.createSearchParamStore("d", presets.presetDateOptional);
  type Result = ReturnType<typeof s.$value.get>;
  type Expected = Date | undefined;
  anyObj as Result satisfies Expected;
  anyObj as Expected satisfies Result;
})();

// String array should be Array<string>
(() => {
  const s = qs.createSearchParamStore("sa", presets.presetStringArray);
  type Result = ReturnType<typeof s.$value.get>;
  type Expected = Array<string>;
  anyObj as Result satisfies Expected;
  anyObj as Expected satisfies Result;
})();

// Enum preset should be the union type
(() => {
  const s = qs.createSearchParamStore("e", presets.presetEnum(["x", "y", "z"] as const));
  type Result = ReturnType<typeof s.$value.get>;
  type Expected = "x" | "y" | "z";
  anyObj as Result satisfies Expected;
  anyObj as Expected satisfies Result;
})();

// Optional enum should be union | undefined
(() => {
  const s = qs.createSearchParamStore("e", presets.presetEnumOptional(["x", "y", "z"] as const));
  type Result = ReturnType<typeof s.$value.get>;
  type Expected = "x" | "y" | "z" | undefined;
  anyObj as Result satisfies Expected;
  anyObj as Expected satisfies Result;
})();

// Custom preset with defineSearchParam should infer correctly
(() => {
  const customPreset = defineSearchParam({
    decode: (value) => Number.parseInt(String(value), 10),
    defaultValue: 0,
  }).setEncode((value) => String(value));
  const s = qs.createSearchParamStore("c", customPreset);
  type Result = ReturnType<typeof s.$value.get>;
  type Expected = number;
  anyObj as Result satisfies Expected;
  anyObj as Expected satisfies Result;
})();

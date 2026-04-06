import { createQsUtils } from "./main";
import * as presets from "./presets";
import { createPreset } from "./presets";

const anyObj: any = {};
const qs = createQsUtils();

// --- createPreset type inference via createSearchParamStore ---

const numberPreset = createPreset({
  decode: (v: unknown) => {
    const n = Number(v);
    if (Number.isNaN(n)) throw new Error("invalid");
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

// string preset
const stringPreset = createPreset({
  decode: (v: unknown) => String(v),
  defaultValue: "",
});

// base -> string
(() => {
  const s = qs.createSearchParamStore("s", stringPreset);
  type Result = ReturnType<typeof s.$value.get>;
  type Expected = string;
  anyObj as Result satisfies Expected;
  anyObj as Expected satisfies Result;
})();

// optional -> string | undefined
(() => {
  const s = qs.createSearchParamStore("s", stringPreset.optional);
  type Result = ReturnType<typeof s.$value.get>;
  type Expected = string | undefined;
  anyObj as Result satisfies Expected;
  anyObj as Expected satisfies Result;
})();

// array -> Array<string>
(() => {
  const s = qs.createSearchParamStore("s", stringPreset.array);
  type Result = ReturnType<typeof s.$value.get>;
  type Expected = Array<string>;
  anyObj as Result satisfies Expected;
  anyObj as Expected satisfies Result;
})();

// --- presets.string ---

// base -> string
(() => {
  const s = qs.createSearchParamStore("s", presets.string);
  type Result = ReturnType<typeof s.$value.get>;
  type Expected = string;
  anyObj as Result satisfies Expected;
  anyObj as Expected satisfies Result;
})();

// optional -> string | undefined
(() => {
  const s = qs.createSearchParamStore("s", presets.string.optional);
  type Result = ReturnType<typeof s.$value.get>;
  type Expected = string | undefined;
  anyObj as Result satisfies Expected;
  anyObj as Expected satisfies Result;
})();

// array -> Array<string>
(() => {
  const s = qs.createSearchParamStore("s", presets.string.array);
  type Result = ReturnType<typeof s.$value.get>;
  type Expected = Array<string>;
  anyObj as Result satisfies Expected;
  anyObj as Expected satisfies Result;
})();

// --- presets.integer ---

// base -> number
(() => {
  const s = qs.createSearchParamStore("i", presets.integer);
  type Result = ReturnType<typeof s.$value.get>;
  type Expected = number;
  anyObj as Result satisfies Expected;
  anyObj as Expected satisfies Result;
})();

// optional -> number | undefined
(() => {
  const s = qs.createSearchParamStore("i", presets.integer.optional);
  type Result = ReturnType<typeof s.$value.get>;
  type Expected = number | undefined;
  anyObj as Result satisfies Expected;
  anyObj as Expected satisfies Result;
})();

// array -> Array<number>
(() => {
  const s = qs.createSearchParamStore("i", presets.integer.array);
  type Result = ReturnType<typeof s.$value.get>;
  type Expected = Array<number>;
  anyObj as Result satisfies Expected;
  anyObj as Expected satisfies Result;
})();

// parse -> number
(() => {
  const s = qs.createSearchParamStore("i", presets.integer.parse);
  type Result = ReturnType<typeof s.$value.get>;
  type Expected = number;
  anyObj as Result satisfies Expected;
  anyObj as Expected satisfies Result;
})();

// parse.optional -> number | undefined
(() => {
  const s = qs.createSearchParamStore("i", presets.integer.parse.optional);
  type Result = ReturnType<typeof s.$value.get>;
  type Expected = number | undefined;
  anyObj as Result satisfies Expected;
  anyObj as Expected satisfies Result;
})();

// ceil.optional -> number | undefined
(() => {
  const s = qs.createSearchParamStore("i", presets.integer.ceil.optional);
  type Result = ReturnType<typeof s.$value.get>;
  type Expected = number | undefined;
  anyObj as Result satisfies Expected;
  anyObj as Expected satisfies Result;
})();

// floor.array -> Array<number>
(() => {
  const s = qs.createSearchParamStore("i", presets.integer.floor.array);
  type Result = ReturnType<typeof s.$value.get>;
  type Expected = Array<number>;
  anyObj as Result satisfies Expected;
  anyObj as Expected satisfies Result;
})();

// --- presets.float ---

// base -> number
(() => {
  const s = qs.createSearchParamStore("f", presets.float);
  type Result = ReturnType<typeof s.$value.get>;
  type Expected = number;
  anyObj as Result satisfies Expected;
  anyObj as Expected satisfies Result;
})();

// optional -> number | undefined
(() => {
  const s = qs.createSearchParamStore("f", presets.float.optional);
  type Result = ReturnType<typeof s.$value.get>;
  type Expected = number | undefined;
  anyObj as Result satisfies Expected;
  anyObj as Expected satisfies Result;
})();

// array -> Array<number>
(() => {
  const s = qs.createSearchParamStore("f", presets.float.array);
  type Result = ReturnType<typeof s.$value.get>;
  type Expected = Array<number>;
  anyObj as Result satisfies Expected;
  anyObj as Expected satisfies Result;
})();

// fixed(2) -> number
(() => {
  const s = qs.createSearchParamStore("f", presets.float.fixed(2));
  type Result = ReturnType<typeof s.$value.get>;
  type Expected = number;
  anyObj as Result satisfies Expected;
  anyObj as Expected satisfies Result;
})();

// fixed(2).optional -> number | undefined
(() => {
  const s = qs.createSearchParamStore("f", presets.float.fixed(2).optional);
  type Result = ReturnType<typeof s.$value.get>;
  type Expected = number | undefined;
  anyObj as Result satisfies Expected;
  anyObj as Expected satisfies Result;
})();

// fixed(2).array -> Array<number>
(() => {
  const s = qs.createSearchParamStore("f", presets.float.fixed(2).array);
  type Result = ReturnType<typeof s.$value.get>;
  type Expected = Array<number>;
  anyObj as Result satisfies Expected;
  anyObj as Expected satisfies Result;
})();

// --- presets.boolean ---

// base -> boolean
(() => {
  const s = qs.createSearchParamStore("b", presets.boolean);
  type Result = ReturnType<typeof s.$value.get>;
  type Expected = boolean;
  anyObj as Result satisfies Expected;
  anyObj as Expected satisfies Result;
})();

// optional -> boolean | undefined
(() => {
  const s = qs.createSearchParamStore("b", presets.boolean.optional);
  type Result = ReturnType<typeof s.$value.get>;
  type Expected = boolean | undefined;
  anyObj as Result satisfies Expected;
  anyObj as Expected satisfies Result;
})();

// array -> Array<boolean>
(() => {
  const s = qs.createSearchParamStore("b", presets.boolean.array);
  type Result = ReturnType<typeof s.$value.get>;
  type Expected = Array<boolean>;
  anyObj as Result satisfies Expected;
  anyObj as Expected satisfies Result;
})();

// --- presets.date ---

// base -> Date
(() => {
  const s = qs.createSearchParamStore("d", presets.date);
  type Result = ReturnType<typeof s.$value.get>;
  type Expected = Date;
  anyObj as Result satisfies Expected;
  anyObj as Expected satisfies Result;
})();

// optional -> Date | undefined
(() => {
  const s = qs.createSearchParamStore("d", presets.date.optional);
  type Result = ReturnType<typeof s.$value.get>;
  type Expected = Date | undefined;
  anyObj as Result satisfies Expected;
  anyObj as Expected satisfies Result;
})();

// array -> Array<Date>
(() => {
  const s = qs.createSearchParamStore("d", presets.date.array);
  type Result = ReturnType<typeof s.$value.get>;
  type Expected = Array<Date>;
  anyObj as Result satisfies Expected;
  anyObj as Expected satisfies Result;
})();

// --- presets.ymd ---

// base -> string
(() => {
  const s = qs.createSearchParamStore("y", presets.ymd);
  type Result = ReturnType<typeof s.$value.get>;
  type Expected = string;
  anyObj as Result satisfies Expected;
  anyObj as Expected satisfies Result;
})();

// optional -> string | undefined
(() => {
  const s = qs.createSearchParamStore("y", presets.ymd.optional);
  type Result = ReturnType<typeof s.$value.get>;
  type Expected = string | undefined;
  anyObj as Result satisfies Expected;
  anyObj as Expected satisfies Result;
})();

// array -> Array<string>
(() => {
  const s = qs.createSearchParamStore("y", presets.ymd.array);
  type Result = ReturnType<typeof s.$value.get>;
  type Expected = Array<string>;
  anyObj as Result satisfies Expected;
  anyObj as Expected satisfies Result;
})();

// --- presets.enum ---

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

// --- presets.hms ---

// base -> string
(() => {
  const s = qs.createSearchParamStore("h", presets.hms);
  type Result = ReturnType<typeof s.$value.get>;
  type Expected = string;
  anyObj as Result satisfies Expected;
  anyObj as Expected satisfies Result;
})();

// optional -> string | undefined
(() => {
  const s = qs.createSearchParamStore("h", presets.hms.optional);
  type Result = ReturnType<typeof s.$value.get>;
  type Expected = string | undefined;
  anyObj as Result satisfies Expected;
  anyObj as Expected satisfies Result;
})();

// array -> Array<string>
(() => {
  const s = qs.createSearchParamStore("h", presets.hms.array);
  type Result = ReturnType<typeof s.$value.get>;
  type Expected = Array<string>;
  anyObj as Result satisfies Expected;
  anyObj as Expected satisfies Result;
})();

// --- presets.tuple ---

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

// --- .default() type inference ---

// integer.default(1) -> number
(() => {
  const s = qs.createSearchParamStore("n", presets.integer.default(1));
  type Result = ReturnType<typeof s.$value.get>;
  type Expected = number;
  anyObj as Result satisfies Expected;
  anyObj as Expected satisfies Result;
})();

// string.default("all") -> string
(() => {
  const s = qs.createSearchParamStore("s", presets.string.default("all"));
  type Result = ReturnType<typeof s.$value.get>;
  type Expected = string;
  anyObj as Result satisfies Expected;
  anyObj as Expected satisfies Result;
})();

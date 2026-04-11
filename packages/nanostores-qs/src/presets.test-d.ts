import { createQsUtils } from "./main";
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
  const s = qs.createSearchParamStore("n", numberPreset());
  type Result = ReturnType<typeof s.$value.get>;
  type Expected = number;
  anyObj as Result satisfies Expected;
  anyObj as Expected satisfies Result;
})();

// optional -> number | undefined
(() => {
  const s = qs.createSearchParamStore("n", numberPreset({ optional: true }));
  type Result = ReturnType<typeof s.$value.get>;
  type Expected = number | undefined;
  anyObj as Result satisfies Expected;
  anyObj as Expected satisfies Result;
})();

// default(50) -> number
(() => {
  const s = qs.createSearchParamStore("n", numberPreset({ default: 50 }));
  type Result = ReturnType<typeof s.$value.get>;
  type Expected = number;
  anyObj as Result satisfies Expected;
  anyObj as Expected satisfies Result;
})();

// array -> Array<number>
(() => {
  const s = qs.createSearchParamStore("n", numberPreset({ array: true }));
  type Result = ReturnType<typeof s.$value.get>;
  type Expected = Array<number>;
  anyObj as Result satisfies Expected;
  anyObj as Expected satisfies Result;
})();

// --- integer type inference ---

// integer() -> number
(() => {
  const s = qs.createSearchParamStore("n", integer());
  type Result = ReturnType<typeof s.$value.get>;
  type Expected = number;
  anyObj as Result satisfies Expected;
  anyObj as Expected satisfies Result;
})();

// integer({ optional: true }) -> number | undefined
(() => {
  const s = qs.createSearchParamStore("n", integer({ optional: true }));
  type Result = ReturnType<typeof s.$value.get>;
  type Expected = number | undefined;
  anyObj as Result satisfies Expected;
  anyObj as Expected satisfies Result;
})();

// integer({ default: 1 }) -> number
(() => {
  const s = qs.createSearchParamStore("n", integer({ default: 1 }));
  type Result = ReturnType<typeof s.$value.get>;
  type Expected = number;
  anyObj as Result satisfies Expected;
  anyObj as Expected satisfies Result;
})();

// integer({ array: true }) -> Array<number>
(() => {
  const s = qs.createSearchParamStore("n", integer({ array: true }));
  type Result = ReturnType<typeof s.$value.get>;
  type Expected = Array<number>;
  anyObj as Result satisfies Expected;
  anyObj as Expected satisfies Result;
})();

// --- float type inference ---

// float() -> number
(() => {
  const s = qs.createSearchParamStore("n", float());
  type Result = ReturnType<typeof s.$value.get>;
  type Expected = number;
  anyObj as Result satisfies Expected;
  anyObj as Expected satisfies Result;
})();

// float({ optional: true }) -> number | undefined
(() => {
  const s = qs.createSearchParamStore("n", float({ optional: true }));
  type Result = ReturnType<typeof s.$value.get>;
  type Expected = number | undefined;
  anyObj as Result satisfies Expected;
  anyObj as Expected satisfies Result;
})();

// float({ fixed: 2 }) -> number
(() => {
  const s = qs.createSearchParamStore("n", float({ fixed: 2 }));
  type Result = ReturnType<typeof s.$value.get>;
  type Expected = number;
  anyObj as Result satisfies Expected;
  anyObj as Expected satisfies Result;
})();

// --- string type inference ---

// string() -> string
(() => {
  const s = qs.createSearchParamStore("s", string());
  type Result = ReturnType<typeof s.$value.get>;
  type Expected = string;
  anyObj as Result satisfies Expected;
  anyObj as Expected satisfies Result;
})();

// string({ optional: true }) -> string | undefined
(() => {
  const s = qs.createSearchParamStore("s", string({ optional: true }));
  type Result = ReturnType<typeof s.$value.get>;
  type Expected = string | undefined;
  anyObj as Result satisfies Expected;
  anyObj as Expected satisfies Result;
})();

// string({ array: true }) -> Array<string>
(() => {
  const s = qs.createSearchParamStore("s", string({ array: true }));
  type Result = ReturnType<typeof s.$value.get>;
  type Expected = Array<string>;
  anyObj as Result satisfies Expected;
  anyObj as Expected satisfies Result;
})();

// --- boolean type inference ---

// boolean() -> boolean
(() => {
  const s = qs.createSearchParamStore("b", boolean());
  type Result = ReturnType<typeof s.$value.get>;
  type Expected = boolean;
  anyObj as Result satisfies Expected;
  anyObj as Expected satisfies Result;
})();

// boolean({ optional: true }) -> boolean | undefined
(() => {
  const s = qs.createSearchParamStore("b", boolean({ optional: true }));
  type Result = ReturnType<typeof s.$value.get>;
  type Expected = boolean | undefined;
  anyObj as Result satisfies Expected;
  anyObj as Expected satisfies Result;
})();

// boolean({ default: true }) -> boolean
(() => {
  const s = qs.createSearchParamStore("b", boolean({ default: true }));
  type Result = ReturnType<typeof s.$value.get>;
  type Expected = boolean;
  anyObj as Result satisfies Expected;
  anyObj as Expected satisfies Result;
})();

// --- date type inference ---

// date() -> Date
(() => {
  const s = qs.createSearchParamStore("d", date());
  type Result = ReturnType<typeof s.$value.get>;
  type Expected = Date;
  anyObj as Result satisfies Expected;
  anyObj as Expected satisfies Result;
})();

// date({ optional: true }) -> Date | undefined
(() => {
  const s = qs.createSearchParamStore("d", date({ optional: true }));
  type Result = ReturnType<typeof s.$value.get>;
  type Expected = Date | undefined;
  anyObj as Result satisfies Expected;
  anyObj as Expected satisfies Result;
})();

// date({ array: true }) -> Array<Date>
(() => {
  const s = qs.createSearchParamStore("d", date({ array: true }));
  type Result = ReturnType<typeof s.$value.get>;
  type Expected = Array<Date>;
  anyObj as Result satisfies Expected;
  anyObj as Expected satisfies Result;
})();

// --- ymd type inference ---

// ymd() -> string
(() => {
  const s = qs.createSearchParamStore("d", ymd());
  type Result = ReturnType<typeof s.$value.get>;
  type Expected = string;
  anyObj as Result satisfies Expected;
  anyObj as Expected satisfies Result;
})();

// ymd({ optional: true }) -> string | undefined
(() => {
  const s = qs.createSearchParamStore("d", ymd({ optional: true }));
  type Result = ReturnType<typeof s.$value.get>;
  type Expected = string | undefined;
  anyObj as Result satisfies Expected;
  anyObj as Expected satisfies Result;
})();

// --- hms type inference ---

// hms() -> string
(() => {
  const s = qs.createSearchParamStore("t", hms());
  type Result = ReturnType<typeof s.$value.get>;
  type Expected = string;
  anyObj as Result satisfies Expected;
  anyObj as Expected satisfies Result;
})();

// hms({ optional: true }) -> string | undefined
(() => {
  const s = qs.createSearchParamStore("t", hms({ optional: true }));
  type Result = ReturnType<typeof s.$value.get>;
  type Expected = string | undefined;
  anyObj as Result satisfies Expected;
  anyObj as Expected satisfies Result;
})();

// --- enum type inference ---

// enum(["asc", "desc"]) -> "asc" | "desc"
(() => {
  const s = qs.createSearchParamStore("sort", presetEnum(["asc", "desc"]));
  type Result = ReturnType<typeof s.$value.get>;
  type Expected = "asc" | "desc";
  anyObj as Result satisfies Expected;
  anyObj as Expected satisfies Result;
})();

// enum(["asc", "desc"], { optional: true }) -> "asc" | "desc" | undefined
(() => {
  const s = qs.createSearchParamStore("sort", presetEnum(["asc", "desc"], { optional: true }));
  type Result = ReturnType<typeof s.$value.get>;
  type Expected = "asc" | "desc" | undefined;
  anyObj as Result satisfies Expected;
  anyObj as Expected satisfies Result;
})();

// enum(["asc", "desc"], { array: true }) -> Array<"asc" | "desc">
(() => {
  const s = qs.createSearchParamStore("sort", presetEnum(["asc", "desc"], { array: true }));
  type Result = ReturnType<typeof s.$value.get>;
  type Expected = Array<"asc" | "desc">;
  anyObj as Result satisfies Expected;
  anyObj as Expected satisfies Result;
})();

// --- tuple type inference ---

// tuple([string(), integer()]) -> [string, number]
(() => {
  const s = qs.createSearchParamStore("t", tuple([string(), integer()]));
  type Result = ReturnType<typeof s.$value.get>;
  type Expected = [string, number];
  anyObj as Result satisfies Expected;
  anyObj as Expected satisfies Result;
})();

// tuple([string({ optional: true }), integer({ optional: true })]) -> [string | undefined, number | undefined]
(() => {
  const s = qs.createSearchParamStore(
    "t",
    tuple([string({ optional: true }), integer({ optional: true })]),
  );
  type Result = ReturnType<typeof s.$value.get>;
  type Expected = [string | undefined, number | undefined];
  anyObj as Result satisfies Expected;
  anyObj as Expected satisfies Result;
})();

// --- createPreset with resolve ---

// createPreset<string, string, number> with resolve: $value is string, $resolved is number
(() => {
  const ratio = createPreset<string, string, number>({
    decode: (v) => String(v),
    defaultValue: "16:9",
    resolve: (v) => {
      const parts = v.split(":").map(Number);
      return (parts[0] ?? 0) / (parts[1] ?? 1);
    },
  });
  const s = qs.createSearchParamStore("r", ratio());
  type ValueType = ReturnType<typeof s.$value.get>;
  type ResolvedType = ReturnType<typeof s.$resolved.get>;
  anyObj as ValueType satisfies string;
  anyObj as string satisfies ValueType;
  anyObj as ResolvedType satisfies number;
  anyObj as number satisfies ResolvedType;
})();

// createPreset without resolve: $resolved = $value
(() => {
  const pct = createPreset<number>({
    decode: (v) => Number(v),
    defaultValue: 0,
  });
  const s = qs.createSearchParamStore("p", pct());
  type ValueType = ReturnType<typeof s.$value.get>;
  type ResolvedType = ReturnType<typeof s.$resolved.get>;
  anyObj as ValueType satisfies number;
  anyObj as ResolvedType satisfies number;
})();

// createPreset with resolve + optional: $resolved is number | undefined
(() => {
  const ratio = createPreset<string, string, number>({
    decode: (v) => String(v),
    defaultValue: "16:9",
    resolve: (v) => {
      const parts = v.split(":").map(Number);
      return (parts[0] ?? 0) / (parts[1] ?? 1);
    },
  });
  const s = qs.createSearchParamStore("r", ratio({ optional: true }));
  type ValueType = ReturnType<typeof s.$value.get>;
  type ResolvedType = ReturnType<typeof s.$resolved.get>;
  anyObj as ValueType satisfies string | undefined;
  anyObj as string | undefined satisfies ValueType;
  anyObj as ResolvedType satisfies number | undefined;
  anyObj as number | undefined satisfies ResolvedType;
})();

// createPreset with resolve + array: $resolved is Array<number>
(() => {
  const ratio = createPreset<string, string, number>({
    decode: (v) => String(v),
    defaultValue: "16:9",
    resolve: (v) => {
      const parts = v.split(":").map(Number);
      return (parts[0] ?? 0) / (parts[1] ?? 1);
    },
  });
  const s = qs.createSearchParamStore("r", ratio({ array: true }));
  type ValueType = ReturnType<typeof s.$value.get>;
  type ResolvedType = ReturnType<typeof s.$resolved.get>;
  anyObj as ValueType satisfies Array<string>;
  anyObj as Array<string> satisfies ValueType;
  anyObj as ResolvedType satisfies Array<number>;
  anyObj as Array<number> satisfies ResolvedType;
})();

// --- $resolved type inference ---

// no resolve: $resolved same type as $value
(() => {
  const s = qs.createSearchParamStore("n", integer({ default: 1 }));
  type ValueType = ReturnType<typeof s.$value.get>;
  type ResolvedType = ReturnType<typeof s.$resolved.get>;
  anyObj as ValueType satisfies ResolvedType;
  anyObj as ResolvedType satisfies ValueType;
})();

// with resolve (manual config): $resolved is different type
(() => {
  const s = qs.createSearchParamStore("n", {
    decode: (v: unknown) => String(v),
    defaultValue: "",
    resolve: (v: string) => v.length,
  });
  type ValueType = ReturnType<typeof s.$value.get>;
  type ResolvedType = ReturnType<typeof s.$resolved.get>;
  anyObj as ValueType satisfies string;
  anyObj as string satisfies ValueType;
  anyObj as ResolvedType satisfies number;
  anyObj as number satisfies ResolvedType;
})();

// --- numInput type inference ---

// integer({ numInput: true, default: 1 }): $value is string, $resolved is number
(() => {
  const s = qs.createSearchParamStore("n", integer({ numInput: true, default: 1 }));
  type ValueType = ReturnType<typeof s.$value.get>;
  type ResolvedType = ReturnType<typeof s.$resolved.get>;
  anyObj as ValueType satisfies string;
  anyObj as string satisfies ValueType;
  anyObj as ResolvedType satisfies number;
  anyObj as number satisfies ResolvedType;
})();

// float({ numInput: true, default: 0, fixed: 2 }): $value is string, $resolved is number
(() => {
  const s = qs.createSearchParamStore("n", float({ numInput: true, default: 0, fixed: 2 }));
  type ValueType = ReturnType<typeof s.$value.get>;
  type ResolvedType = ReturnType<typeof s.$resolved.get>;
  anyObj as ValueType satisfies string;
  anyObj as string satisfies ValueType;
  anyObj as ResolvedType satisfies number;
  anyObj as number satisfies ResolvedType;
})();

// --- multi-param $resolved type inference ---

// createSearchParamsStore with mixed resolve / no-resolve configs
(() => {
  const store = qs.createSearchParamsStore({
    page: integer({ numInput: true, default: 1 }),
    search: string(),
  });
  type Values = ReturnType<typeof store.$values.get>;
  type Resolved = ReturnType<typeof store.$resolved.get>;
  // page: value is string, resolved is number
  anyObj as Values["page"] satisfies string;
  anyObj as string satisfies Values["page"];
  anyObj as Resolved["page"] satisfies number;
  anyObj as number satisfies Resolved["page"];
  // search: value = resolved = string
  anyObj as Values["search"] satisfies string;
  anyObj as Resolved["search"] satisfies string;
})();

// --- Negative type tests (I-11) ---

// numInput without default should be a compile error
// @ts-expect-error numInput requires default
integer({ numInput: true });

// mutually exclusive options
// @ts-expect-error optional and default are mutually exclusive
integer({ optional: true, default: 1 });
// @ts-expect-error optional and array are mutually exclusive
integer({ optional: true, array: true });
// @ts-expect-error default and array are mutually exclusive
integer({ default: 1, array: true });

// enum with wrong default type
// @ts-expect-error "invalid" is not in the enum array
presetEnum(["asc", "desc"], { default: "invalid" });

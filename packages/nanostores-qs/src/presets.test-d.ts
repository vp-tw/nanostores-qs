import { createQsUtils } from "./main";
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

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

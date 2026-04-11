import type { ReactNode } from "react";
import { useStore } from "@nanostores/react";
import { createQsUtils } from "@vp-tw/nanostores-qs";
import * as presets from "@vp-tw/nanostores-qs/presets";
import objectInspect from "object-inspect";
import { useState } from "react";

import {
  CodePreview,
  DemoCheckbox,
  DemoColumn,
  DemoContainer,
  DemoInput,
  DemoLabel,
  DemoMultiSelect,
  DemoRow,
  DemoSelect,
} from "../demo-ui";
import styles from "./PresetsDemo.module.css";

// --- Value button row ---

function ValueButtons({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className={styles.presetRow}>
      <div className={styles.presetLabel}>{label}</div>
      <div className={styles.btnGroup}>{children}</div>
    </div>
  );
}

function VBtn({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button type="button" className={styles.valueBtn} onClick={onClick}>
      {label}
    </button>
  );
}

// --- String ---

const strUtils = createQsUtils();
const strStore = strUtils.createSearchParamsStore({
  base: presets.string(),
  maxLen: presets.string({ maxLength: 5 }),
  optional: presets.string({ optional: true }),
});

export function StringDemo() {
  const v = useStore(strStore.$values);
  const search = useStore(strUtils.$search);
  return (
    <DemoContainer>
      <DemoRow>
        <DemoColumn>
          <DemoInput
            label="string()"
            type="text"
            value={v.base}
            onChange={(e) => strStore.update("base", e.currentTarget.value)}
            onClear={() => strStore.update("base", "")}
          />
          <DemoInput
            label="string({ maxLength: 5 })"
            type="text"
            placeholder="try typing more than 5 chars"
            value={v.maxLen}
            onChange={(e) => strStore.update("maxLen", e.currentTarget.value)}
            onClear={() => strStore.update("maxLen", "")}
          />
          <DemoInput
            label="string({ optional: true })"
            type="text"
            value={v.optional ?? ""}
            onChange={(e) => strStore.update("optional", e.currentTarget.value || undefined)}
            onClear={() => strStore.update("optional", undefined)}
          />
        </DemoColumn>
        <DemoColumn>
          <CodePreview label="$values" value={objectInspect(v, { indent: 2 })} />
          <CodePreview label="URL" value={search || "(empty)"} />
        </DemoColumn>
      </DemoRow>
    </DemoContainer>
  );
}

// --- Integer (simulated URL input → real decode) ---

const intUtils = createQsUtils();
const intStore = intUtils.createSearchParamsStore({
  round: presets.integer(),
  ceil: presets.integer({ round: "ceil" }),
  parse: presets.integer({ round: "parse" }),
  clamped: presets.integer({ min: 0, max: 100 }),
  reject: presets.integer({ min: 0, max: 100, outOfRange: "reject" }),
});

export function IntegerDemo() {
  const v = useStore(intStore.$values);
  const search = useStore(intUtils.$search);
  const [input, setInput] = useState("(empty)");

  /** Simulate a raw URL string — the preset decode handles it. */
  function sim(params: Record<string, string>) {
    const qs = new URLSearchParams(params).toString();
    setInput(qs ? `?${qs}` : "(empty)");
    intUtils._$internalSearch.set(qs ? `?${qs}` : "");
  }

  return (
    <DemoContainer>
      <DemoRow>
        <DemoColumn>
          <ValueButtons label="integer() — round">
            <VBtn label="3.7" onClick={() => sim({ round: "3.7" })} />
            <VBtn label="3.2" onClick={() => sim({ round: "3.2" })} />
            <VBtn label="-5" onClick={() => sim({ round: "-5" })} />
            <VBtn label="abc" onClick={() => sim({ round: "abc" })} />
            <VBtn label="clear" onClick={() => sim({})} />
          </ValueButtons>
          <ValueButtons label='integer({ round: "ceil" })'>
            <VBtn label="3.2" onClick={() => sim({ ceil: "3.2" })} />
            <VBtn label="-1.5" onClick={() => sim({ ceil: "-1.5" })} />
            <VBtn label="clear" onClick={() => sim({})} />
          </ValueButtons>
          <ValueButtons label='integer({ round: "parse" })'>
            <VBtn label="3.9" onClick={() => sim({ parse: "3.9" })} />
            <VBtn label="10" onClick={() => sim({ parse: "10" })} />
            <VBtn label="clear" onClick={() => sim({})} />
          </ValueButtons>
          <ValueButtons label="integer({ min: 0, max: 100 }) — clamp">
            <VBtn label="50" onClick={() => sim({ clamped: "50" })} />
            <VBtn label="-5" onClick={() => sim({ clamped: "-5" })} />
            <VBtn label="200" onClick={() => sim({ clamped: "200" })} />
            <VBtn label="clear" onClick={() => sim({})} />
          </ValueButtons>
          <ValueButtons label='integer({ ..., outOfRange: "reject" })'>
            <VBtn label="50" onClick={() => sim({ reject: "50" })} />
            <VBtn label="-5" onClick={() => sim({ reject: "-5" })} />
            <VBtn label="200" onClick={() => sim({ reject: "200" })} />
            <VBtn label="clear" onClick={() => sim({})} />
          </ValueButtons>
        </DemoColumn>
        <DemoColumn>
          <CodePreview label="Input URL" value={input} />
          <CodePreview label="$values (decoded)" value={objectInspect(v, { indent: 2 })} />
          <CodePreview label="Output URL" value={search || "(empty)"} />
        </DemoColumn>
      </DemoRow>
    </DemoContainer>
  );
}

// --- Float (simulated URL input → real decode) ---

const floatUtils = createQsUtils();
const floatStore = floatUtils.createSearchParamsStore({
  base: presets.float(),
  fixed2: presets.float({ fixed: 2 }),
  clamped: presets.float({ fixed: 2, min: 0, max: 1 }),
});

export function FloatDemo() {
  const v = useStore(floatStore.$values);
  const search = useStore(floatUtils.$search);
  const [input, setInput] = useState("(empty)");

  function sim(params: Record<string, string>) {
    const qs = new URLSearchParams(params).toString();
    setInput(qs ? `?${qs}` : "(empty)");
    floatUtils._$internalSearch.set(qs ? `?${qs}` : "");
  }

  return (
    <DemoContainer>
      <DemoRow>
        <DemoColumn>
          <ValueButtons label="float()">
            <VBtn label="3.14159" onClick={() => sim({ base: "3.14159" })} />
            <VBtn label="-2.5" onClick={() => sim({ base: "-2.5" })} />
            <VBtn label="abc" onClick={() => sim({ base: "abc" })} />
            <VBtn label="clear" onClick={() => sim({})} />
          </ValueButtons>
          <ValueButtons label="float({ fixed: 2 })">
            <VBtn label="3.14159" onClick={() => sim({ fixed2: "3.14159" })} />
            <VBtn label="3.145" onClick={() => sim({ fixed2: "3.145" })} />
            <VBtn label="clear" onClick={() => sim({})} />
          </ValueButtons>
          <ValueButtons label="float({ fixed: 2, min: 0, max: 1 })">
            <VBtn label="0.75" onClick={() => sim({ clamped: "0.75" })} />
            <VBtn label="1.5" onClick={() => sim({ clamped: "1.5" })} />
            <VBtn label="-0.5" onClick={() => sim({ clamped: "-0.5" })} />
            <VBtn label="clear" onClick={() => sim({})} />
          </ValueButtons>
        </DemoColumn>
        <DemoColumn>
          <CodePreview label="Input URL" value={input} />
          <CodePreview label="$values (decoded)" value={objectInspect(v, { indent: 2 })} />
          <CodePreview label="Output URL" value={search || "(empty)"} />
        </DemoColumn>
      </DemoRow>
    </DemoContainer>
  );
}

// --- Boolean ---

const boolUtils = createQsUtils();
const boolBase = boolUtils.createSearchParamStore("base", presets.boolean());
const boolTrue = boolUtils.createSearchParamStore("defTrue", presets.boolean({ default: true }));
const boolOpt = boolUtils.createSearchParamStore("opt", presets.boolean({ optional: true }));

export function BooleanDemo() {
  const base = useStore(boolBase.$value);
  const defTrue = useStore(boolTrue.$value);
  const opt = useStore(boolOpt.$value);
  const search = useStore(boolUtils.$search);
  return (
    <DemoContainer>
      <DemoRow>
        <DemoColumn>
          <DemoCheckbox
            label="boolean() — default false"
            checked={base}
            onChange={(v) => boolBase.update(v)}
          />
          <DemoCheckbox
            label="boolean({ default: true }) — encode flips"
            checked={defTrue}
            onChange={(v) => boolTrue.update(v)}
          />
          <DemoCheckbox
            label="boolean({ optional: true })"
            checked={opt ?? false}
            onChange={(v) => boolOpt.update(v)}
          />
          <ValueButtons label="">
            <VBtn label="reset optional → undefined" onClick={() => boolOpt.update(undefined)} />
          </ValueButtons>
        </DemoColumn>
        <DemoColumn>
          <CodePreview
            label="$values"
            value={objectInspect({ base, defTrue, opt }, { indent: 2 })}
          />
          <CodePreview label="URL" value={search || "(empty)"} />
        </DemoColumn>
      </DemoRow>
    </DemoContainer>
  );
}

// --- Enum ---

const enumUtils = createQsUtils();
const sortOptions = ["newest", "oldest", "popular"] as const;
const enumStore = enumUtils.createSearchParamsStore({
  base: presets.enum(sortOptions),
  optional: presets.enum(sortOptions, { optional: true }),
  array: presets.enum(sortOptions, { array: true }),
});

export function EnumDemo() {
  const v = useStore(enumStore.$values);
  const search = useStore(enumUtils.$search);
  return (
    <DemoContainer>
      <DemoRow>
        <DemoColumn>
          <DemoSelect
            label="enum(sortOptions)"
            options={sortOptions}
            value={v.base}
            onChange={(val) => enumStore.update("base", val)}
          />
          <DemoSelect
            label="enum(sortOptions, { optional })"
            options={["(none)", ...sortOptions]}
            value={v.optional ?? "(none)"}
            onChange={(val) =>
              enumStore.update("optional", val === "(none)" ? undefined : (val as any))
            }
          />
          <DemoMultiSelect
            label="enum(sortOptions, { array })"
            options={sortOptions}
            value={[...v.array]}
            onChange={(val) => enumStore.update("array", val as any)}
          />
        </DemoColumn>
        <DemoColumn>
          <CodePreview label="$values" value={objectInspect(v, { indent: 2 })} />
          <CodePreview label="URL" value={search || "(empty)"} />
        </DemoColumn>
      </DemoRow>
    </DemoContainer>
  );
}

// --- Date (buttons) ---

const dateUtils = createQsUtils();
const dateStore = dateUtils.createSearchParamsStore({
  base: presets.date(),
  optional: presets.date({ optional: true }),
});

export function DateDemo() {
  const v = useStore(dateStore.$values);
  const search = useStore(dateUtils.$search);
  const [input, setInput] = useState("(empty)");

  function sim(params: Record<string, string>) {
    const qs = new URLSearchParams(params).toString();
    setInput(qs ? `?${qs}` : "(empty)");
    dateUtils._$internalSearch.set(qs ? `?${qs}` : "");
  }

  return (
    <DemoContainer>
      <DemoRow>
        <DemoColumn>
          <ValueButtons label="date()">
            <VBtn
              label="2024-01-15T00:00:00.000Z"
              onClick={() => sim({ base: "2024-01-15T00:00:00.000Z" })}
            />
            <VBtn label="not-a-date" onClick={() => sim({ base: "not-a-date" })} />
            <VBtn label="clear" onClick={() => sim({})} />
          </ValueButtons>
          <ValueButtons label="date({ optional: true })">
            <VBtn
              label="2024-06-01T00:00:00.000Z"
              onClick={() => sim({ optional: "2024-06-01T00:00:00.000Z" })}
            />
            <VBtn label="clear" onClick={() => sim({})} />
          </ValueButtons>
        </DemoColumn>
        <DemoColumn>
          <CodePreview label="Input URL" value={input} />
          <CodePreview label="$values (decoded)" value={objectInspect(v, { indent: 2 })} />
          <CodePreview label="Output URL" value={search || "(empty)"} />
        </DemoColumn>
      </DemoRow>
    </DemoContainer>
  );
}

// --- YMD ---

const ymdUtils = createQsUtils();
const ymdStore = ymdUtils.createSearchParamsStore({
  base: presets.ymd(),
  optional: presets.ymd({ optional: true }),
});

export function YmdDemo() {
  const v = useStore(ymdStore.$values);
  const search = useStore(ymdUtils.$search);
  return (
    <DemoContainer>
      <DemoRow>
        <DemoColumn>
          <DemoInput
            label="ymd()"
            type="date"
            value={v.base === "0000-00-00" ? "" : v.base}
            onChange={(e) => ymdStore.update("base", e.currentTarget.value || "0000-00-00")}
            onClear={() => ymdStore.update("base", "0000-00-00")}
          />
          <DemoInput
            label="ymd({ optional: true })"
            type="date"
            value={v.optional ?? ""}
            onChange={(e) => ymdStore.update("optional", e.currentTarget.value || undefined)}
            onClear={() => ymdStore.update("optional", undefined)}
          />
        </DemoColumn>
        <DemoColumn>
          <CodePreview label="$values" value={objectInspect(v, { indent: 2 })} />
          <CodePreview label="URL" value={search || "(empty)"} />
        </DemoColumn>
      </DemoRow>
    </DemoContainer>
  );
}

// --- HMS ---

const hmsUtils = createQsUtils();
const hmsStore = hmsUtils.createSearchParamsStore({
  base: presets.hms(),
  optional: presets.hms({ optional: true }),
});

export function HmsDemo() {
  const v = useStore(hmsStore.$values);
  const search = useStore(hmsUtils.$search);
  return (
    <DemoContainer>
      <DemoRow>
        <DemoColumn>
          <DemoInput
            label="hms()"
            type="time"
            step="1"
            value={v.base}
            onChange={(e) => hmsStore.update("base", e.currentTarget.value || "00:00:00")}
            onClear={() => hmsStore.update("base", "00:00:00")}
          />
          <DemoInput
            label="hms({ optional: true })"
            type="time"
            step="1"
            value={v.optional ?? ""}
            onChange={(e) => hmsStore.update("optional", e.currentTarget.value || undefined)}
            onClear={() => hmsStore.update("optional", undefined)}
          />
        </DemoColumn>
        <DemoColumn>
          <CodePreview label="$values" value={objectInspect(v, { indent: 2 })} />
          <CodePreview label="URL" value={search || "(empty)"} />
        </DemoColumn>
      </DemoRow>
    </DemoContainer>
  );
}

// --- Tuple (buttons) ---

// [float] — single element
const tuple1Utils = createQsUtils();
const tuple1Store = tuple1Utils.createSearchParamStore("scale", presets.tuple([presets.float()]));

// [float, float] — pair (coordinates)
const tuple2Utils = createQsUtils();
const tuple2Store = tuple2Utils.createSearchParamStore(
  "coord",
  presets.tuple([presets.float(), presets.float()]),
);

// [string, numInput integer, boolean] — mixed types with resolve
const tuple3Utils = createQsUtils();
const tuple3Store = tuple3Utils.createSearchParamStore(
  "filter",
  presets.tuple([
    presets.string(),
    presets.integer({ numInput: true, default: 0 }),
    presets.boolean(),
  ]),
);

export function TupleDemo() {
  const v1 = useStore(tuple1Store.$value);
  const s1 = useStore(tuple1Utils.$search);
  const v2 = useStore(tuple2Store.$value);
  const s2 = useStore(tuple2Utils.$search);
  const v3 = useStore(tuple3Store.$value);
  const r3 = useStore(tuple3Store.$resolved);
  const s3 = useStore(tuple3Utils.$search);
  const [input, setInput] = useState("(empty)");

  function sim(utils: typeof tuple1Utils, params: string) {
    setInput(params ? `?${params}` : "(empty)");
    utils._$internalSearch.set(params ? `?${params}` : "");
  }

  return (
    <DemoContainer>
      <DemoRow>
        <DemoColumn>
          <ValueButtons label="tuple([float()]) — single">
            <VBtn label="[1.5]" onClick={() => sim(tuple1Utils, "scale=1.5")} />
            <VBtn label="[0]" onClick={() => sim(tuple1Utils, "scale=0")} />
            <VBtn label="clear" onClick={() => sim(tuple1Utils, "")} />
          </ValueButtons>
          <ValueButtons label="tuple([float(), float()]) — pair">
            <VBtn label="[1.5, 2.3]" onClick={() => sim(tuple2Utils, "coord=1.5&coord=2.3")} />
            <VBtn label="[0, 0]" onClick={() => sim(tuple2Utils, "coord=0&coord=0")} />
            <VBtn label="[-3.14, 42]" onClick={() => sim(tuple2Utils, "coord=-3.14&coord=42")} />
            <VBtn label="1 param only" onClick={() => sim(tuple2Utils, "coord=1.5")} />
            <VBtn
              label="3 params"
              onClick={() => sim(tuple2Utils, "coord=1.5&coord=2.3&coord=99")}
            />
            <VBtn label="clear" onClick={() => sim(tuple2Utils, "")} />
          </ValueButtons>
          <ValueButtons label="tuple([string(), integer({ numInput, default: 0 }), boolean()]) — mixed with resolve">
            <VBtn
              label='["hello", "42", "true"]'
              onClick={() => sim(tuple3Utils, "filter=hello&filter=42&filter=true")}
            />
            <VBtn
              label='["hello", "", "false"]'
              onClick={() => sim(tuple3Utils, "filter=hello&filter=&filter=false")}
            />
            <VBtn label="clear" onClick={() => sim(tuple3Utils, "")} />
          </ValueButtons>
        </DemoColumn>
        <DemoColumn>
          <CodePreview label="Input URL" value={input} />
          <CodePreview
            label="$value (decoded)"
            value={[
              `scale:  ${objectInspect(v1)}`,
              `coord:  ${objectInspect(v2)}`,
              `filter: ${objectInspect(v3)}`,
            ].join("\n")}
          />
          <CodePreview label="$resolved (filter)" value={objectInspect(r3)} />
          <CodePreview
            label="Output URL"
            value={[
              `scale:  ${s1 || "(empty)"}`,
              `coord:  ${s2 || "(empty)"}`,
              `filter: ${s3 || "(empty)"}`,
            ].join("\n")}
          />
        </DemoColumn>
      </DemoRow>
    </DemoContainer>
  );
}

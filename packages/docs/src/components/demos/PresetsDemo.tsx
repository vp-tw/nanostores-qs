import type { ReactNode } from "react";
import { useStore } from "@nanostores/react";
import { createQsUtils } from "@vp-tw/nanostores-qs";
import * as presets from "@vp-tw/nanostores-qs/presets";
import objectInspect from "object-inspect";

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

// --- Integer (buttons) ---

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
  return (
    <DemoContainer>
      <DemoRow>
        <DemoColumn>
          <ValueButtons label="integer() — round">
            <VBtn label="3.7 → 4" onClick={() => intStore.update("round", 4)} />
            <VBtn label="3.2 → 3" onClick={() => intStore.update("round", 3)} />
            <VBtn label="-5" onClick={() => intStore.update("round", -5)} />
            <VBtn label="clear" onClick={() => intStore.update("round", Number.NaN)} />
          </ValueButtons>
          <ValueButtons label='integer({ round: "ceil" })'>
            <VBtn label="3.2 → 4" onClick={() => intStore.update("ceil", 4)} />
            <VBtn label="-1.5 → -1" onClick={() => intStore.update("ceil", -1)} />
            <VBtn label="clear" onClick={() => intStore.update("ceil", Number.NaN)} />
          </ValueButtons>
          <ValueButtons label='integer({ round: "parse" })'>
            <VBtn label="3.9 → 3" onClick={() => intStore.update("parse", 3)} />
            <VBtn label="10" onClick={() => intStore.update("parse", 10)} />
            <VBtn label="clear" onClick={() => intStore.update("parse", Number.NaN)} />
          </ValueButtons>
          <ValueButtons label="integer({ min: 0, max: 100 }) — clamp">
            <VBtn label="50" onClick={() => intStore.update("clamped", 50)} />
            <VBtn label="-5 → 0" onClick={() => intStore.update("clamped", 0)} />
            <VBtn label="200 → 100" onClick={() => intStore.update("clamped", 100)} />
            <VBtn label="clear" onClick={() => intStore.update("clamped", Number.NaN)} />
          </ValueButtons>
          <ValueButtons label='integer({ min: 0, max: 100, outOfRange: "reject" })'>
            <VBtn label="50" onClick={() => intStore.update("reject", 50)} />
            <VBtn label="-5 → NaN" onClick={() => intStore.update("reject", Number.NaN)} />
            <VBtn label="200 → NaN" onClick={() => intStore.update("reject", Number.NaN)} />
            <VBtn label="clear" onClick={() => intStore.update("reject", Number.NaN)} />
          </ValueButtons>
        </DemoColumn>
        <DemoColumn>
          <CodePreview label="$values" value={objectInspect(v, { indent: 2 })} />
          <CodePreview label="URL" value={search || "(empty)"} />
        </DemoColumn>
      </DemoRow>
    </DemoContainer>
  );
}

// --- Float (buttons) ---

const floatUtils = createQsUtils();
const floatStore = floatUtils.createSearchParamsStore({
  base: presets.float(),
  fixed2: presets.float({ fixed: 2 }),
  clamped: presets.float({ fixed: 2, min: 0, max: 1 }),
});

export function FloatDemo() {
  const v = useStore(floatStore.$values);
  const search = useStore(floatUtils.$search);
  return (
    <DemoContainer>
      <DemoRow>
        <DemoColumn>
          <ValueButtons label="float()">
            <VBtn label="3.14159" onClick={() => floatStore.update("base", 3.14159)} />
            <VBtn label="-2.5" onClick={() => floatStore.update("base", -2.5)} />
            <VBtn label="clear" onClick={() => floatStore.update("base", Number.NaN)} />
          </ValueButtons>
          <ValueButtons label="float({ fixed: 2 })">
            <VBtn label="3.14159 → 3.14" onClick={() => floatStore.update("fixed2", 3.14)} />
            <VBtn label="3.145 → 3.15" onClick={() => floatStore.update("fixed2", 3.15)} />
            <VBtn label="clear" onClick={() => floatStore.update("fixed2", Number.NaN)} />
          </ValueButtons>
          <ValueButtons label="float({ fixed: 2, min: 0, max: 1 })">
            <VBtn label="0.75" onClick={() => floatStore.update("clamped", 0.75)} />
            <VBtn label="1.5 → 1" onClick={() => floatStore.update("clamped", 1)} />
            <VBtn label="-0.5 → 0" onClick={() => floatStore.update("clamped", 0)} />
            <VBtn label="clear" onClick={() => floatStore.update("clamped", Number.NaN)} />
          </ValueButtons>
        </DemoColumn>
        <DemoColumn>
          <CodePreview label="$values" value={objectInspect(v, { indent: 2 })} />
          <CodePreview label="URL" value={search || "(empty)"} />
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
  return (
    <DemoContainer>
      <DemoRow>
        <DemoColumn>
          <ValueButtons label="date()">
            <VBtn
              label="2024-01-15"
              onClick={() => dateStore.update("base", new Date("2024-01-15T00:00:00.000Z"))}
            />
            <VBtn label="now" onClick={() => dateStore.update("base", new Date())} />
            <VBtn label="invalid" onClick={() => dateStore.update("base", new Date(Number.NaN))} />
          </ValueButtons>
          <ValueButtons label="date({ optional: true })">
            <VBtn
              label="2024-06-01"
              onClick={() => dateStore.update("optional", new Date("2024-06-01T00:00:00.000Z"))}
            />
            <VBtn label="clear" onClick={() => dateStore.update("optional", undefined)} />
          </ValueButtons>
        </DemoColumn>
        <DemoColumn>
          <CodePreview label="$values" value={objectInspect(v, { indent: 2 })} />
          <CodePreview label="URL" value={search || "(empty)"} />
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

const tupleUtils = createQsUtils();
const tupleStore = tupleUtils.createSearchParamStore(
  "coord",
  presets.tuple([presets.float(), presets.float()]),
);

export function TupleDemo() {
  const v = useStore(tupleStore.$value);
  const search = useStore(tupleUtils.$search);
  return (
    <DemoContainer>
      <DemoRow>
        <DemoColumn>
          <ValueButtons label="tuple([float(), float()])">
            <VBtn label="[1.5, 2.3]" onClick={() => tupleStore.update([1.5, 2.3])} />
            <VBtn label="[0, 0]" onClick={() => tupleStore.update([0, 0])} />
            <VBtn label="[-3.14, 42]" onClick={() => tupleStore.update([-3.14, 42])} />
            <VBtn label="clear" onClick={() => tupleStore.update([Number.NaN, Number.NaN])} />
          </ValueButtons>
        </DemoColumn>
        <DemoColumn>
          <CodePreview label="$value" value={objectInspect(v)} />
          <CodePreview label="URL" value={search || "(empty)"} />
        </DemoColumn>
      </DemoRow>
    </DemoContainer>
  );
}

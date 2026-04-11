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

// Each preset gets its own createQsUtils to avoid URL conflicts between demos

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

// --- Integer ---

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
          <DemoInput
            label="integer() — round"
            type="text"
            placeholder="e.g. 3.7"
            value={Number.isNaN(v.round) ? "" : String(v.round)}
            onChange={(e) => intStore.update("round", Number(e.currentTarget.value))}
            onClear={() => intStore.update("round", Number.NaN)}
          />
          <DemoInput
            label='integer({ round: "ceil" })'
            type="text"
            placeholder="e.g. 3.2"
            value={Number.isNaN(v.ceil) ? "" : String(v.ceil)}
            onChange={(e) => intStore.update("ceil", Number(e.currentTarget.value))}
            onClear={() => intStore.update("ceil", Number.NaN)}
          />
          <DemoInput
            label='integer({ round: "parse" })'
            type="text"
            placeholder="e.g. 3.9 → 3"
            value={Number.isNaN(v.parse) ? "" : String(v.parse)}
            onChange={(e) => intStore.update("parse", Number(e.currentTarget.value))}
            onClear={() => intStore.update("parse", Number.NaN)}
          />
          <DemoInput
            label="integer({ min: 0, max: 100 })"
            type="text"
            placeholder="try -5 or 200"
            value={Number.isNaN(v.clamped) ? "" : String(v.clamped)}
            onChange={(e) => intStore.update("clamped", Number(e.currentTarget.value))}
            onClear={() => intStore.update("clamped", Number.NaN)}
          />
          <DemoInput
            label='integer({ min: 0, max: 100, outOfRange: "reject" })'
            type="text"
            placeholder="try -5 or 200"
            value={Number.isNaN(v.reject) ? "" : String(v.reject)}
            onChange={(e) => intStore.update("reject", Number(e.currentTarget.value))}
            onClear={() => intStore.update("reject", Number.NaN)}
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

// --- Float ---

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
          <DemoInput
            label="float()"
            type="text"
            placeholder="e.g. 3.14159"
            value={Number.isNaN(v.base) ? "" : String(v.base)}
            onChange={(e) => floatStore.update("base", Number(e.currentTarget.value))}
            onClear={() => floatStore.update("base", Number.NaN)}
          />
          <DemoInput
            label="float({ fixed: 2 })"
            type="text"
            placeholder="e.g. 3.14159 → 3.14"
            value={Number.isNaN(v.fixed2) ? "" : String(v.fixed2)}
            onChange={(e) => floatStore.update("fixed2", Number(e.currentTarget.value))}
            onClear={() => floatStore.update("fixed2", Number.NaN)}
          />
          <DemoInput
            label="float({ fixed: 2, min: 0, max: 1 })"
            type="text"
            placeholder="e.g. 0.75 or 1.5"
            value={Number.isNaN(v.clamped) ? "" : String(v.clamped)}
            onChange={(e) => floatStore.update("clamped", Number(e.currentTarget.value))}
            onClear={() => floatStore.update("clamped", Number.NaN)}
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

// --- Date ---

const dateUtils = createQsUtils();
const dateStore = dateUtils.createSearchParamsStore({
  base: presets.date(),
  optional: presets.date({ optional: true }),
});

export function DateDemo() {
  const v = useStore(dateStore.$values);
  const search = useStore(dateUtils.$search);
  const baseStr = Number.isNaN(v.base.getTime()) ? "" : v.base.toISOString();
  const optStr = v.optional ? v.optional.toISOString() : "";
  return (
    <DemoContainer>
      <DemoRow>
        <DemoColumn>
          <DemoInput
            label="date()"
            type="text"
            placeholder="e.g. 2024-01-15T00:00:00.000Z"
            value={baseStr}
            onChange={(e) => dateStore.update("base", new Date(e.currentTarget.value))}
            onClear={() => dateStore.update("base", new Date(Number.NaN))}
          />
          <DemoInput
            label="date({ optional: true })"
            type="text"
            placeholder="ISO date string"
            value={optStr}
            onChange={(e) => {
              const d = new Date(e.currentTarget.value);
              dateStore.update("optional", Number.isNaN(d.getTime()) ? undefined : d);
            }}
            onClear={() => dateStore.update("optional", undefined)}
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

// --- Tuple ---

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
          <DemoInput
            label="tuple — [0] float"
            type="text"
            placeholder="e.g. 1.5"
            value={Number.isNaN(v[0]) ? "" : String(v[0])}
            onChange={(e) => tupleStore.update([Number(e.currentTarget.value), v[1]])}
            onClear={() => tupleStore.update([Number.NaN, v[1]])}
          />
          <DemoInput
            label="tuple — [1] float"
            type="text"
            placeholder="e.g. 2.3"
            value={Number.isNaN(v[1]) ? "" : String(v[1])}
            onChange={(e) => tupleStore.update([v[0], Number(e.currentTarget.value)])}
            onClear={() => tupleStore.update([v[0], Number.NaN])}
          />
        </DemoColumn>
        <DemoColumn>
          <CodePreview label="$value" value={objectInspect(v)} />
          <CodePreview label="URL" value={search || "(empty)"} />
        </DemoColumn>
      </DemoRow>
    </DemoContainer>
  );
}

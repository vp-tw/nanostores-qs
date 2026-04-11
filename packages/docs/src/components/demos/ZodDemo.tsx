import { useStore } from "@nanostores/react";
import { createQsUtils } from "@vp-tw/nanostores-qs";
import { createPreset } from "@vp-tw/nanostores-qs/presets";

import { CodePreview, DemoColumn, DemoContainer, DemoLabel, DemoRow, DemoSelect } from "../demo-ui";
import { inspect } from "./inspect";

const qsUtils = createQsUtils();

// --- Pattern: as const array + enum validator ---
// In production, use z.enum(tabOptions) from zod v4.
// Demo uses manual validator to avoid zod v4 SSR build crash.

const tabOptions = ["home", "settings", "profile"] as const;
const statusOptions = ["active", "inactive", "pending"] as const;

function enumValidator<const T extends ReadonlyArray<string>>(values: T) {
  return (v: unknown): T[number] => {
    const s = String(v);
    if (!values.includes(s)) throw new Error(`invalid: ${s}`);
    return s;
  };
}

// --- Inline (plain config) — equivalent to z.enum(tabOptions).parse ---

const tabStore = qsUtils.createSearchParamStore("tab", {
  decode: enumValidator(tabOptions),
  defaultValue: tabOptions[0],
});

// --- Reusable preset — equivalent to zodEnum pattern ---

function zodEnum<const T extends readonly [string, ...Array<string>]>(values: T) {
  return createPreset<T[number], T[0]>({
    decode: enumValidator(values),
    defaultValue: values[0],
  });
}

const statusPreset = zodEnum(statusOptions);
const statusStore = qsUtils.createSearchParamStore("status", statusPreset());

export default function ZodDemo() {
  const tab = useStore(tabStore.$value);
  const status = useStore(statusStore.$value);
  const currentSearch = useStore(qsUtils.$search);

  return (
    <DemoContainer>
      <DemoLabel>Enum Validation (Zod v4 pattern)</DemoLabel>
      <DemoRow>
        <DemoColumn>
          <DemoSelect
            label="tab — plain config + enum validator"
            options={tabOptions}
            value={tab}
            onChange={(v) => tabStore.update(v)}
          />
          <DemoSelect
            label="status — zodEnum(statusOptions) preset"
            options={statusOptions}
            value={status}
            onChange={(v) => statusStore.update(v)}
          />
        </DemoColumn>
        <DemoColumn>
          <CodePreview label="Store values" value={inspect({ tab, status })} />
          <CodePreview label="window.location.search" value={currentSearch || "(empty)"} />
        </DemoColumn>
      </DemoRow>
    </DemoContainer>
  );
}

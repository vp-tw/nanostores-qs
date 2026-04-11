import { useStore } from "@nanostores/react";
import { createQsUtils } from "@vp-tw/nanostores-qs";
import objectInspect from "object-inspect";

import {
  CodePreview,
  DemoCheckbox,
  DemoColumn,
  DemoContainer,
  DemoInput,
  DemoLabel,
  DemoRow,
} from "../demo-ui";

const qsUtils = createQsUtils();

// Plain inline config — no presets, showing raw decode/encode/resolve
const numStore = qsUtils.createSearchParamStore("num", {
  decode: (v: unknown): string => {
    if (v == null) return "";
    const n = Number(v);
    if (Number.isNaN(n)) return "";
    return String(n);
  },
  defaultValue: "",
  encode: (v: string): string | undefined => (v === "" ? undefined : v),
  resolve: (v: string): number => (v === "" ? 0 : Number(v)),
});

const replaceStore = qsUtils.createSearchParamStore("replace", {
  decode: (v: unknown): boolean => v === "true",
  defaultValue: false,
  encode: (v: boolean): string | undefined => (v ? "true" : undefined),
});

const keepHashStore = qsUtils.createSearchParamStore("keepHash", {
  decode: (v: unknown): boolean => v === "true",
  defaultValue: false,
  encode: (v: boolean): string | undefined => (v ? "true" : undefined),
});

export default function InlineConfigDemo() {
  const numInput = useStore(numStore.$value);
  const num = useStore(numStore.$resolved);
  const replace = useStore(replaceStore.$value);
  const keepHash = useStore(keepHashStore.$value);
  const currentSearch = useStore(qsUtils.$search);

  return (
    <DemoContainer>
      <DemoLabel>Inline Configuration (plain config objects)</DemoLabel>
      <DemoRow>
        <DemoColumn>
          <DemoInput
            label="num — { decode, encode, resolve }"
            type="number"
            placeholder="Enter a number"
            value={numInput}
            onChange={(e) => numStore.update(e.currentTarget.value, { replace, keepHash })}
            onClear={() => numStore.update("", { replace, keepHash })}
          />
          <DemoCheckbox
            label="replace (replaceState instead of pushState)"
            checked={replace}
            onChange={(v) => replaceStore.update(v)}
          />
          <DemoCheckbox
            label="keepHash (preserve URL hash)"
            checked={keepHash}
            onChange={(v) => keepHashStore.update(v)}
          />
        </DemoColumn>
        <DemoColumn>
          <CodePreview
            label="Store values"
            value={objectInspect(
              {
                "num.$value": numInput,
                "num.$resolved": num,
                replace,
                keepHash,
              },
              { indent: 2 },
            )}
          />
          <CodePreview label="window.location.search" value={currentSearch || "(empty)"} />
        </DemoColumn>
      </DemoRow>
    </DemoContainer>
  );
}

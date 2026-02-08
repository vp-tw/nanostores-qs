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

// Inline config: custom decode/encode using def() callback
const numStore = qsUtils.createSearchParamStore("num", (def) =>
  def({ decode: (v) => (!v ? "" : Number(v)), defaultValue: "" as number | "" }),
);

const replaceStore = qsUtils.createSearchParamStore("replace", (def) =>
  def({
    decode: (v) => v !== "false",
    defaultValue: true,
  }).setEncode((v) => (v ? undefined : "false")),
);

const keepHashStore = qsUtils.createSearchParamStore("keepHash", (def) =>
  def({
    decode: (v) => v === "true",
    defaultValue: false,
  }).setEncode((v) => (v ? "true" : undefined)),
);

export default function InlineConfigDemo() {
  const num = useStore(numStore.$value);
  const replace = useStore(replaceStore.$value);
  const keepHash = useStore(keepHashStore.$value);
  const currentSearch = useStore(qsUtils.$search);
  const qs = useStore(qsUtils.$qs);

  return (
    <DemoContainer>
      <DemoLabel>Inline Configuration with def() Callback</DemoLabel>
      <DemoRow>
        <DemoColumn>
          <DemoInput
            label={'num — def({ decode: Number, defaultValue: "" })'}
            type="number"
            placeholder="Enter a number"
            value={num}
            onChange={(e) => {
              const v = e.currentTarget.value;
              numStore.update(v === "" ? "" : Number(v), { replace, keepHash });
            }}
            onClear={() => numStore.update("", { replace, keepHash })}
          />
          <DemoCheckbox
            label="replace (replaceState instead of pushState)"
            checked={replace}
            onChange={(v) => replaceStore.update(v, { replace, keepHash })}
          />
          <DemoCheckbox
            label="keepHash (preserve URL hash)"
            checked={keepHash}
            onChange={(v) => keepHashStore.update(v, { replace, keepHash })}
          />
        </DemoColumn>
        <DemoColumn>
          <CodePreview label="window.location.search" value={currentSearch || "(empty)"} />
          <CodePreview label="$qs (parsed)" value={objectInspect(qs, { indent: 2 })} />
        </DemoColumn>
      </DemoRow>
    </DemoContainer>
  );
}

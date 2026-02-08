import { useStore } from "@nanostores/react";
import { createQsUtils } from "@vp-tw/nanostores-qs";
import { presetIntOptional, presetStringOptional } from "@vp-tw/nanostores-qs/presets";
import objectInspect from "object-inspect";
import { parse, stringify } from "qs";

import {
  CodePreview,
  DemoColumn,
  DemoContainer,
  DemoInput,
  DemoLabel,
  DemoRow,
  DemoTabList,
  DemoTabPanel,
} from "../demo-ui";

// Default: uses URLSearchParams
const defaultUtils = createQsUtils();
const defaultStore = defaultUtils.createSearchParamsStore({
  name: presetStringOptional,
  age: presetIntOptional,
});

// Custom: uses qs library
const qsLibUtils = createQsUtils({
  qs: {
    parse: (search) => parse(search, { ignoreQueryPrefix: true }),
    stringify: (values) => stringify(values),
  },
});
const qsLibStore = qsLibUtils.createSearchParamsStore({
  name: presetStringOptional,
  age: presetIntOptional,
});

const tabs = ["URLSearchParams", "qs library"] as const;
type Tab = (typeof tabs)[number];

export default function CustomQsLibDemo() {
  const defaultValues = useStore(defaultStore.$values);
  const defaultSearch = useStore(defaultUtils.$search);
  const defaultQs = useStore(defaultUtils.$qs);

  const qsValues = useStore(qsLibStore.$values);
  const qsSearch = useStore(qsLibUtils.$search);
  const qsQs = useStore(qsLibUtils.$qs);

  // Use simple state since both share URL
  const activeTab: Tab = "URLSearchParams";

  return (
    <DemoContainer>
      <DemoLabel>Custom QS Library: Side-by-Side Comparison</DemoLabel>
      <DemoTabList
        tabs={tabs}
        active={activeTab}
        onChange={() => {
          // Both tabs share the same URL — switching is visual only
        }}
      />

      <DemoRow>
        <DemoColumn>
          <DemoLabel>URLSearchParams (default)</DemoLabel>
          <DemoInput
            label="name"
            type="text"
            value={defaultValues.name ?? ""}
            onChange={(e) =>
              defaultStore.updateAll({
                ...defaultValues,
                name: e.currentTarget.value || undefined,
              })
            }
            onClear={() => defaultStore.updateAll({ ...defaultValues, name: undefined })}
          />
          <DemoInput
            label="age"
            type="number"
            value={defaultValues.age === undefined ? "" : defaultValues.age}
            onChange={(e) => {
              const v = e.currentTarget.value;
              defaultStore.update("age", v === "" ? undefined : Number(v));
            }}
            onClear={() => defaultStore.update("age", undefined)}
          />
          <CodePreview label="$search" value={defaultSearch || "(empty)"} />
          <CodePreview label="$qs" value={objectInspect(defaultQs, { indent: 2 })} />
        </DemoColumn>

        <DemoColumn>
          <DemoLabel>qs library (custom)</DemoLabel>
          <DemoInput
            label="name"
            type="text"
            value={qsValues.name ?? ""}
            onChange={(e) =>
              qsLibStore.updateAll({
                ...qsValues,
                name: e.currentTarget.value || undefined,
              })
            }
            onClear={() => qsLibStore.updateAll({ ...qsValues, name: undefined })}
          />
          <DemoInput
            label="age"
            type="number"
            value={qsValues.age === undefined ? "" : qsValues.age}
            onChange={(e) => {
              const v = e.currentTarget.value;
              qsLibStore.update("age", v === "" ? undefined : Number(v));
            }}
            onClear={() => qsLibStore.update("age", undefined)}
          />
          <CodePreview label="$search" value={qsSearch || "(empty)"} />
          <CodePreview label="$qs" value={objectInspect(qsQs, { indent: 2 })} />
        </DemoColumn>
      </DemoRow>
    </DemoContainer>
  );
}

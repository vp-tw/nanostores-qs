import { useStore } from "@nanostores/react";
import { createQsUtils } from "@vp-tw/nanostores-qs";
import * as presets from "@vp-tw/nanostores-qs/presets";
import objectInspect from "object-inspect";
import { parse as qsParse, stringify as qsStringify } from "qs";
import queryString from "query-string";

import {
  CodePreview,
  DemoCheckbox,
  DemoContainer,
  DemoInput,
  DemoLabel,
  DemoMultiSelect,
} from "../demo-ui";
import styles from "./CustomQsLibDemo.module.css";

const tagOptions = ["react", "vue", "svelte", "solid"] as const;

// --- URLSearchParams (default) ---
const defaultUtils = createQsUtils();
const defaultStore = defaultUtils.createSearchParamsStore({
  name: presets.string({ optional: true }),
  tags: presets.enum(tagOptions, { array: true }),
});

// --- qs library (brackets array format) ---
const qsUtils = createQsUtils({
  qs: {
    parse: (search) => qsParse(search, { ignoreQueryPrefix: true }),
    stringify: (values) => qsStringify(values, { arrayFormat: "brackets" }),
  },
});
const qsStore = qsUtils.createSearchParamsStore({
  name: presets.string({ optional: true }),
  tags: presets.enum(tagOptions, { array: true }),
});

// --- query-string (comma array format) ---
const queryStringUtils = createQsUtils({
  qs: {
    parse: (search) => queryString.parse(search, { arrayFormat: "comma" }),
    stringify: (values) =>
      queryString.stringify(values as Record<string, unknown>, { arrayFormat: "comma" }),
  },
});
const queryStringStore = queryStringUtils.createSearchParamsStore({
  name: presets.string({ optional: true }),
  tags: presets.enum(tagOptions, { array: true }),
});

interface LibPanelProps {
  label: string;
  sublabel: string;
  utils: ReturnType<typeof createQsUtils>;
  store: ReturnType<
    typeof defaultUtils.createSearchParamsStore<
      typeof defaultStore extends { $values: { get: () => infer T } } ? Record<string, any> : never
    >
  >;
  values: { name: string | undefined; tags: ReadonlyArray<string> };
}

function LibPanel({ label, sublabel, utils, values, store }: LibPanelProps) {
  const search = useStore(utils.$search);
  const qs = useStore(utils.$qs);

  return (
    <div className={styles.libGroup}>
      <DemoLabel>{label}</DemoLabel>
      <div className={styles.sublabel}>{sublabel}</div>
      <DemoInput
        label="name"
        type="text"
        placeholder="e.g. John"
        value={values.name ?? ""}
        onChange={(e) =>
          store.updateAll({ ...values, name: e.currentTarget.value || undefined } as any)
        }
        onClear={() => store.updateAll({ ...values, name: undefined } as any)}
      />
      <DemoMultiSelect
        label="tags (array)"
        options={tagOptions}
        value={[...values.tags]}
        onChange={(v) => store.updateAll({ ...values, tags: v } as any)}
      />
      <CodePreview label="$search" value={search || "(empty)"} />
      <CodePreview label="$qs" value={objectInspect(qs, { indent: 2 })} />
    </div>
  );
}

export default function CustomQsLibDemo() {
  const defaultValues = useStore(defaultStore.$values);
  const qsValues = useStore(qsStore.$values);
  const queryStringValues = useStore(queryStringStore.$values);

  return (
    <DemoContainer>
      <DemoLabel>Custom QS Library: Array Format Comparison</DemoLabel>
      <div className={styles.libRow}>
        <LibPanel
          label="URLSearchParams"
          sublabel="tags=react&tags=vue"
          utils={defaultUtils}
          store={defaultStore as any}
          values={defaultValues}
        />
        <LibPanel
          label="qs"
          sublabel="tags[]=react&tags[]=vue"
          utils={qsUtils}
          store={qsStore as any}
          values={qsValues}
        />
        <LibPanel
          label="query-string"
          sublabel="tags=react,vue"
          utils={queryStringUtils}
          store={queryStringStore as any}
          values={queryStringValues}
        />
      </div>
    </DemoContainer>
  );
}

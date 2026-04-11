import { useStore } from "@nanostores/react";
import { createQsUtils } from "@vp-tw/nanostores-qs";
import * as presets from "@vp-tw/nanostores-qs/presets";
import objectInspect from "object-inspect";
import { parse as qsParse, stringify as qsStringify } from "qs";
import queryString from "query-string";
import { useMemo, useRef, useState } from "react";

import {
  CodePreview,
  DemoContainer,
  DemoInput,
  DemoLabel,
  DemoMultiSelect,
  DemoRow,
  DemoSelect,
} from "../demo-ui";
import styles from "./CustomQsLibDemo.module.css";

const tagOptions = ["react", "vue", "svelte", "solid"] as const;

// --- qs array formats ---

const qsFormats = ["indices", "brackets", "repeat", "comma"] as const;
type QsFormat = (typeof qsFormats)[number];

const qsFormatExamples: Record<QsFormat, string> = {
  indices: "tags[0]=react&tags[1]=vue",
  brackets: "tags[]=react&tags[]=vue",
  repeat: "tags=react&tags=vue",
  comma: "tags=react,vue",
};

function createQsInstance(format: QsFormat) {
  return createQsUtils({
    qs: {
      parse: (search) =>
        qsParse(search, {
          ignoreQueryPrefix: true,
          comma: format === "comma",
        }),
      stringify: (values) => qsStringify(values, { arrayFormat: format }),
    },
  });
}

// --- query-string array formats ---

const queryStringFormats = [
  "bracket",
  "index",
  "comma",
  "separator",
  "bracket-separator",
  "colon-list-separator",
  "none",
] as const;
type QueryStringFormat = (typeof queryStringFormats)[number];

const queryStringFormatExamples: Record<QueryStringFormat, string> = {
  bracket: "tags[]=react&tags[]=vue",
  index: "tags[0]=react&tags[1]=vue",
  comma: "tags=react,vue",
  separator: "tags=react,vue",
  "bracket-separator": "tags[]=react,vue",
  "colon-list-separator": "tags:list=react&tags:list=vue",
  none: "tags=react&tags=vue",
};

function createQueryStringInstance(format: QueryStringFormat) {
  return createQsUtils({
    qs: {
      parse: (search) => queryString.parse(search, { arrayFormat: format }),
      stringify: (values) =>
        queryString.stringify(values as Record<string, unknown>, { arrayFormat: format }),
    },
  });
}

// --- URLSearchParams (fixed, no format options) ---

const defaultUtils = createQsUtils();
const defaultStore = defaultUtils.createSearchParamsStore({
  name: presets.string({ optional: true }),
  tags: presets.enum(tagOptions, { array: true }),
});

// --- Dynamic lib panel ---

function useQsLib(format: QsFormat) {
  const ref = useRef<{ format: QsFormat; utils: ReturnType<typeof createQsUtils>; store: any }>();
  if (!ref.current || ref.current.format !== format) {
    const utils = createQsInstance(format);
    const store = utils.createSearchParamsStore({
      name: presets.string({ optional: true }),
      tags: presets.enum(tagOptions, { array: true }),
    });
    ref.current = { format, utils, store };
  }
  return ref.current;
}

function useQueryStringLib(format: QueryStringFormat) {
  const ref = useRef<{
    format: QueryStringFormat;
    utils: ReturnType<typeof createQsUtils>;
    store: any;
  }>();
  if (!ref.current || ref.current.format !== format) {
    const utils = createQueryStringInstance(format);
    const store = utils.createSearchParamsStore({
      name: presets.string({ optional: true }),
      tags: presets.enum(tagOptions, { array: true }),
    });
    ref.current = { format, utils, store };
  }
  return ref.current;
}

function LibPanel({
  label,
  sublabel,
  utils,
  store,
  formatSelector,
}: {
  label: string;
  sublabel: string;
  utils: ReturnType<typeof createQsUtils>;
  store: any;
  formatSelector?: React.ReactNode;
}) {
  const values = useStore(store.$values);
  const search = useStore(utils.$search);
  const qs = useStore(utils.$qs);

  return (
    <div className={styles.libGroup}>
      <DemoLabel>{label}</DemoLabel>
      {formatSelector}
      <div className={styles.sublabel}>{sublabel}</div>
      <DemoInput
        label="name"
        type="text"
        placeholder="e.g. John"
        value={(values as any).name ?? ""}
        onChange={(e) =>
          store.updateAll({ ...values, name: e.currentTarget.value || undefined } as any)
        }
        onClear={() => store.updateAll({ ...values, name: undefined } as any)}
      />
      <DemoMultiSelect
        label="tags (array)"
        options={tagOptions}
        value={[...((values as any).tags ?? [])]}
        onChange={(v) => store.updateAll({ ...values, tags: v } as any)}
      />
      <CodePreview label="$search" value={search || "(empty)"} />
      <CodePreview label="$qs" value={objectInspect(qs, { indent: 2 })} />
    </div>
  );
}

export default function CustomQsLibDemo() {
  const [qsFormat, setQsFormat] = useState<QsFormat>("brackets");
  const [qsStringFormat, setQsStringFormat] = useState<QueryStringFormat>("comma");

  const qsLib = useQsLib(qsFormat);
  const queryStringLib = useQueryStringLib(qsStringFormat);

  return (
    <DemoContainer>
      <DemoLabel>Custom QS Library: Array Format Comparison</DemoLabel>
      <div className={styles.libRow}>
        <LibPanel
          label="URLSearchParams"
          sublabel="tags=react&tags=vue"
          utils={defaultUtils}
          store={defaultStore}
        />
        <LibPanel
          label="qs"
          sublabel={qsFormatExamples[qsFormat]}
          utils={qsLib.utils}
          store={qsLib.store}
          formatSelector={
            <DemoSelect
              label="arrayFormat"
              options={qsFormats}
              value={qsFormat}
              onChange={(v) => setQsFormat(v as QsFormat)}
            />
          }
        />
        <LibPanel
          label="query-string"
          sublabel={queryStringFormatExamples[qsStringFormat]}
          utils={queryStringLib.utils}
          store={queryStringLib.store}
          formatSelector={
            <DemoSelect
              label="arrayFormat"
              options={queryStringFormats}
              value={qsStringFormat}
              onChange={(v) => setQsStringFormat(v as QueryStringFormat)}
            />
          }
        />
      </div>
    </DemoContainer>
  );
}

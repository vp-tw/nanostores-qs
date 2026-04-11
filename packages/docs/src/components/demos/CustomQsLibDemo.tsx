import { useStore } from "@nanostores/react";
import { createQsUtils } from "@vp-tw/nanostores-qs";
import * as presets from "@vp-tw/nanostores-qs/presets";
import { stringify as qsStringify } from "qs";
import queryString from "query-string";
import { useMemo } from "react";

import {
  CodePreview,
  DemoColumn,
  DemoContainer,
  DemoInput,
  DemoLabel,
  DemoMultiSelect,
  DemoRow,
} from "../demo-ui";
import styles from "./CustomQsLibDemo.module.css";

const tagOptions = ["react", "vue", "svelte", "solid"] as const;

const qsUtils = createQsUtils();
const store = qsUtils.createSearchParamsStore({
  name: presets.string({ optional: true }),
  tags: presets.enum(tagOptions, { array: true }),
});

// --- Format definitions ---

interface FormatEntry {
  lib: string;
  format: string;
  stringify: (data: Record<string, unknown>) => string;
}

const formats: Array<FormatEntry> = [
  {
    lib: "URLSearchParams",
    format: "(native)",
    stringify: (data) => new URLSearchParams(data as Record<string, string>).toString(),
  },
  // qs
  ...(["indices", "brackets", "repeat", "comma"] as const).map((f) => ({
    lib: "qs",
    format: f,
    stringify: (data: Record<string, unknown>) =>
      qsStringify(data, { arrayFormat: f, encode: false }),
  })),
  // query-string
  ...(
    [
      "bracket",
      "index",
      "comma",
      "separator",
      "bracket-separator",
      "colon-list-separator",
      "none",
    ] as const
  ).map((f) => ({
    lib: "query-string",
    format: f,
    stringify: (data: Record<string, unknown>) =>
      queryString.stringify(data, { arrayFormat: f, encode: false }),
  })),
];

export default function CustomQsLibDemo() {
  const values = useStore(store.$values);
  const currentSearch = useStore(qsUtils.$search);

  const data = useMemo(() => {
    const d: Record<string, unknown> = {};
    if (values.name !== undefined) d.name = values.name;
    if (values.tags.length > 0) d.tags = values.tags;
    return d;
  }, [values.name, values.tags]);

  const results = useMemo(
    () =>
      formats.map((f) => {
        try {
          return { ...f, output: f.stringify(data) || "(empty)" };
        } catch {
          return { ...f, output: "(error)" };
        }
      }),
    [data],
  );

  // Group by lib
  const grouped = useMemo(() => {
    const map = new Map<string, Array<{ format: string; output: string }>>();
    for (const r of results) {
      if (!map.has(r.lib)) map.set(r.lib, []);
      map.get(r.lib)!.push({ format: r.format, output: r.output });
    }
    return map;
  }, [results]);

  return (
    <DemoContainer>
      <DemoLabel>Custom QS Library: Array Format Comparison</DemoLabel>
      <DemoRow>
        <DemoColumn>
          <DemoInput
            label="name"
            type="text"
            placeholder="e.g. John"
            value={values.name ?? ""}
            onChange={(e) =>
              store.updateAll({ ...values, name: e.currentTarget.value || undefined })
            }
            onClear={() => store.updateAll({ ...values, name: undefined })}
          />
          <DemoMultiSelect
            label="tags (array)"
            options={tagOptions}
            value={[...values.tags]}
            onChange={(v) =>
              store.updateAll({
                ...values,
                tags: v as typeof values.tags,
              })
            }
          />
          <CodePreview label="window.location.search" value={currentSearch || "(empty)"} />
        </DemoColumn>
        <DemoColumn>
          {Array.from(grouped.entries()).map(([lib, entries]) => (
            <div key={lib} className={styles.libGroup}>
              <DemoLabel>{lib}</DemoLabel>
              <table className={styles.formatTable}>
                <tbody>
                  {entries.map((e) => (
                    <tr key={e.format}>
                      <td className={styles.formatName}>{e.format}</td>
                      <td className={styles.formatOutput}>{e.output}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}
        </DemoColumn>
      </DemoRow>
    </DemoContainer>
  );
}

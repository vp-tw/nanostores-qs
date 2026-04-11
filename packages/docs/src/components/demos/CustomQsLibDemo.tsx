import { stringify as qsStringify } from "qs";
import queryString from "query-string";
import { useMemo, useState } from "react";

import {
  DemoColumn,
  DemoContainer,
  DemoInput,
  DemoLabel,
  DemoMultiSelect,
  DemoRow,
} from "../demo-ui";
import styles from "./CustomQsLibDemo.module.css";

const tagOptions = ["react", "vue", "svelte", "solid"] as const;

interface FormatEntry {
  lib: string;
  format: string;
  stringify: (data: Record<string, unknown>) => string;
}

const formats: Array<FormatEntry> = [
  {
    lib: "URLSearchParams",
    format: "(native)",
    stringify: (data) => {
      const params = new URLSearchParams();
      for (const [k, v] of Object.entries(data)) {
        if (Array.isArray(v)) {
          for (const item of v) params.append(k, String(item));
        } else if (v !== undefined) {
          params.set(k, String(v));
        }
      }
      return params.toString();
    },
  },
  ...(["indices", "brackets", "repeat", "comma"] as const).map((f) => ({
    lib: "qs",
    format: f,
    stringify: (data: Record<string, unknown>) =>
      qsStringify(data, { arrayFormat: f, encode: false }),
  })),
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
  {
    lib: "query-string",
    format: "separator (|)",
    stringify: (data: Record<string, unknown>) =>
      queryString.stringify(data, {
        arrayFormat: "separator",
        arrayFormatSeparator: "|",
        encode: false,
      }),
  },
];

export default function CustomQsLibDemo() {
  const [name, setName] = useState("");
  const [tags, setTags] = useState<Array<string>>([]);

  const data = useMemo(() => {
    const d: Record<string, unknown> = {};
    if (name) d.name = name;
    if (tags.length > 0) d.tags = tags;
    return d;
  }, [name, tags]);

  const grouped = useMemo(() => {
    const map = new Map<string, Array<{ format: string; output: string }>>();
    for (const f of formats) {
      if (!map.has(f.lib)) map.set(f.lib, []);
      try {
        map.get(f.lib)!.push({ format: f.format, output: f.stringify(data) || "(empty)" });
      } catch {
        map.get(f.lib)!.push({ format: f.format, output: "(error)" });
      }
    }
    return map;
  }, [data]);

  return (
    <DemoContainer>
      <DemoLabel>Custom QS Library: Array Format Comparison</DemoLabel>
      <DemoRow>
        <DemoColumn>
          <DemoInput
            label="name"
            type="text"
            placeholder="e.g. John"
            value={name}
            onChange={(e) => setName(e.currentTarget.value)}
            onClear={() => setName("")}
          />
          <DemoMultiSelect
            label="tags (array)"
            options={tagOptions}
            value={tags}
            onChange={setTags}
          />
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

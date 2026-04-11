import { useStore } from "@nanostores/react";
import { createQsUtils } from "@vp-tw/nanostores-qs";
import { createPreset } from "@vp-tw/nanostores-qs/presets";
import { Decimal } from "decimal.js";

import {
  CodePreview,
  DemoColumn,
  DemoContainer,
  DemoInput,
  DemoLabel,
  DemoRow,
  DemoSelect,
} from "../demo-ui";
import { inspect } from "./inspect";

const qsUtils = createQsUtils();

// --- Reusable enum preset (same pattern as zodEnum) ---

function enumPreset<const T extends readonly [string, ...Array<string>]>(values: T) {
  return createPreset<T[number], T[0]>({
    decode: (v) => {
      const s = String(v);
      if (!(values as ReadonlyArray<string>).includes(s)) throw new Error("invalid enum");
      return s as T[number];
    },
    defaultValue: values[0],
  });
}

// --- Reusable decimal input (raw string + resolve to Decimal) ---

function decimalInput(defaultValue: string) {
  return {
    decode: (v: unknown): string => (v == null ? "" : String(v)),
    defaultValue: "",
    encode: (v: string): string | undefined => (v === "" ? undefined : v),
    resolve: (v: string): Decimal => {
      if (v === "") return new Decimal(defaultValue);
      try {
        return new Decimal(v);
      } catch {
        return new Decimal(defaultValue);
      }
    },
  };
}

// --- Same use case as inline demo ---

const sortOptions = ["price_asc", "price_desc", "newest"] as const;
const sortPreset = enumPreset(sortOptions);

const sortStore = qsUtils.createSearchParamStore("sort", sortPreset());
const priceStore = qsUtils.createSearchParamStore("price", decimalInput("0"));
const taxStore = qsUtils.createSearchParamStore("tax", decimalInput("0.1"));

export default function CustomPresetReusableDemo() {
  const sort = useStore(sortStore.$value);
  const priceInput = useStore(priceStore.$value);
  const price = useStore(priceStore.$resolved);
  const taxInput = useStore(taxStore.$value);
  const tax = useStore(taxStore.$resolved);
  const currentSearch = useStore(qsUtils.$search);

  const total = price.mul(Decimal.sum(1, tax));

  return (
    <DemoContainer>
      <DemoLabel>Reusable Presets (enumPreset + decimalInput)</DemoLabel>
      <DemoRow>
        <DemoColumn>
          <DemoSelect
            label="sort — enumPreset(sortOptions)"
            options={sortOptions}
            value={sort}
            onChange={(v) => sortStore.update(v)}
          />
          <DemoInput
            label="price — decimalInput('0')"
            type="text"
            inputMode="decimal"
            placeholder="e.g. 19.99"
            value={priceInput}
            onChange={(e) => priceStore.update(e.currentTarget.value)}
            onClear={() => priceStore.update("")}
          />
          <DemoInput
            label="tax — decimalInput('0.1')"
            type="text"
            inputMode="decimal"
            placeholder="e.g. 0.1"
            value={taxInput}
            onChange={(e) => taxStore.update(e.currentTarget.value)}
            onClear={() => taxStore.update("")}
          />
        </DemoColumn>
        <DemoColumn>
          <CodePreview
            label="Store values"
            value={inspect({
              sort,
              "price.$value": priceInput,
              "price.$resolved": price,
              "tax.$value": taxInput,
              "tax.$resolved": tax,
              "total (price × (1+tax))": total,
            })}
          />
          <CodePreview label="window.location.search" value={currentSearch || "(empty)"} />
        </DemoColumn>
      </DemoRow>
    </DemoContainer>
  );
}

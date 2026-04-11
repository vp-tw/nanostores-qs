import { useStore } from "@nanostores/react";
import { createQsUtils } from "@vp-tw/nanostores-qs";
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

// --- Enum: as const array + manual validator (same pattern as z.enum) ---

const sortOptions = ["price_asc", "price_desc", "newest"] as const;

const sortStore = qsUtils.createSearchParamStore("sort", {
  decode: (v: unknown): (typeof sortOptions)[number] => {
    const s = String(v);
    if (!(sortOptions as ReadonlyArray<string>).includes(s)) throw new Error("invalid sort");
    return s as (typeof sortOptions)[number];
  },
  defaultValue: sortOptions[0],
});

// --- Decimal: resolve pattern for input binding ---

const DEFAULT_PRICE = "0";

const priceStore = qsUtils.createSearchParamStore("price", {
  decode: (v: unknown): string => {
    if (v == null) return "";
    try {
      const d = new Decimal(String(v));
      if (!d.isFinite()) return "";
      return d.toString();
    } catch {
      return "";
    }
  },
  defaultValue: "",
  encode: (v: string): string | undefined => (v === "" ? undefined : v),
  resolve: (v: string): Decimal => (v === "" ? new Decimal(DEFAULT_PRICE) : new Decimal(v)),
});

const DEFAULT_TAX = "0.1";

const taxStore = qsUtils.createSearchParamStore("tax", {
  decode: (v: unknown): string => {
    if (v == null) return "";
    try {
      const d = new Decimal(String(v));
      if (!d.isFinite()) return "";
      return d.toString();
    } catch {
      return "";
    }
  },
  defaultValue: "",
  encode: (v: string): string | undefined => (v === "" ? undefined : v),
  resolve: (v: string): Decimal => (v === "" ? new Decimal(DEFAULT_TAX) : new Decimal(v)),
});

export default function CustomPresetInlineDemo() {
  const sort = useStore(sortStore.$value);
  const priceInput = useStore(priceStore.$value);
  const price = useStore(priceStore.$resolved);
  const taxInput = useStore(taxStore.$value);
  const tax = useStore(taxStore.$resolved);
  const currentSearch = useStore(qsUtils.$search);

  const total = price.mul(Decimal.sum(1, tax));

  return (
    <DemoContainer>
      <DemoLabel>Plain Config (inline decode/encode/resolve)</DemoLabel>
      <DemoRow>
        <DemoColumn>
          <DemoSelect
            label="sort — enum validator"
            options={sortOptions}
            value={sort}
            onChange={(v) => sortStore.update(v)}
          />
          <DemoInput
            label="price — Decimal with resolve"
            type="text"
            inputMode="decimal"
            placeholder="e.g. 19.99"
            value={priceInput}
            onChange={(e) => priceStore.update(e.currentTarget.value)}
            onClear={() => priceStore.update("")}
          />
          <DemoInput
            label="tax — Decimal with resolve"
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

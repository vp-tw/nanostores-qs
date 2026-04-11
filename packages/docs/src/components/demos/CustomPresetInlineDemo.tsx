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

const sortOptions = ["price_asc", "price_desc", "newest"] as const;

const sortStore = qsUtils.createSearchParamStore("i_sort", {
  decode: (v: unknown): (typeof sortOptions)[number] => {
    const s = String(v);
    if (!(sortOptions as ReadonlyArray<string>).includes(s)) throw new Error("invalid sort");
    return s as (typeof sortOptions)[number];
  },
  defaultValue: sortOptions[0],
} satisfies createQsUtils.StoreConfig<{
  value: (typeof sortOptions)[number];
  defaultValue: (typeof sortOptions)[0];
}>);

type DecimalConfig = createQsUtils.StoreConfig<{
  value: string;
  defaultValue: string;
  resolved: Decimal;
}>;

function decimalConfig(fallback: string): DecimalConfig {
  return {
    decode: (v: unknown): string => (v == null ? "" : String(v)),
    defaultValue: "",
    encode: (v: string): string | undefined => (v === "" ? undefined : v),
    resolve: (v: string): Decimal => {
      if (v === "") return new Decimal(fallback);
      try {
        return new Decimal(v);
      } catch {
        return new Decimal(fallback);
      }
    },
  };
}

const priceStore = qsUtils.createSearchParamStore("i_price", decimalConfig("0"));
const taxStore = qsUtils.createSearchParamStore("i_tax", decimalConfig("0.1"));

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

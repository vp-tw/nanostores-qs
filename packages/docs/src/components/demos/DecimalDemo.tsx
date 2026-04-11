import { useStore } from "@nanostores/react";
import { createQsUtils } from "@vp-tw/nanostores-qs";
import { createPreset } from "@vp-tw/nanostores-qs/presets";
import { Decimal } from "decimal.js";
import { useRef } from "react";

import { CodePreview, DemoColumn, DemoContainer, DemoInput, DemoLabel, DemoRow } from "../demo-ui";
import { inspect } from "./inspect";

const DEFAULT_PRICE = "0";
const DEFAULT_TAX = "0.1";

function createStores() {
  const qsUtils = createQsUtils();

  // Inline (plain config with resolve)
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

  // Reusable preset
  const decimal = createPreset<Decimal>({
    decode: (v) => {
      const d = new Decimal(String(v));
      if (!d.isFinite()) throw new Error("invalid decimal");
      return d;
    },
    defaultValue: new Decimal(DEFAULT_TAX),
    encode: (v) => v.toString(),
  });

  const taxStore = qsUtils.createSearchParamStore("tax", decimal());

  return { qsUtils, priceStore, taxStore };
}

function useStores() {
  const ref = useRef<ReturnType<typeof createStores>>();
  if (!ref.current) {
    ref.current = createStores();
  }
  return ref.current;
}

export default function DecimalDemo() {
  const { qsUtils, priceStore, taxStore } = useStores();

  const priceInput = useStore(priceStore.$value);
  const price = useStore(priceStore.$resolved);
  const tax = useStore(taxStore.$value);
  const currentSearch = useStore(qsUtils.$search);

  const total = price.mul(Decimal.sum(1, tax));

  return (
    <DemoContainer>
      <DemoLabel>decimal.js Integration</DemoLabel>
      <DemoRow>
        <DemoColumn>
          <DemoInput
            label="price — plain config + resolve"
            type="text"
            inputMode="decimal"
            placeholder="Enter price (e.g. 19.99)"
            value={priceInput}
            onChange={(e) => priceStore.update(e.currentTarget.value)}
            onClear={() => priceStore.update("")}
          />
          <DemoInput
            label="tax — decimal() preset"
            type="text"
            inputMode="decimal"
            placeholder="Enter tax rate (e.g. 0.1)"
            value={tax.toString()}
            onChange={(e) => {
              try {
                const d = new Decimal(e.currentTarget.value);
                taxStore.update(d);
              } catch {
                /* ignore invalid input mid-typing */
              }
            }}
            onClear={() => taxStore.update(new Decimal(DEFAULT_TAX))}
          />
        </DemoColumn>
        <DemoColumn>
          <CodePreview
            label="Store values"
            value={inspect({
              "price.$value": priceInput,
              "price.$resolved": price,
              tax,
              "total (price × (1 + tax))": total,
            })}
          />
          <CodePreview label="window.location.search" value={currentSearch || "(empty)"} />
        </DemoColumn>
      </DemoRow>
    </DemoContainer>
  );
}

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

const categoryOptions = ["electronics", "clothing", "books"] as const;
const categoryPreset = enumPreset(categoryOptions);
const categoryStore = qsUtils.createSearchParamStore("category", categoryPreset());

// --- Reusable decimal preset ---

const decimal = createPreset<Decimal>({
  decode: (v) => {
    const d = new Decimal(String(v));
    if (!d.isFinite()) throw new Error("invalid decimal");
    return d;
  },
  defaultValue: new Decimal(0),
  encode: (v) => v.toString(),
});

const amountStore = qsUtils.createSearchParamStore(
  "amount",
  decimal({ default: new Decimal(100) }),
);
const discountStore = qsUtils.createSearchParamStore(
  "discount",
  decimal({ default: new Decimal("0.1") }),
);

export default function CustomPresetReusableDemo() {
  const category = useStore(categoryStore.$value);
  const amount = useStore(amountStore.$value);
  const discount = useStore(discountStore.$value);
  const currentSearch = useStore(qsUtils.$search);

  const finalAmount = amount.mul(Decimal.sub(1, discount));

  return (
    <DemoContainer>
      <DemoLabel>createPreset (reusable preset functions)</DemoLabel>
      <DemoRow>
        <DemoColumn>
          <DemoSelect
            label="category — enumPreset(categoryOptions)"
            options={categoryOptions}
            value={category}
            onChange={(v) => categoryStore.update(v)}
          />
          <DemoInput
            label="amount — decimal({ default: 100 })"
            type="text"
            inputMode="decimal"
            placeholder="e.g. 100"
            value={amount.toString()}
            onChange={(e) => {
              try {
                amountStore.update(new Decimal(e.currentTarget.value));
              } catch {
                /* ignore invalid mid-typing */
              }
            }}
            onClear={() => amountStore.update(new Decimal(100))}
          />
          <DemoInput
            label="discount — decimal({ default: 0.1 })"
            type="text"
            inputMode="decimal"
            placeholder="e.g. 0.1"
            value={discount.toString()}
            onChange={(e) => {
              try {
                discountStore.update(new Decimal(e.currentTarget.value));
              } catch {
                /* ignore invalid mid-typing */
              }
            }}
            onClear={() => discountStore.update(new Decimal("0.1"))}
          />
        </DemoColumn>
        <DemoColumn>
          <CodePreview
            label="Store values"
            value={inspect({
              category,
              amount,
              discount,
              "final (amount × (1-discount))": finalAmount,
            })}
          />
          <CodePreview label="window.location.search" value={currentSearch || "(empty)"} />
        </DemoColumn>
      </DemoRow>
    </DemoContainer>
  );
}

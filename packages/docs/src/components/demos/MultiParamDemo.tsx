import { useStore } from "@nanostores/react";
import { createQsUtils } from "@vp-tw/nanostores-qs";
import * as presets from "@vp-tw/nanostores-qs/presets";
import objectInspect from "object-inspect";

import {
  CodePreview,
  DemoButton,
  DemoColumn,
  DemoContainer,
  DemoInput,
  DemoLabel,
  DemoMultiSelect,
  DemoRow,
} from "../demo-ui";

const qsUtils = createQsUtils();

const categoryOptions = ["electronics", "clothing", "books", "sports"] as const;

const filters = qsUtils.createSearchParamsStore({
  search: presets.string(),
  page: presets.integer({ default: 1, min: 1 }),
  categories: presets.enum(categoryOptions, { array: true }),
});

export default function MultiParamDemo() {
  const values = useStore(filters.$values);
  const currentSearch = useStore(qsUtils.$search);

  const handleSearchChange = (term: string) => {
    filters.updateAll({ ...values, search: term, page: 1 });
  };

  return (
    <DemoContainer>
      <DemoLabel>Multi-Parameter Store with Presets</DemoLabel>
      <DemoRow>
        <DemoColumn>
          <DemoInput
            label="search (string)"
            type="text"
            placeholder="Search products..."
            value={values.search}
            onChange={(e) => handleSearchChange(e.currentTarget.value)}
            onClear={() => handleSearchChange("")}
          />
          <DemoInput
            label="page (integer({ default: 1, min: 1 }))"
            type="number"
            placeholder="Page number"
            value={values.page}
            onChange={(e) => {
              const v = e.currentTarget.value;
              filters.update("page", v === "" ? 1 : Number(v));
            }}
            onClear={() => filters.update("page", 1)}
          />
          <DemoMultiSelect
            label="categories (enum({ array: true }))"
            options={categoryOptions}
            value={[...(values.categories ?? [])]}
            onChange={(v) =>
              filters.updateAll({ ...values, categories: v as typeof values.categories })
            }
          />
          <DemoButton onClick={() => filters.updateAll({ search: "", page: 1, categories: [] })}>
            Reset All
          </DemoButton>
        </DemoColumn>
        <DemoColumn>
          <CodePreview label="$values" value={objectInspect(values, { indent: 2 })} />
          <CodePreview label="window.location.search" value={currentSearch || "(empty)"} />
        </DemoColumn>
      </DemoRow>
    </DemoContainer>
  );
}

import { useStore } from "@nanostores/react";
import { createQsUtils } from "@vp-tw/nanostores-qs";
import { presetEnumArray, presetIntOptional, presetString } from "@vp-tw/nanostores-qs/presets";
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
  search: presetString,
  page: presetIntOptional,
  categories: presetEnumArray(categoryOptions),
});

export default function MultiParamDemo() {
  const values = useStore(filters.$values);
  const currentSearch = useStore(qsUtils.$search);

  const handleSearchChange = (term: string) => {
    filters.updateAll({ ...values, search: term, page: undefined });
  };

  return (
    <DemoContainer>
      <DemoLabel>Multi-Parameter Store with Presets</DemoLabel>
      <DemoRow>
        <DemoColumn>
          <DemoInput
            label="search (presetString)"
            type="text"
            placeholder="Search products..."
            value={values.search}
            onChange={(e) => handleSearchChange(e.currentTarget.value)}
            onClear={() => handleSearchChange("")}
          />
          <DemoInput
            label="page (presetIntOptional)"
            type="number"
            placeholder="Page number"
            value={values.page === undefined ? "" : values.page}
            onChange={(e) => {
              const v = e.currentTarget.value;
              filters.update("page", v === "" ? undefined : Number(v));
            }}
            onClear={() => filters.update("page", undefined)}
          />
          <DemoMultiSelect
            label="categories (presetEnumArray)"
            options={categoryOptions}
            value={[...(values.categories ?? [])]}
            onChange={(v) =>
              filters.updateAll({ ...values, categories: v as typeof values.categories })
            }
          />
          <DemoButton
            onClick={() => filters.updateAll({ search: "", page: undefined, categories: [] })}
          >
            Reset All
          </DemoButton>
        </DemoColumn>
        <DemoColumn>
          <CodePreview label="window.location.search" value={currentSearch || "(empty)"} />
          <CodePreview label="$values" value={objectInspect(values, { indent: 2 })} />
          <CodePreview
            label=".updateAll.dry() preview"
            value={filters.updateAll.dry({ ...values, page: 1 })}
          />
        </DemoColumn>
      </DemoRow>
    </DemoContainer>
  );
}

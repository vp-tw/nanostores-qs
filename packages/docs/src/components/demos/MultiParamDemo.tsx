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

const PAGE_MIN = 1;
const PAGE_MAX = Number.MAX_SAFE_INTEGER;
const PAGE_DEFAULT = 1;

const filters = qsUtils.createSearchParamsStore({
  search: presets.string(),
  page: presets.integer({ numInput: true, default: PAGE_DEFAULT, min: PAGE_MIN, max: PAGE_MAX }),
  categories: presets.enum(categoryOptions, { array: true }),
});

export default function MultiParamDemo() {
  const values = useStore(filters.$values);
  const resolved = useStore(filters.$resolved);
  const currentSearch = useStore(qsUtils.$search);

  const handleSearchChange = (term: string) => {
    filters.updateAll({ ...values, search: term, page: "" });
  };

  return (
    <DemoContainer>
      <DemoLabel>Multi-Parameter Store with Presets</DemoLabel>
      <DemoRow>
        <DemoColumn>
          <DemoInput
            label="search — string()"
            type="text"
            placeholder="Search products..."
            value={values.search}
            onChange={(e) => handleSearchChange(e.currentTarget.value)}
            onClear={() => handleSearchChange("")}
          />
          <DemoInput
            label="page — integer({ numInput, default: 1, min: 1 })"
            type="number"
            min={PAGE_MIN}
            max={PAGE_MAX}
            placeholder="Page number"
            value={values.page}
            onChange={(e) => filters.update("page", e.currentTarget.value)}
            onClear={() => filters.update("page", "")}
          />
          <DemoMultiSelect
            label="categories — enum(opts, { array: true })"
            options={categoryOptions}
            value={[...(values.categories ?? [])]}
            onChange={(v) =>
              filters.updateAll({ ...values, categories: v as typeof values.categories })
            }
          />
          <DemoButton onClick={() => filters.updateAll({ search: "", page: "", categories: [] })}>
            Reset All
          </DemoButton>
        </DemoColumn>
        <DemoColumn>
          <CodePreview label="$values" value={objectInspect(values, { indent: 2 })} />
          <CodePreview label="$resolved" value={objectInspect(resolved, { indent: 2 })} />
          <CodePreview label="window.location.search" value={currentSearch || "(empty)"} />
        </DemoColumn>
      </DemoRow>
    </DemoContainer>
  );
}

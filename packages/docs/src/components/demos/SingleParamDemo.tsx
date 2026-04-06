import { useStore } from "@nanostores/react";
import { createQsUtils } from "@vp-tw/nanostores-qs";
import * as presets from "@vp-tw/nanostores-qs/presets";

import {
  CodePreview,
  DemoCheckbox,
  DemoColumn,
  DemoContainer,
  DemoInput,
  DemoLabel,
  DemoRow,
  DemoSelect,
} from "../demo-ui";

const qsUtils = createQsUtils();

const sortOptions = ["newest", "oldest", "popular"] as const;

const pageStore = qsUtils.createSearchParamStore("page", presets.integer({ default: 1, min: 0 }));
const searchStore = qsUtils.createSearchParamStore("q", presets.string({ optional: true }));
const sortStore = qsUtils.createSearchParamStore("sort", presets.enum(sortOptions));
const showArchivedStore = qsUtils.createSearchParamStore("archived", presets.boolean());

export default function SingleParamDemo() {
  const page = useStore(pageStore.$value);
  const search = useStore(searchStore.$value);
  const sort = useStore(sortStore.$value);
  const showArchived = useStore(showArchivedStore.$value);
  const currentSearch = useStore(qsUtils.$search);

  return (
    <DemoContainer>
      <DemoLabel>Single Parameter Stores with Presets</DemoLabel>
      <DemoRow>
        <DemoColumn>
          <DemoInput
            label="search (string({ optional: true }))"
            type="text"
            placeholder="Type to search..."
            value={search ?? ""}
            onChange={(e) => searchStore.update(e.currentTarget.value || undefined)}
            onClear={() => searchStore.update(undefined)}
          />
          <DemoInput
            label="page (integer({ default: 1, min: 0 }))"
            type="number"
            placeholder="Page number"
            value={page}
            onChange={(e) => {
              const v = e.currentTarget.value;
              pageStore.update(v === "" ? 1 : Number(v));
            }}
            onClear={() => pageStore.update(1)}
          />
          <DemoSelect
            label="sort (enum)"
            options={sortOptions}
            value={sort}
            onChange={(v) => sortStore.update(v)}
          />
          <DemoCheckbox
            label="archived (boolean)"
            checked={showArchived}
            onChange={(v) => showArchivedStore.update(v)}
          />
        </DemoColumn>
        <DemoColumn>
          <CodePreview label="window.location.search" value={currentSearch || "(empty)"} />
          <CodePreview label=".dry() preview" value={pageStore.update.dry(42)} />
        </DemoColumn>
      </DemoRow>
    </DemoContainer>
  );
}

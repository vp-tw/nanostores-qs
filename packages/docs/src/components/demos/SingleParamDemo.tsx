import { useStore } from "@nanostores/react";
import { createQsUtils } from "@vp-tw/nanostores-qs";
import {
  presetBoolean,
  presetEnum,
  presetInt,
  presetStringOptional,
} from "@vp-tw/nanostores-qs/presets";

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

const pageStore = qsUtils.createSearchParamStore("page", presetInt);
const searchStore = qsUtils.createSearchParamStore("q", presetStringOptional);
const sortStore = qsUtils.createSearchParamStore("sort", presetEnum(sortOptions));
const showArchivedStore = qsUtils.createSearchParamStore("archived", presetBoolean);

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
            label="search (presetStringOptional)"
            type="text"
            placeholder="Type to search..."
            value={search ?? ""}
            onChange={(e) => searchStore.update(e.currentTarget.value || undefined)}
            onClear={() => searchStore.update(undefined)}
          />
          <DemoInput
            label="page (presetInt)"
            type="number"
            placeholder="Page number"
            value={Number.isNaN(page) ? "" : page}
            onChange={(e) => {
              const v = e.currentTarget.value;
              pageStore.update(v === "" ? Number.NaN : Number(v));
            }}
            onClear={() => pageStore.update(Number.NaN)}
          />
          <DemoSelect
            label="sort (presetEnum)"
            options={sortOptions}
            value={sort}
            onChange={(v) => sortStore.update(v)}
          />
          <DemoCheckbox
            label="archived (presetBoolean)"
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

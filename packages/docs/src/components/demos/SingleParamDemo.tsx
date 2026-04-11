import { useStore } from "@nanostores/react";
import { createQsUtils } from "@vp-tw/nanostores-qs";
import * as presets from "@vp-tw/nanostores-qs/presets";
import objectInspect from "object-inspect";

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

const PAGE_MIN = 1;
const PAGE_MAX = Number.MAX_SAFE_INTEGER;
const PAGE_DEFAULT = 1;

const pageStore = qsUtils.createSearchParamStore(
  "page",
  presets.integer({ numInput: true, default: PAGE_DEFAULT, min: PAGE_MIN, max: PAGE_MAX }),
);
const searchStore = qsUtils.createSearchParamStore("q", presets.string({ optional: true }));
const sortStore = qsUtils.createSearchParamStore("sort", presets.enum(sortOptions));
const showArchivedStore = qsUtils.createSearchParamStore("archived", presets.boolean());

export default function SingleParamDemo() {
  const pageInput = useStore(pageStore.$value);
  const page = useStore(pageStore.$resolved);
  const search = useStore(searchStore.$value);
  const sort = useStore(sortStore.$value);
  const showArchived = useStore(showArchivedStore.$value);
  const currentSearch = useStore(qsUtils.$search);

  const storeValues = {
    q: search,
    "page.$value": pageInput,
    "page.$resolved": page,
    sort,
    archived: showArchived,
  };

  return (
    <DemoContainer>
      <DemoLabel>Single Parameter Stores with Presets</DemoLabel>
      <DemoRow>
        <DemoColumn>
          <DemoInput
            label="q — string({ optional: true })"
            type="text"
            placeholder="Type to search..."
            value={search ?? ""}
            onChange={(e) => searchStore.update(e.currentTarget.value || undefined)}
            onClear={() => searchStore.update(undefined)}
          />
          <DemoInput
            label="page — integer({ numInput, default, min, max })"
            type="number"
            min={PAGE_MIN}
            max={PAGE_MAX}
            placeholder="Page number"
            value={pageInput}
            onChange={(e) => pageStore.update(e.currentTarget.value)}
            onClear={() => pageStore.update("")}
          />
          <DemoSelect
            label="sort — enum(sortOptions)"
            options={sortOptions}
            value={sort}
            onChange={(v) => sortStore.update(v)}
          />
          <DemoCheckbox
            label="archived — boolean()"
            checked={showArchived}
            onChange={(v) => showArchivedStore.update(v)}
          />
        </DemoColumn>
        <DemoColumn>
          <CodePreview label="Store values" value={objectInspect(storeValues, { indent: 2 })} />
          <CodePreview label="window.location.search" value={currentSearch || "(empty)"} />
        </DemoColumn>
      </DemoRow>
    </DemoContainer>
  );
}

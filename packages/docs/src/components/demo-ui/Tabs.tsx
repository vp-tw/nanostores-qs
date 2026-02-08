import type { ReactNode } from "react";
import styles from "./Tabs.module.css";

function DemoTabList<T extends string>({
  tabs,
  active,
  onChange,
}: {
  tabs: ReadonlyArray<T>;
  active: T;
  onChange: (tab: T) => void;
}) {
  return (
    <div className={styles.tabList} role="tablist">
      {tabs.map((tab) => (
        <button
          key={tab}
          type="button"
          role="tab"
          aria-selected={tab === active}
          className={`${styles.tab} ${tab === active ? styles.tabActive : ""}`}
          onClick={() => onChange(tab)}
        >
          {tab}
        </button>
      ))}
    </div>
  );
}

function DemoTabPanel({ children }: { children: ReactNode }) {
  return (
    <div className={styles.tabPanel} role="tabpanel">
      {children}
    </div>
  );
}

export { DemoTabList, DemoTabPanel };

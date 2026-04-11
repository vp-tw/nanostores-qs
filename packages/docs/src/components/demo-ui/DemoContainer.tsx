import type { ReactNode } from "react";
import styles from "./DemoContainer.module.css";
import "./tokens.css";

function DemoContainer({ children }: { children: ReactNode }) {
  return <div className={styles.container}>{children}</div>;
}

function DemoLabel({ children }: { children: ReactNode }) {
  return <div className={styles.label}>{children}</div>;
}

function DemoRow({ children }: { children: ReactNode }) {
  return <div className={styles.row}>{children}</div>;
}

function DemoColumn({ children }: { children: ReactNode }) {
  return <div className={styles.column}>{children}</div>;
}

export { DemoColumn, DemoContainer, DemoLabel, DemoRow };

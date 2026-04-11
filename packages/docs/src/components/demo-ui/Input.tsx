import type { ComponentProps, ReactNode } from "react";
import styles from "./Input.module.css";

function DemoField({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className={styles.fieldWrapper}>
      <label className={styles.label}>{label}</label>
      {children}
    </div>
  );
}

function DemoInput({
  label,
  onClear,
  ...props
}: ComponentProps<"input"> & { label: string; onClear?: () => void }) {
  return (
    <DemoField label={label}>
      <div className={styles.inputRow}>
        <input className={styles.input} {...props} />
        {onClear && (
          <button
            type="button"
            className={styles.clearButton}
            onClick={onClear}
            aria-label={`Clear ${label}`}
          >
            Clear
          </button>
        )}
      </div>
    </DemoField>
  );
}

export { DemoField, DemoInput };

import styles from "./Select.module.css";

function DemoSelect<T extends string>({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: ReadonlyArray<T>;
  value: T;
  onChange: (value: T) => void;
}) {
  return (
    <div className={styles.wrapper}>
      <label className={styles.label}>{label}</label>
      <select
        className={styles.select}
        value={value}
        onChange={(e) => onChange(e.target.value as T)}
      >
        {options.map((opt) => (
          <option key={opt} value={opt}>
            {opt}
          </option>
        ))}
      </select>
    </div>
  );
}

function DemoMultiSelect<T extends string>({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: ReadonlyArray<T>;
  value: Array<T>;
  onChange: (value: Array<T>) => void;
}) {
  const toggleOption = (opt: T) => {
    if (value.includes(opt)) {
      onChange(value.filter((v) => v !== opt));
    } else {
      onChange([...value, opt]);
    }
  };

  return (
    <div className={styles.wrapper}>
      <label className={styles.label}>{label}</label>
      <div className={styles.chips}>
        {options.map((opt) => {
          const active = value.includes(opt);
          return (
            <button
              key={opt}
              type="button"
              className={styles.chip}
              style={{
                background: active ? "var(--demo-surface-hover)" : undefined,
                borderColor: active ? "var(--demo-border-focus)" : undefined,
              }}
              onClick={() => toggleOption(opt)}
            >
              {opt}
              {active && (
                <span className={styles.chipRemove} aria-hidden="true">
                  x
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export { DemoMultiSelect, DemoSelect };

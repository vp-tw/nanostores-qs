import styles from "./CodePreview.module.css";

function CodePreview({ label, value }: { label: string; value: string }) {
  return (
    <div className={styles.wrapper}>
      <div className={styles.label}>{label}</div>
      <pre className={styles.code}>{value}</pre>
    </div>
  );
}

export { CodePreview };

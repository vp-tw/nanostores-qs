import type { ComponentProps } from "react";
import styles from "./Button.module.css";

function DemoButton(props: ComponentProps<"button">) {
  return <button type="button" className={styles.button} {...props} />;
}

export { DemoButton };

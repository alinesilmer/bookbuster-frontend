"use client";
import styles from "./Toast.module.scss";

type ToastItem = { id: string; message: string; type: "success" | "error" };

type Props = { toasts: ToastItem[] };

export default function Toast({ toasts }: Props) {
  return (
    <div className={styles.container}>
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`${styles.toast} ${
            t.type === "success" ? styles.success : styles.error
          }`}
          role="status"
          aria-live="polite"
        >
          {t.message}
        </div>
      ))}
    </div>
  );
}

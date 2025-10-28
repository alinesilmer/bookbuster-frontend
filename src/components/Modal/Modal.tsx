"use client";

import { createPortal } from "react-dom";
import { useEffect, useState, ReactNode } from "react";
import { FiX } from "react-icons/fi";
import styles from "./Modal.module.scss";

type Size = "small" | "medium" | "large";

type ModalProps = {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  size?: Size;
  children: ReactNode;
};

export default function Modal({ isOpen, onClose, title, size = "small", children }: ModalProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    const original = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = original;
    };
  }, [isOpen]);

  if (!mounted || !isOpen) return null;

  return createPortal(
    <div className={styles.overlay} aria-hidden={!isOpen} onClick={onClose}>
      <div className={`${styles.box} ${styles[size]}`} role="dialog" aria-modal="true" aria-label={title} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          {title ? <h3 className={styles.title}>{title}</h3> : null}
          <button className={styles.close} onClick={onClose} aria-label="Cerrar">
            <FiX />
          </button>
        </div>
        <div className={styles.content}>{children}</div>
      </div>
    </div>,
    document.body
  );
}

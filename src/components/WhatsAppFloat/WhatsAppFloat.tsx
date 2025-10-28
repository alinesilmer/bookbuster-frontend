"use client";

import { useMemo } from "react";
import styles from "./WhatsAppFloat.module.scss";

type Props = {
  phone?: string;     
  message?: string;   
};

export default function WhatsAppFloat({
  phone = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? "+543794532535",
  message = "Hola, necesito ayuda con BookBuster 👋",
}: Props) {
  const href = useMemo(() => {
    const base = "https://wa.me";
    const p = String(phone).replace(/[^\d+]/g, "");
    const q = `text=${encodeURIComponent(message)}`;
    return `${base}/${encodeURIComponent(p)}?${q}`;
  }, [phone, message]);

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Chatear por WhatsApp"
      className={styles.whatsapp}
    >
      <svg viewBox="0 0 32 32" className={styles.icon} aria-hidden="true">
        <path d="M19.11 17.54c-.28-.14-1.65-.81-1.9-.9-.25-.09-.43-.14-.62.14-.19.28-.71.9-.87 1.08-.16.18-.32.2-.6.07-.28-.14-1.17-.43-2.24-1.38-.83-.74-1.39-1.65-1.55-1.93-.16-.28-.02-.43.12-.57.12-.12.28-.32.42-.48.14-.16.19-.28.28-.47.09-.19.05-.35-.02-.49-.07-.14-.62-1.49-.85-2.04-.22-.53-.45-.46-.62-.46-.16 0-.35-.02-.54-.02-.19 0-.49.07-.75.35-.26.28-1 1-1 2.43 0 1.43 1.02 2.81 1.16 3 .14.19 2 3.05 4.84 4.27.68.29 1.22.46 1.64.59.69.22 1.31.19 1.8.12.55-.08 1.65-.67 1.88-1.32.23-.65.23-1.2.16-1.32-.07-.12-.26-.2-.54-.34zM16.02 4C9.92 4 5 8.92 5 15.02c0 1.93.5 3.74 1.37 5.31L5 28l7.87-1.29c1.51.83 3.25 1.31 5.1 1.31 6.1 0 11.02-4.92 11.02-11.02S22.12 4 16.02 4zm0 19.86c-1.72 0-3.31-.5-4.65-1.36l-.33-.21-4.67.77.96-4.55-.22-.35c-.81-1.33-1.28-2.89-1.28-4.56 0-4.82 3.92-8.74 8.74-8.74s8.74 3.92 8.74 8.74-3.92 8.74-8.74 8.74z"/>
      </svg>
    </a>
  );
}

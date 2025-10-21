"use client";

import type React from "react";
import styles from "./AuthInput.module.scss";

type Props = {
  id: string;
  name?: string;
  type?: string;
  value: string;
  placeholder?: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  label: string;
  icon?: React.ReactNode;
  required?: boolean;
};

export default function AuthInput({
  id,
  name,
  type = "text",
  value,
  placeholder,
  onChange,
  label,
  icon,
  required,
}: Props) {
  return (
    <div className={styles.inputGroup}>
      <label htmlFor={id}>{label}</label>
      <div className={styles.inputWrapper}>
        {icon}
        <input
          id={id}
          name={name ?? id}
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          required={required}
        />
      </div>
    </div>
  );
}

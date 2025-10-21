"use client";

import React, { useState } from "react";
import Link from "next/link";
import Button from "@/components/Button/Button";
import styles from "@/styles/Auth.module.scss";
import { FiMail, FiLock, FiUser, FiPhone } from "react-icons/fi";
import AuthInput from "../AuthInput/AuthInput";
import { apiRegister } from "@/services/api";

export default function RegisterForm() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
  });
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      setErr("Las contraseñas no coinciden");
      return;
    }
    setErr(null);
    setLoading(true);
    try {
      await apiRegister(formData.name, formData.email, formData.password);
      window.location.href = "/dashboard";
    } catch (e) {
      const m = e instanceof Error ? e.message : "Error";
      setErr(m);
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className={styles.form}>
      <AuthInput
        id="name"
        name="name"
        value={formData.name}
        onChange={handleChange}
        label="Nombre Completo"
        placeholder="Juan Pérez"
        required
        icon={<FiUser className={styles.inputIcon} />}
      />
      <AuthInput
        id="email"
        name="email"
        type="email"
        value={formData.email}
        onChange={handleChange}
        label="Correo Electrónico"
        placeholder="tuemail@gmail.com"
        required
        icon={<FiMail className={styles.inputIcon} />}
      />
      <AuthInput
        id="phone"
        name="phone"
        type="tel"
        value={formData.phone}
        onChange={handleChange}
        label="Número de Teléfono"
        placeholder="+54 9 11 0000-0000"
        icon={<FiPhone className={styles.inputIcon} />}
      />
      <AuthInput
        id="password"
        name="password"
        type="password"
        value={formData.password}
        onChange={handleChange}
        label="Contraseña"
        placeholder="••••••••"
        required
        icon={<FiLock className={styles.inputIcon} />}
      />
      <AuthInput
        id="confirmPassword"
        name="confirmPassword"
        type="password"
        value={formData.confirmPassword}
        onChange={handleChange}
        label="Confirmar Contraseña"
        placeholder="••••••••"
        required
        icon={<FiLock className={styles.inputIcon} />}
      />
      {err && <div className={styles.error}>{err}</div>}
      <Button variant="primary" type="submit" fullWidth loading={loading}>
        Registrarme
      </Button>
      <div className={styles.footer}>
        <p>
          ¿Ya estás registrado?{" "}
          <Link href="/login" className={styles.link}>
            ¡Ingresá aquí!
          </Link>
        </p>
      </div>
    </form>
  );
}

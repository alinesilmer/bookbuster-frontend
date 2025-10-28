"use client";

import type React from "react";
import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { FiMail, FiLock, FiUser, FiPhone } from "react-icons/fi";
import Button from "@/components/Button/Button";
import styles from "@/styles/Auth.module.scss";
import { apiCreateRegisterRequest } from "@/services/api";
import Layout from "@/components/Layout/Layout";

export default function Register() {
  const [formData, setFormData] = useState({ name: "", email: "", phone: "", password: "", confirmPassword: "" });
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErr(null);
    setMsg(null);
    try {
      await apiCreateRegisterRequest({ nombre: formData.name.trim(), email: formData.email.trim(), telefono: formData.phone.trim() || undefined });
      setMsg("Solicitud enviada. Te avisaremos por correo.");
      setFormData({ name: "", email: "", phone: "", password: "", confirmPassword: "" });
    } catch (e) {
      const m = e instanceof Error ? e.message : "Error";
      setErr(m);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className={styles.authPage}>
        <div className={styles.authContainer}>
          <motion.div className={styles.authCard} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <div className={styles.header}>
              <h1>Crear Cuenta</h1>
              <p>Únete a BookBuster y elige tus aventuras</p>
            </div>

            <form onSubmit={handleSubmit} className={styles.form}>
              <div className={styles.inputGroup}>
                <label htmlFor="name">Nombre Completo</label>
                <div className={styles.inputWrapper}>
                  <FiUser className={styles.inputIcon} />
                  <input id="name" name="name" type="text" value={formData.name} onChange={handleChange} placeholder="Juan Pérez" required />
                </div>
              </div>

              <div className={styles.inputGroup}>
                <label htmlFor="email">Correo Electrónico</label>
                <div className={styles.inputWrapper}>
                  <FiMail className={styles.inputIcon} />
                  <input id="email" name="email" type="email" value={formData.email} onChange={handleChange} placeholder="tuemail@gmail.com" required />
                </div>
              </div>

              <div className={styles.inputGroup}>
                <label htmlFor="phone">Número de Teléfono</label>
                <div className={styles.inputWrapper}>
                  <FiPhone className={styles.inputIcon} />
                  <input id="phone" name="phone" type="tel" value={formData.phone} onChange={handleChange} placeholder="+54 379 000-0000" />
                </div>
              </div>

              <div className={styles.inputGroup}>
                <label htmlFor="password">Contraseña</label>
                <div className={styles.inputWrapper}>
                  <FiLock className={styles.inputIcon} />
                  <input id="password" name="password" type="password" value={formData.password} onChange={handleChange} placeholder="••••••••" />
                </div>
              </div>

              <div className={styles.inputGroup}>
                <label htmlFor="confirmPassword">Confirmar Contraseña</label>
                <div className={styles.inputWrapper}>
                  <FiLock className={styles.inputIcon} />
                  <input id="confirmPassword" name="confirmPassword" type="password" value={formData.confirmPassword} onChange={handleChange} placeholder="••••••••" />
                </div>
              </div>

              {msg && <div className={styles.success}>{msg}</div>}
              {err && <div className={styles.error}>{err}</div>}

              <Button variant="primary" type="submit" fullWidth loading={loading}>
                Enviar solicitud
              </Button>
            </form>

            <div className={styles.footer}>
              <p>
                ¿Ya estás registrado? <Link href="/login" className={styles.link}>¡Ingresá aquí!</Link>
              </p>
            </div>
          </motion.div>

          <div className={styles.decoration}>
            <div className={styles.circle1}></div>
            <div className={styles.circle2}></div>
          </div>
        </div>
      </div>
    </Layout>
  );
}

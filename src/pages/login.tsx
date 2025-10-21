"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { FiMail, FiLock } from "react-icons/fi";
import Button from "@/components/Button/Button";
import styles from "@/styles/Auth.module.scss";
import { apiLogin, apiDevSeed } from "@/services/api";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const router = useRouter();
  const params = useSearchParams();
  const next = params.get("next") || "/";

  useEffect(() => {
    const key = "bb_seed_users_v1";
    const run = async () => {
      try {
        if (typeof window === "undefined") return;
        if (localStorage.getItem(key)) return;
        const r = await apiDevSeed();
        if (r.created) localStorage.setItem(key, "1");
      } catch {}
    };
    run();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setLoading(true);
    try {
      await apiLogin(email, password);
      router.push(next);
    } catch (err) {
      const m = err instanceof Error ? err.message : "Error";
      setErrorMsg(m);
      setLoading(false);
    }
  };

  return (
    <div className={styles.authPage}>
      <div className={styles.authContainer}>
        <motion.div
          className={styles.authCard}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className={styles.header}>
            <h1>¡Bienvenido!</h1>
            <p>Ingresa a tu cuenta de Bookbuster</p>
          </div>

          <form onSubmit={handleSubmit} className={styles.form}>
            <div className={styles.inputGroup}>
              <label htmlFor="email">Correo Electrónico</label>
              <div className={styles.inputWrapper}>
                <FiMail className={styles.inputIcon} />
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="tuemail@gmail.com"
                  required
                />
              </div>
            </div>

            <div className={styles.inputGroup}>
              <label htmlFor="password">Contraseña</label>
              <div className={styles.inputWrapper}>
                <FiLock className={styles.inputIcon} />
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            {errorMsg && <div className={styles.error}>{errorMsg}</div>}

            <div className={styles.options}>
              <label className={styles.checkbox}>
                <input type="checkbox" />
                <span>Recuérdame</span>
              </label>
            </div>

            <Button variant="primary" type="submit" fullWidth loading={loading}>
              Ingresar
            </Button>
          </form>

          <div className={styles.footer}>
            <Link href="/register" className={styles.link}>
              Registrarme
            </Link>
          </div>
        </motion.div>

        <div className={styles.decoration}>
          <div className={styles.circle1}></div>
          <div className={styles.circle2}></div>
        </div>
      </div>
    </div>
  );
}

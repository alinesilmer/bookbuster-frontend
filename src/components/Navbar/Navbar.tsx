// components/Navbar/Navbar.tsx
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FiUser, FiLogOut, FiMenu, FiX } from "react-icons/fi";
import { motion, AnimatePresence } from "framer-motion";
import logo from "@/assets/images/bookbusterLogo.png";
import Image from "next/image";
import styles from "./Navbar.module.scss";
import { getUser, clearAuth } from "@/lib/auth";
import { apiLogout } from "@/services/api";

export default function Navbar() {
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [loggedIn, setLoggedIn] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const u = getUser();
    setLoggedIn(!!u);
    setIsAdmin(u?.rol === "ADMIN");

    const onStorage = (e: StorageEvent) => {
      if (e.key === "bb_session_user") {
        const user = getUser();
        setLoggedIn(!!user);
        setIsAdmin(user?.rol === "ADMIN");
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const handleLogout = async () => {
    try {
      await apiLogout();
    } finally {
      clearAuth();
      setLoggedIn(false);
      setIsAdmin(false);
      router.push("/login");
    }
  };

  return (
    <nav className={styles.navbar}>
      <div className={styles.container}>
        <Link href="/" className={styles.logo}>
          <Image
            src={logo}
            alt="Bookbuster"
            className={styles.logoImage}
            priority
          />
        </Link>

        <div className={styles.desktop}>
          <div className={styles.navLinks}>
            <Link href="/" className={styles.navLink}>
              Inicio
            </Link>
            {loggedIn && (
              <>
                <Link href="/dashboard" className={styles.navLink}>
                  Mis Libros
                </Link>
                {isAdmin && (
                  <Link href="/admin" className={styles.navLink}>
                    Admin
                  </Link>
                )}
              </>
            )}
          </div>

          <div className={styles.actions}>
            {loggedIn ? (
              <>
                <Link
                  href="/dashboard"
                  className={styles.iconBtn}
                  aria-label="Mi panel"
                >
                  <FiUser />
                </Link>
                <button
                  className={styles.iconBtn}
                  onClick={handleLogout}
                  aria-label="Salir"
                >
                  <FiLogOut />
                </button>
              </>
            ) : (
              <>
                <Link href="/login" className={styles.loginBtn}>
                  Ingresar
                </Link>
                <Link href="/register" className={styles.registerBtn}>
                  Registrarse
                </Link>
              </>
            )}
          </div>
        </div>

        <button
          className={styles.menuBtn}
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Menú"
        >
          {menuOpen ? <FiX /> : <FiMenu />}
        </button>
      </div>

      <AnimatePresence>
        {menuOpen && (
          <motion.div
            className={styles.mobileMenu}
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Link
              href="/"
              className={styles.mobileLink}
              onClick={() => setMenuOpen(false)}
            >
              Inicio
            </Link>
            {loggedIn ? (
              <>
                <Link
                  href="/dashboard"
                  className={styles.mobileLink}
                  onClick={() => setMenuOpen(false)}
                >
                  Mis Libros
                </Link>
                {isAdmin && (
                  <Link
                    href="/admin"
                    className={styles.mobileLink}
                    onClick={() => setMenuOpen(false)}
                  >
                    Admin
                  </Link>
                )}
                <Link
                  href="/dashboard"
                  className={styles.mobileLink}
                  onClick={() => setMenuOpen(false)}
                >
                  Mi panel
                </Link>
                <button className={styles.mobileLink} onClick={handleLogout}>
                  Salir
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  className={styles.mobileLink}
                  onClick={() => setMenuOpen(false)}
                >
                  Ingresar
                </Link>
                <Link
                  href="/register"
                  className={styles.mobileLink}
                  onClick={() => setMenuOpen(false)}
                >
                  Registrarse
                </Link>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}

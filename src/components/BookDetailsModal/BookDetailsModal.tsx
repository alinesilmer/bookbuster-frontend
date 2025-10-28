"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import { motion } from "framer-motion";
import Modal from "@/components/Modal/Modal";
import Button from "@/components/Button/Button";
import styles from "./BookDetailsModal.module.scss";
import type { UIBook, Copy, Book as BookT, EstadoCopia, FormatoCopia, SocioUser, User } from "@/types/models";
import { apiBookById, apiCopiesByBook, apiCreateLoan, apiSociosAll } from "@/services/api";
import { getUser } from "@/lib/auth";
import Image from "next/image";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  book: UIBook;
  onLoanSuccess?: (copyId: string) => void;
};

const defaultDue = () => {
  const d = new Date();
  d.setDate(d.getDate() + 14);
  return d.toISOString().slice(0, 10);
};

export default function BookDetailsModal({ isOpen, onClose, book, onLoanSuccess }: Props) {
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [full, setFull] = useState<BookT | null>(null);
  const [copies, setCopies] = useState<Copy[]>([]);
  const [selectedCopyId, setSelectedCopyId] = useState<string>("");
  const [dueDate, setDueDate] = useState<string>(defaultDue());

  const [me, setMe] = useState<User | null>(null);
  const [socios, setSocios] = useState<SocioUser[]>([]);
  const [sociosQuery, setSociosQuery] = useState("");
  const [selectedSocioId, setSelectedSocioId] = useState<string>("");
  const [selectedSocio, setSelectedSocio] = useState<SocioUser | null>(null);

  const canAssignToOther = useMemo(() => me?.rol === "ADMIN" || me?.rol === "BIBLIOTECARIO", [me]);
  const todayISO = useMemo(() => new Date().toISOString().slice(0, 10), []);
  const available = useMemo(() => copies.filter((c) => c.estado === "DISPONIBLE"), [copies]);

  const formats = useMemo(() => {
    const map = new Map<FormatoCopia, number>();
    copies.forEach((c) => map.set(c.formato, (map.get(c.formato) ?? 0) + 1));
    return Array.from(map.entries()).sort((a, b) => a[0].localeCompare(b[0]));
  }, [copies]);

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      const [b, cs] = await Promise.all([apiBookById(book.id), apiCopiesByBook(book.id)]);
      setFull(b);
      setCopies(cs);
      const firstAvail = cs.find((c) => c.estado === "DISPONIBLE");
      setSelectedCopyId(firstAvail?.id ?? "");
      setDueDate(defaultDue());
    } finally {
      setLoading(false);
    }
  }, [book.id]);

  useEffect(() => {
    if (!isOpen) return;
    let mounted = true;
    (async () => {
      const u = getUser();
      if (mounted) setMe(u || null);
      await reload();
      if ((u?.rol === "ADMIN" || u?.rol === "BIBLIOTECARIO") && mounted) {
        const list = await apiSociosAll();
        if (!mounted) return;
        setSocios(list);
      }
    })();
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail as { bookId?: string } | undefined;
      if (detail?.bookId === book.id) reload();
    };
    window.addEventListener("copies:updated", handler as EventListener);
    return () => window.removeEventListener("copies:updated", handler as EventListener);
  }, [isOpen, book.id, reload]);

  const runSearch = () => {
    const q = sociosQuery.trim().toLowerCase();
    if (!q) {
      setSelectedSocioId("");
      setSelectedSocio(null);
      return;
    }
    const matches = socios.filter(s =>
      (s.nombre?.toLowerCase() || "").includes(q) ||
      (s.email?.toLowerCase() || "").includes(q) ||
      (s.dni || "").toLowerCase().includes(q)
    );
    const exact = matches.find(s =>
      (s.email?.toLowerCase() || "") === q ||
      (s.dni || "").toLowerCase() === q ||
      (s.nombre?.toLowerCase() || "") === q
    );
    const pick = exact || (matches.length === 1 ? matches[0] : null);
    if (!pick) {
      setSelectedSocioId("");
      setSelectedSocio(null);
      alert("Refiná la búsqueda. Se encontraron múltiples o ningún resultado.");
      return;
    }
    setSelectedSocioId(pick.id);
    setSelectedSocio(pick);
  };

  const handleRent = async () => {
    if (!selectedCopyId) return;
    if (!me) {
      alert("Inicia sesión para alquilar.");
      return;
    }
    try {
      setCreating(true);
      await apiCreateLoan(selectedCopyId, dueDate, selectedSocioId || undefined);
      setCopies((prev) => prev.map((c) => (c.id === selectedCopyId ? { ...c, estado: "PRESTADO" as EstadoCopia } : c)));
      onLoanSuccess?.(selectedCopyId);
      onClose();
    } catch (e) {
      const m = e instanceof Error ? e.message : "No se pudo crear el préstamo";
      alert(m);
    } finally {
      setCreating(false);
    }
  };

  const allAuthors = useMemo(() => {
    const list = full?.autores?.map(a => a.nombre).filter(Boolean) ?? [];
    if (list.length > 0) return list;
    return book.author ? [book.author] : [];
  }, [full?.autores, book.author]);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Detalles del libro" size="large">
      {loading ? (
        <div className={styles.loading}>Cargando…</div>
      ) : (
        <div className={styles.wrap}>
          <div className={styles.left}>
            <div className={styles.coverFrame}>
              <Image src={book.cover ?? "/placeholder.svg"} alt={book.title} className={styles.cover} width={600} height={800} />
            </div>
            <div className={styles.badges}>
              {formats.map(([fmt, n]) => (
                <span key={fmt} className={styles.badge}>
                  {fmt} · {n}
                </span>
              ))}
              <span className={styles.badgeAlt}>Disponibles: {available.length}</span>
            </div>
          </div>

          <div className={styles.right}>
            <h2 className={styles.title}>{book.title}</h2>

            {/* AUTOR(ES): ahora muestra todos */}
            {allAuthors.length > 0 && (
              <div className={styles.authors}>
                {allAuthors.map((name, idx) => (
                  <span key={`${name}-${idx}`} className={styles.authorChip}>
                    {name}
                  </span>
                ))}
              </div>
            )}

            {/* GÉNEROS */}
            {full?.generos?.length ? (
              <div className={styles.tags}>
                {full.generos.map((g) => (
                  <span key={g.id} className={styles.tag}>
                    {g.nombre}
                  </span>
                ))}
              </div>
            ) : null}

            <motion.p initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className={styles.desc}>
              {book.description ?? full?.descripcion ?? "Sin descripción."}
            </motion.p>

            <div className={styles.selectorBlock}>
              <span className={styles.label}>Elegí una copia</span>
              {available.length === 0 ? (
                <div className={styles.empty}>Sin copias disponibles.</div>
              ) : (
                <select
                  className={styles.select}
                  value={selectedCopyId}
                  onChange={(e) => setSelectedCopyId(e.target.value)}
                >
                  {available.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.formato} {c.isbn ? `· ISBN ${c.isbn}` : ""} {c.edicion ? `· ${c.edicion}` : ""}
                    </option>
                  ))}
                </select>
              )}
            </div>

            {canAssignToOther ? (
              <div className={styles.selectorBlock}>
                <span className={styles.label}>Asignar a usuario</span>
                <div className={styles.rowInline}>
                  <input
                    className={styles.input}
                    type="text"
                    placeholder="Buscar por nombre, email o DNI"
                    value={sociosQuery}
                    onChange={(e) => setSociosQuery(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") runSearch(); }}
                  />
                  <Button size="small" variant="secondary" onClick={runSearch}>Buscar</Button>
                </div>
                {selectedSocio ? (
                  <div className={styles.selectedBox}>
                    <div className={styles.userName}>{selectedSocio.nombre || "Sin nombre"}</div>
                    <div className={styles.userMeta}>
                      <span>{selectedSocio.email}</span>
                      {selectedSocio.dni ? <span> · DNI {selectedSocio.dni}</span> : null}
                      <span className={selectedSocio.activo ? styles.badgeOk : styles.badgeWarn}>
                        {selectedSocio.activo ? "Activo" : "Inactivo"}
                      </span>
                    </div>
                    <button className={styles.clearSel} onClick={() => { setSelectedSocio(null); setSelectedSocioId(""); }}>
                      Cambiar
                    </button>
                  </div>
                ) : (
                  <div className={styles.hint}>Escribí y presioná Enter o Buscar</div>
                )}
              </div>
            ) : null}

            <div className={styles.selectorBlock}>
              <span className={styles.label}>Fecha de vencimiento</span>
              <input
                type="date"
                value={dueDate}
                min={todayISO}
                onChange={(e) => setDueDate(e.target.value)}
                className={`${styles.input} ${styles.dateInput}`}
              />
            </div>

            <div className={styles.actions}>
              <Button variant="outline" onClick={onClose}>Cerrar</Button>
              <Button
                variant="primary"
                onClick={handleRent}
                disabled={!selectedCopyId || available.length === 0 || (canAssignToOther && !selectedSocioId)}
                loading={creating}
              >
                Alquilar
              </Button>
            </div>
          </div>
        </div>
      )}
    </Modal>
  );
}

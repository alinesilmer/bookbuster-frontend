"use client";

import { useEffect, useRef, useState, useMemo } from "react";
import Modal from "@/components/Modal/Modal";
import Button from "@/components/Button/Button";
import { apiBookById, apiUpdateBook } from "@/services/api";
import styles from "./EditBookModal.module.scss";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  book: { id: string; title: string; author: string };
  onUpdated?: () => void;
};

export default function EditBookModal({ isOpen, onClose, book, onUpdated }: Props) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [titulo, setTitulo] = useState(book.title);
  const [descripcion, setDescripcion] = useState("");
  const [idioma, setIdioma] = useState("Español");
  const [portada, setPortada] = useState("");
  const [fecha, setFecha] = useState("");

  const [autores, setAutores] = useState<string[]>([]);
  const [generos, setGeneros] = useState<string[]>([]);
  const [autorInput, setAutorInput] = useState("");
  const [generoInput, setGeneroInput] = useState("");

  const autorRef = useRef<HTMLInputElement>(null);
  const generoRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    setLoading(true);
    (async () => {
      try {
        const full = await apiBookById(book.id);
        setTitulo(full.titulo ?? book.title);
        setDescripcion(full.descripcion ?? "");
        setIdioma(full.idioma ?? "Español");
        setPortada(full.portada_url ?? "");
        setFecha(full.fecha_publicacion ?? "");
        setAutores((full.autores ?? []).map(a => a.nombre).filter(Boolean));
        setGeneros((full.generos ?? []).map(g => g.nombre).filter(Boolean));
      } catch (e) {
        const m = e instanceof Error ? e.message : "No se pudo cargar el libro";
        alert(m);
      } finally {
        setLoading(false);
      }
    })();
  }, [isOpen, book.id, book.title]);

  const addAutor = () => {
    const raw = autorInput.trim();
    if (!raw) return;
    const parts = raw.split(",").map(s => s.trim()).filter(Boolean);
    const unique = Array.from(new Set([...autores, ...parts]));
    setAutores(unique);
    setAutorInput("");
    autorRef.current?.focus();
  };

  const addGenero = () => {
    const raw = generoInput.trim();
    if (!raw) return;
    const parts = raw.split(",").map(s => s.trim()).filter(Boolean);
    const unique = Array.from(new Set([...generos, ...parts]));
    setGeneros(unique);
    setGeneroInput("");
    generoRef.current?.focus();
  };

  const onKeyAutor = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addAutor();
    }
  };
  const onKeyGenero = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addGenero();
    }
  };

  const removeAutor = (name: string) => setAutores(a => a.filter(x => x !== name));
  const removeGenero = (name: string) => setGeneros(g => g.filter(x => x !== name));

  const canSave = useMemo(() => titulo.trim().length > 1, [titulo]);

  const save = async () => {
    try {
      setSaving(true);
      await apiUpdateBook(book.id, {
        titulo: titulo.trim(),
        descripcion: descripcion.trim() || null,
        idioma: idioma.trim() || null,
        portada_url: portada.trim() || null,
        fecha_publicacion: fecha || null,
        autores: autores.length ? autores.map(nombre => ({ nombre })) : undefined,
        generos: generos.length ? generos.map(nombre => ({ nombre })) : undefined,
      });
      onUpdated?.();
      window.dispatchEvent(new CustomEvent("books:updated"));
      onClose();
    } catch (e) {
      const m = e instanceof Error ? e.message : "No se pudo actualizar";
      alert(m);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Editar libro" size="large">
      {loading ? (
        <div className={styles.loading}>Cargando…</div>
      ) : (
        <div className={styles.container}>
          <section className={styles.section}>
            <h4 className={styles.sectionTitle}>Información básica</h4>
            <div className={styles.grid2}>
              <div className={styles.field}>
                <label>Título</label>
                <input value={titulo} onChange={(e) => setTitulo(e.target.value)} />
              </div>
              <div className={styles.field}>
                <label>Idioma</label>
                <input value={idioma} onChange={(e) => setIdioma(e.target.value)} />
              </div>
            </div>

            <div className={styles.grid2}>
              <div className={styles.field}>
                <label>Portada (URL)</label>
                <input value={portada} onChange={(e) => setPortada(e.target.value)} placeholder="https://..." />
              </div>
              <div className={styles.field}>
                <label>Fecha de publicación</label>
                <input type="date" value={fecha || ""} onChange={(e) => setFecha(e.target.value)} />
              </div>
            </div>

            <div className={styles.field}>
              <label>Descripción</label>
              <textarea rows={4} value={descripcion} onChange={(e) => setDescripcion(e.target.value)} />
            </div>
          </section>

          <section className={styles.section}>
            <h4 className={styles.sectionTitle}>Autores y géneros</h4>
            <div className={styles.grid2}>
              <div className={styles.field}>
                <label>Autores</label>
                <div className={styles.inline}>
                  <input
                    ref={autorRef}
                    value={autorInput}
                    onChange={(e) => setAutorInput(e.target.value)}
                    onKeyDown={onKeyAutor}
                    placeholder="Agrega autores (Enter o coma)"
                  />
                  <Button variant="secondary" size="small" onClick={addAutor}>Añadir</Button>
                </div>
                <div className={styles.chips}>
                  {autores.map((a) => (
                    <span key={a} className={styles.chip} onClick={() => removeAutor(a)}>{a} ×</span>
                  ))}
                </div>
              </div>

              <div className={styles.field}>
                <label>Géneros</label>
                <div className={styles.inline}>
                  <input
                    ref={generoRef}
                    value={generoInput}
                    onChange={(e) => setGeneroInput(e.target.value)}
                    onKeyDown={onKeyGenero}
                    placeholder="Agrega géneros (Enter o coma)"
                  />
                  <Button variant="secondary" size="small" onClick={addGenero}>Añadir</Button>
                </div>
                <div className={styles.chips}>
                  {generos.map((g) => (
                    <span key={g} className={styles.chip} onClick={() => removeGenero(g)}>{g} ×</span>
                  ))}
                </div>
              </div>
            </div>
          </section>

          <div className={styles.actions}>
            <Button variant="outline" onClick={onClose}>Cancelar</Button>
            <Button variant="primary" onClick={save} disabled={!canSave} loading={saving}>Guardar cambios</Button>
          </div>
        </div>
      )}
    </Modal>
  );
}

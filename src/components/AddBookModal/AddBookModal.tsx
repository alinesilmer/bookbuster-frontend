"use client";

import { useMemo, useRef, useState } from "react";
import Modal from "@/components/Modal/Modal";
import Button from "@/components/Button/Button";
import { apiCreateBook } from "@/services/api";
import styles from "./AddBookModal.module.scss";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onCreated?: () => void;
};

export default function AddBookModal({ isOpen, onClose, onCreated }: Props) {
  const [saving, setSaving] = useState(false);
  const [titulo, setTitulo] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [idioma, setIdioma] = useState("Español");
  const [portada, setPortada] = useState("");
  const [fecha, setFecha] = useState("");
  const [autorInput, setAutorInput] = useState("");
  const [generoInput, setGeneroInput] = useState("");
  const [autores, setAutores] = useState<string[]>([]);
  const [generos, setGeneros] = useState<string[]>([]);

  const autorRef = useRef<HTMLInputElement>(null);
  const generoRef = useRef<HTMLInputElement>(null);

  const canSave = useMemo(() => {
    return titulo.trim().length > 1 && autores.length > 0 && generos.length > 0;
  }, [titulo, autores, generos]);

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

  const removeAutor = (name: string) => setAutores(a => a.filter(x => x !== name));
  const removeGenero = (name: string) => setGeneros(g => g.filter(x => x !== name));

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

  const onPasteAutores = (e: React.ClipboardEvent<HTMLInputElement>) => {
    const t = e.clipboardData.getData("text");
    const parts = t.split(",").map(s => s.trim()).filter(Boolean);
    if (parts.length > 1) {
      e.preventDefault();
      const unique = Array.from(new Set([...autores, ...parts]));
      setAutores(unique);
      setAutorInput("");
    }
  };

  const onPasteGeneros = (e: React.ClipboardEvent<HTMLInputElement>) => {
    const t = e.clipboardData.getData("text");
    const parts = t.split(",").map(s => s.trim()).filter(Boolean);
    if (parts.length > 1) {
      e.preventDefault();
      const unique = Array.from(new Set([...generos, ...parts]));
      setGeneros(unique);
      setGeneroInput("");
    }
  };

  const reset = () => {
    setSaving(false);
    setTitulo("");
    setDescripcion("");
    setIdioma("Español");
    setPortada("");
    setFecha("");
    setAutorInput("");
    setGeneroInput("");
    setAutores([]);
    setGeneros([]);
  };

  const submit = async () => {
    if (!canSave) return;
    try {
      setSaving(true);
      await apiCreateBook({
        titulo: titulo.trim(),
        descripcion: descripcion.trim() || null,
        idioma: idioma.trim(),
        portada_url: portada.trim() || null,
        fecha_publicacion: fecha || null,
        autores: autores.map((nombre) => ({ nombre })),
        generos: generos.map((nombre) => ({ nombre })),
      });
      onCreated?.();
      window.dispatchEvent(new CustomEvent("books:updated"));
      reset();
      onClose();
    } catch (e) {
      const m = e instanceof Error ? e.message : "No se pudo crear el libro";
      alert(m);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Agregar libro" size="large">
      <div className={styles.container}>
        <section className={styles.section}>
          <h4 className={styles.sectionTitle}>Información básica</h4>
          <div className={styles.grid2}>
            <div className={styles.field}>
              <label>Título</label>
              <input
                value={titulo}
                onChange={(e) => setTitulo(e.target.value)}
                placeholder="Ej.: Rayuela"
                autoFocus
              />
              <small className={styles.hint}>Requerido</small>
            </div>
            <div className={styles.field}>
              <label>Idioma</label>
              <input value={idioma} onChange={(e) => setIdioma(e.target.value)} placeholder="Español" />
            </div>
          </div>

          <div className={styles.grid2}>
            <div className={styles.field}>
              <label>Portada (URL)</label>
              <input value={portada} onChange={(e) => setPortada(e.target.value)} placeholder="https://..." />
              <small className={styles.hint}>Opcional</small>
            </div>
            <div className={styles.field}>
              <label>Fecha de publicación</label>
              <input type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} />
              <small className={styles.hint}>Opcional</small>
            </div>
          </div>

          <div className={styles.field}>
            <label>Descripción</label>
            <textarea
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              rows={4}
              placeholder="Breve sinopsis o descripción del libro"
            />
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
                  onPaste={onPasteAutores}
                  placeholder="Escribe un autor y Enter. También puedes pegar varios separados por coma"
                />
                <Button variant="secondary" size="small" onClick={addAutor}>Añadir</Button>
              </div>
              <div className={styles.chips}>
                {autores.map((a) => (
                  <span key={a} className={styles.chip} title="Quitar" onClick={() => removeAutor(a)}>
                    {a} ×
                  </span>
                ))}
              </div>
              <small className={styles.hint}>{autores.length} autor(es)</small>
            </div>

            <div className={styles.field}>
              <label>Géneros</label>
              <div className={styles.inline}>
                <input
                  ref={generoRef}
                  value={generoInput}
                  onChange={(e) => setGeneroInput(e.target.value)}
                  onKeyDown={onKeyGenero}
                  onPaste={onPasteGeneros}
                  placeholder="Escribe un género y Enter. También puedes pegar varios separados por coma"
                />
                <Button variant="secondary" size="small" onClick={addGenero}>Añadir</Button>
              </div>
              <div className={styles.chips}>
                {generos.map((g) => (
                  <span key={g} className={styles.chip} title="Quitar" onClick={() => removeGenero(g)}>
                    {g} ×
                  </span>
                ))}
              </div>
              <small className={styles.hint}>{generos.length} género(s)</small>
            </div>
          </div>
        </section>

        <div className={styles.actions}>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button variant="primary" onClick={submit} disabled={!canSave} loading={saving}>Crear libro</Button>
        </div>
      </div>
    </Modal>
  );
}

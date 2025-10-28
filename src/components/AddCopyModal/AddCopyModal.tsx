"use client";

import { useEffect, useState } from "react";
import Modal from "@/components/Modal/Modal";
import Button from "@/components/Button/Button";
import { apiEditorials, apiCreateCopy } from "@/services/api";
import type { Editorial, FormatoCopia } from "@/types/models";
import styles from "./AddCopyModal.module.scss";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  libroId: string;
  onCreated?: () => void;
};

const FORMATOS: FormatoCopia[] = ["FISICO", "PDF", "EPUB", "AUDIOBOOK"];

export default function AddCopyModal({ isOpen, onClose, libroId, onCreated }: Props) {
  const [editoriales, setEditoriales] = useState<Editorial[]>([]);
  const [editorialId, setEditorialId] = useState("");
  const [isbn, setIsbn] = useState("");
  const [edicion, setEdicion] = useState("");
  const [formato, setFormato] = useState<FormatoCopia>("FISICO");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    let mounted = true;
    (async () => {
      const list = await apiEditorials();
      if (!mounted) return;
      setEditoriales(list);
      setEditorialId(list[0]?.id ?? "");
      setIsbn("");
      setEdicion("");
      setFormato("FISICO");
    })();
    return () => { mounted = false; };
  }, [isOpen]);

  const handleSave = async () => {
    if (!editorialId) return;
    try {
      setSaving(true);
      await apiCreateCopy({
        libro_id: libroId,
        editorial_id: editorialId,
        isbn: isbn || null,
        edicion: edicion || null,
        formato,
      });
      onCreated?.();
      window.dispatchEvent(new Event("copies:updated"));
      onClose();
    } catch (e) {
      const m = e instanceof Error ? e.message : "No se pudo crear la copia";
      alert(m);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Agregar copia" size="small">
      <div className={styles.form}>
        <label className={styles.row}>
          <span>Editorial</span>
          <select value={editorialId} onChange={(e) => setEditorialId(e.target.value)}>
            {editoriales.map((ed) => (
              <option key={ed.id} value={ed.id}>{ed.nombre}</option>
            ))}
          </select>
        </label>

        <label className={styles.row}>
          <span>Formato</span>
          <select value={formato} onChange={(e) => setFormato(e.target.value as FormatoCopia)}>
            {FORMATOS.map((f) => (
              <option key={f} value={f}>{f}</option>
            ))}
          </select>
        </label>

        <label className={styles.row}>
          <span>ISBN</span>
          <input value={isbn} onChange={(e) => setIsbn(e.target.value)} />
        </label>

        <label className={styles.row}>
          <span>Edición</span>
          <input value={edicion} onChange={(e) => setEdicion(e.target.value)} placeholder="Opcional" />
        </label>

        <div className={styles.actions}>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button variant="primary" onClick={handleSave} loading={saving}>Guardar</Button>
        </div>
      </div>
    </Modal>
  );
}

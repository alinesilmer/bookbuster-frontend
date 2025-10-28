"use client";

import { useEffect, useState } from "react";
import Button from "@/components/Button/Button";
import styles from "./UserEditModal.module.scss";

type Props = {
  isOpen: boolean;
  user: {
    id: string;
    nombre: string;
    email: string;
    nro_socio?: number | null;
  };
  onClose: () => void;
  onSave: (updated: { nombre: string; email: string }) => Promise<void>;
};

export default function UserEditModal({ isOpen, user, onClose, onSave }: Props) {
  const [nombre, setNombre] = useState(user.nombre);
  const [email, setEmail] = useState(user.email);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setNombre(user.nombre);
    setEmail(user.email);
  }, [user]);

  if (!isOpen) return null;

  const handleSave = async () => {
    setLoading(true);
    await onSave({ nombre, email });
    setLoading(false);
    onClose();
  };

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <h3 className={styles.title}>Editar usuario</h3>

        <label className={styles.label}>Nombre</label>
        <input className={styles.input} value={nombre} onChange={(e) => setNombre(e.target.value)} />

        <label className={styles.label}>Email</label>
        <input className={styles.input} value={email} onChange={(e) => setEmail(e.target.value)} />

        <label className={styles.label}>N° de socio</label>
        <input className={styles.input} value={user.nro_socio ?? "-"} disabled />

        <div className={styles.actions}>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button variant="primary" onClick={handleSave} disabled={loading}>{loading ? "Guardando..." : "Guardar"}</Button>
        </div>
      </div>
    </div>
  );
}

// ReturnLoanQuickModal.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import Modal from "@/components/Modal/Modal";
import Button from "@/components/Button/Button";
import { apiReturnLoan, apiLoansBySocio, apiSocioByUser } from "@/services/api";
import styles from "./ReturnLoanQuickModal.module.scss";

type LoanLite = {
  id: string;
  estado: string;
  fecha_inicio: string;
  fecha_vencimiento: string;
  copia_id: string;
  bookTitle?: string | null;
};

type Props = {
  isOpen: boolean;
  onClose: () => void;
  userName: string;
  usuarioId: string;
  onReturned?: () => void;
};

export default function ReturnLoanQuickModal({ isOpen, onClose, userName, usuarioId, onReturned }: Props) {
  const [loading, setLoading] = useState(false);
  const [loans, setLoans] = useState<LoanLite[]>([]);
  const [loanId, setLoanId] = useState<string>("");
  const [saving, setSaving] = useState(false);

  const sortedLoans = useMemo(() => {
    return [...loans].sort((a, b) => String(a.fecha_vencimiento).localeCompare(String(b.fecha_vencimiento)));
  }, [loans]);

  useEffect(() => {
    if (!isOpen) return;
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        setLoans([]);
        setLoanId("");
        const socio = await apiSocioByUser(usuarioId);
        if (!mounted) return;
        const actives = await apiLoansBySocio(socio.id, "ACTIVO");
        if (!mounted) return;
        setLoans(actives);
        setLoanId(actives[0]?.id ?? "");
      } catch (e) {
        const m = e instanceof Error ? e.message : "No se pudieron cargar los préstamos";
        alert(m);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [isOpen, usuarioId]);

  const submit = async () => {
    if (!loanId.trim()) {
      alert("Seleccioná un préstamo");
      return;
    }
    try {
      setSaving(true);
      await apiReturnLoan(loanId.trim(), { createPenalty: false });
      onReturned?.();
      onClose();
    } catch (e) {
      const m = e instanceof Error ? e.message : "No se pudo devolver el préstamo";
      alert(m);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Devolver préstamo" size="small">
      <div className={styles.body}>
        <div className={styles.section}>
          <div className={styles.label}>Usuario</div>
          <div className={styles.value}>{userName}</div>
        </div>

        <div className={styles.section}>
          <label className={styles.label}>Seleccionar préstamo activo</label>
          {loading ? (
            <div className={styles.hint}>Cargando préstamos…</div>
          ) : sortedLoans.length === 0 ? (
            <div className={styles.empty}>Este usuario no tiene préstamos activos.</div>
          ) : (
            <select className={styles.select} value={loanId} onChange={(e) => setLoanId(e.target.value)}>
              {sortedLoans.map((l) => (
                <option key={l.id} value={l.id}>
                  {(l.bookTitle ? l.bookTitle + " — " : "") + `Vence: ${l.fecha_vencimiento} · ID: ${l.id.slice(0, 6)}…`}
                </option>
              ))}
            </select>
          )}
        </div>

        <div className={styles.actions}>
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button variant="primary" onClick={submit} loading={saving} disabled={!loanId || loading}>
            Confirmar devolución
          </Button>
        </div>
      </div>
    </Modal>
  );
}
